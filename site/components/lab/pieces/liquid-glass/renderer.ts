// WebGL2 plumbing for liquid glass: the scene pass renders the backdrop
// into a small mipmapped texture (the mips are the frost), the glass pass
// draws the screen: the backdrop again at full resolution outside the
// glass, the glass reading the texture inside it. Nothing here knows about
// React.

import { createProgram, uniformLocations } from "../../gl";
import { GLASS, SCENE, VERTEX } from "./shaders";

/**
 * Everything one frame needs, in CSS px. One instance is made per world and
 * rewritten every frame (no allocations in the loop).
 */
export type GlassFrame = {
  width: number;
  height: number;
  dpr: number;
  // shapes
  dock: Float32Array;
  dockR: number;
  drop: Float32Array;
  squash: Float32Array;
  bevelDock: number;
  bevelDrop: number;
  // backdrop
  typeRect: Float32Array;
  base: Float32Array;
  baseHi: Float32Array;
  ink: Float32Array;
  inkAlpha: number;
  c1: Float32Array;
  c1b: Float32Array;
  c2: Float32Array;
  c2b: Float32Array;
  disc: Float32Array;
  band: Float32Array;
  band2: Float32Array;
  bandAngle: number;
  grid: Float32Array;
  fade: Float32Array;
  shadow: Float32Array;
  caustic: number;
  grain: number;
  // material
  refract: number;
  frost: number;
  tint: Float32Array;
  pill: Float32Array;
  pillAmt: number;
  hover: Float32Array;
  ripples: Float32Array;
  pointer: Float32Array;
  dark: number;
  icons: Float32Array;
  plate: Float32Array;
};

export function createFrame(): GlassFrame {
  const v3 = () => new Float32Array(3);
  const v4 = () => new Float32Array(4);
  return {
    width: 0,
    height: 0,
    dpr: 1,
    dock: v4(),
    dockR: 0,
    drop: v4(),
    squash: v3(),
    bevelDock: 1,
    bevelDrop: 1,
    typeRect: v4(),
    base: v3(),
    baseHi: v3(),
    ink: v3(),
    inkAlpha: 1,
    c1: v3(),
    c1b: v3(),
    c2: v3(),
    c2b: v3(),
    disc: v4(),
    band: v4(),
    band2: v4(),
    bandAngle: 0,
    grid: v4(),
    fade: v4(),
    shadow: v4(),
    caustic: 0,
    grain: 0,
    refract: 0,
    frost: 0,
    tint: v4(),
    pill: v4(),
    pillAmt: 1,
    hover: v4(),
    ripples: new Float32Array(16),
    pointer: v3(),
    dark: 0,
    icons: v4(),
    plate: v4(),
  };
}

/** Device px per CSS px for the backdrop texture, and its pixel budget. */
const TEXTURE_DPR = 1.25;
const TEXTURE_MAX_PIXELS = 2.5e6;

type Uniforms = (name: string) => WebGLUniformLocation | null;

export class GlassRenderer {
  private gl: WebGL2RenderingContext;
  private scene: WebGLProgram;
  private glass: WebGLProgram;
  private us: Uniforms;
  private ug: Uniforms;
  private vao: WebGLVertexArrayObject;
  private fbo: WebGLFramebuffer;
  private target: WebGLTexture;
  private type: WebGLTexture;
  private tw = 0;
  private th = 0;
  private levels = 1;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.scene = createProgram(gl, VERTEX, SCENE);
    this.glass = createProgram(gl, VERTEX, GLASS);
    this.us = uniformLocations(gl, this.scene);
    this.ug = uniformLocations(gl, this.glass);
    const vao = gl.createVertexArray();
    const fbo = gl.createFramebuffer();
    const target = gl.createTexture();
    const type = gl.createTexture();
    if (!vao || !fbo || !target || !type) throw new Error("liquid-glass: could not allocate GL objects");
    this.vao = vao;
    this.fbo = fbo;
    this.target = target;
    this.type = type;

    gl.bindTexture(gl.TEXTURE_2D, type);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([0]));
  }

  /** The word mask (white on black; the red channel is read). */
  setType(source: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.type);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, source);
  }

  private ensureTarget(tw: number, th: number) {
    if (tw === this.tw && th === this.th) return;
    const gl = this.gl;
    this.tw = tw;
    this.th = th;
    this.levels = Math.floor(Math.log2(Math.max(tw, th))) + 1;
    gl.bindTexture(gl.TEXTURE_2D, this.target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.target, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** The shapes and the backdrop: both programs draw the scene. */
  private sceneUniforms(u: Uniforms, f: GlassFrame, dpr: number) {
    const gl = this.gl;
    gl.uniform2f(u("u_res"), f.width, f.height);
    gl.uniform1f(u("u_dpr"), dpr);
    gl.uniform4fv(u("u_dock"), f.dock);
    gl.uniform1f(u("u_dockR"), f.dockR);
    gl.uniform4fv(u("u_drop"), f.drop);
    gl.uniform3fv(u("u_squash"), f.squash);
    gl.uniform1i(u("u_type"), 1);
    gl.uniform4fv(u("u_typeRect"), f.typeRect);
    gl.uniform3fv(u("u_base"), f.base);
    gl.uniform3fv(u("u_baseHi"), f.baseHi);
    gl.uniform3fv(u("u_ink"), f.ink);
    gl.uniform1f(u("u_inkAlpha"), f.inkAlpha);
    gl.uniform3fv(u("u_c1"), f.c1);
    gl.uniform3fv(u("u_c1b"), f.c1b);
    gl.uniform3fv(u("u_c2"), f.c2);
    gl.uniform3fv(u("u_c2b"), f.c2b);
    gl.uniform4fv(u("u_disc"), f.disc);
    gl.uniform4fv(u("u_band"), f.band);
    gl.uniform4fv(u("u_band2"), f.band2);
    gl.uniform2f(u("u_bandRot"), Math.cos(f.bandAngle), Math.sin(f.bandAngle));
    gl.uniform4fv(u("u_grid"), f.grid);
    // grid lines keep the on-screen width in both passes
    gl.uniform1f(u("u_lineW"), Math.max(1 / Math.max(f.dpr, 1), 0.5) * 0.5);
    gl.uniform4fv(u("u_fade"), f.fade);
    gl.uniform4fv(u("u_shadow"), f.shadow);
    gl.uniform1f(u("u_caustic"), f.caustic);
  }

  draw(f: GlassFrame) {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const pw = canvas.width;
    const ph = canvas.height;
    if (pw < 2 || ph < 2 || f.width < 1 || f.height < 1) return;

    // the backdrop texture is small: the glass frosts it or magnifies it
    // only a little, and outside the glass the scene is drawn directly
    let scale = Math.min(f.dpr, TEXTURE_DPR);
    const area = f.width * f.height * scale * scale;
    if (area > TEXTURE_MAX_PIXELS) scale *= Math.sqrt(TEXTURE_MAX_PIXELS / area);
    const tw = Math.max(2, Math.round(f.width * scale));
    const th = Math.max(2, Math.round(f.height * scale));
    this.ensureTarget(tw, th);

    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.type);

    // 1. the backdrop, into the mipmapped target
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, tw, th);
    gl.useProgram(this.scene);
    this.sceneUniforms(this.us, f, tw / f.width);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.target);
    gl.generateMipmap(gl.TEXTURE_2D);

    // 2. the screen
    gl.viewport(0, 0, pw, ph);
    gl.useProgram(this.glass);
    const ug = this.ug;
    this.sceneUniforms(ug, f, pw / f.width);
    gl.uniform1i(ug("u_scene"), 0);
    gl.uniform1f(ug("u_bevelDock"), f.bevelDock);
    gl.uniform1f(ug("u_bevelDrop"), f.bevelDrop);
    gl.uniform1f(ug("u_refract"), f.refract);
    gl.uniform1f(ug("u_frost"), f.frost);
    gl.uniform4fv(ug("u_tint"), f.tint);
    gl.uniform4fv(ug("u_pill"), f.pill);
    gl.uniform1f(ug("u_pillAmt"), f.pillAmt);
    gl.uniform4fv(ug("u_hover"), f.hover);
    gl.uniform4fv(ug("u_ripples"), f.ripples);
    gl.uniform3fv(ug("u_pointer"), f.pointer);
    gl.uniform1f(ug("u_dark"), f.dark);
    gl.uniform1f(ug("u_lod"), this.levels - 1);
    gl.uniform4fv(ug("u_icons"), f.icons);
    gl.uniform4fv(ug("u_plate"), f.plate);
    gl.uniform1f(ug("u_grain"), f.grain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  /** Frees the GL objects (the context itself is released by the piece on unmount). */
  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.scene);
    gl.deleteProgram(this.glass);
    gl.deleteVertexArray(this.vao);
    gl.deleteFramebuffer(this.fbo);
    gl.deleteTexture(this.target);
    gl.deleteTexture(this.type);
  }
}

/**
 * Gives a canvas's WebGL context back to the browser once the canvas has
 * really left the document (pages mount and unmount pieces as you browse,
 * and browsers keep only about 16 contexts). Checked a tick later, so a
 * development double-mount, which keeps the canvas, is left alone.
 */
export function releaseContextLater(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  window.setTimeout(() => {
    if (canvas.isConnected) return;
    const gl = canvas.getContext("webgl2");
    if (gl && !gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext();
  }, 0);
}
