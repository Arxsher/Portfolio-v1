// WebGL2 plumbing for liquid glass: the scene pass renders the room into a
// mipmapped texture at the canvas's own resolution (half float where the
// browser can render to it, so the bulbs keep their extra light through
// the frost; 8-bit otherwise), and the glass pass draws the screen from it:
// texel for texel outside the glass, refracted and frosted (the mips)
// inside it. Nothing here knows about React.

import { createProgram, uniformLocations } from "../../gl";
import { BOKEH_SLOTS, PALETTE_KEYS } from "./scene";
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
  // the room
  time: number;
  ignite: number;
  pal: Float32Array;
  lamp: Float32Array;
  win: Float32Array;
  winBars: Float32Array;
  winSoft: Float32Array;
  sun: Float32Array;
  rain: number;
  plant: Float32Array;
  swag: Float32Array;
  swagB: Float32Array;
  bulb: Float32Array;
  bokeh: Float32Array;
  look: Float32Array;
  shadow: Float32Array;
  caustic: number;
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
  envWin: Float32Array;
  grain: number;
  grainSeed: number;
};

export function createFrame(): GlassFrame {
  const v2 = () => new Float32Array(2);
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
    time: 0,
    ignite: 0,
    pal: new Float32Array(PALETTE_KEYS.length * 3),
    lamp: v4(),
    win: v4(),
    winBars: v4(),
    winSoft: v2(),
    sun: v2(),
    rain: 10,
    plant: v4(),
    swag: new Float32Array(8),
    swagB: new Float32Array(8),
    bulb: v4(),
    bokeh: new Float32Array(BOKEH_SLOTS * 4),
    look: v4(),
    shadow: v4(),
    caustic: 0,
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
    envWin: v4(),
    grain: 0,
    grainSeed: 0,
  };
}

/**
 * Pixel budget for the scene texture. Up to it the texture matches the
 * canvas exactly (the stage at DPR 2 is about 2.7 million); past it (a big
 * screen in full screen) it scales down and is filtered up.
 */
const TEXTURE_MAX_PIXELS = 3.6e6;

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
  private tw = 0;
  private th = 0;
  private levels = 1;
  /** Half float when the browser can render to it. */
  private hdr: boolean;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.scene = createProgram(gl, VERTEX, SCENE);
    this.glass = createProgram(gl, VERTEX, GLASS);
    this.us = uniformLocations(gl, this.scene);
    this.ug = uniformLocations(gl, this.glass);
    const vao = gl.createVertexArray();
    const fbo = gl.createFramebuffer();
    const target = gl.createTexture();
    if (!vao || !fbo || !target) throw new Error("liquid-glass: could not allocate GL objects");
    this.vao = vao;
    this.fbo = fbo;
    this.target = target;
    this.hdr = !!gl.getExtension("EXT_color_buffer_float");
  }

  private allocate(tw: number, th: number) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.target);
    if (this.hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, tw, th, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.target, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok;
  }

  private ensureTarget(tw: number, th: number) {
    if (tw === this.tw && th === this.th) return;
    this.tw = tw;
    this.th = th;
    this.levels = Math.floor(Math.log2(Math.max(tw, th))) + 1;
    if (!this.allocate(tw, th) && this.hdr) {
      // the extension is there but this format isn't renderable here
      this.hdr = false;
      this.allocate(tw, th);
    }
  }

  /** The shapes: both programs need them. */
  private shapeUniforms(u: Uniforms, f: GlassFrame, dpr: number) {
    const gl = this.gl;
    gl.uniform2f(u("u_res"), f.width, f.height);
    gl.uniform1f(u("u_dpr"), dpr);
    gl.uniform4fv(u("u_dock"), f.dock);
    gl.uniform1f(u("u_dockR"), f.dockR);
    gl.uniform4fv(u("u_drop"), f.drop);
    gl.uniform3fv(u("u_squash"), f.squash);
    gl.uniform1f(u("u_bevelDock"), f.bevelDock);
    gl.uniform1f(u("u_bevelDrop"), f.bevelDrop);
    gl.uniform1f(u("u_time"), f.time);
    gl.uniform3fv(u("u_pal"), f.pal);
  }

  draw(f: GlassFrame) {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const pw = canvas.width;
    const ph = canvas.height;
    if (pw < 2 || ph < 2 || f.width < 1 || f.height < 1) return;

    let scale = 1;
    if (pw * ph > TEXTURE_MAX_PIXELS) scale = Math.sqrt(TEXTURE_MAX_PIXELS / (pw * ph));
    const tw = Math.max(2, Math.round(pw * scale));
    const th = Math.max(2, Math.round(ph * scale));
    this.ensureTarget(tw, th);

    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(this.vao);

    // 1. the room, into the mipmapped target
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, tw, th);
    gl.useProgram(this.scene);
    const us = this.us;
    this.shapeUniforms(us, f, tw / f.width);
    gl.uniform1f(us("u_ignite"), f.ignite);
    gl.uniform4fv(us("u_lamp"), f.lamp);
    gl.uniform4fv(us("u_win"), f.win);
    gl.uniform4fv(us("u_winBars"), f.winBars);
    gl.uniform2fv(us("u_winSoft"), f.winSoft);
    gl.uniform2fv(us("u_sun"), f.sun);
    gl.uniform1f(us("u_rain"), f.rain);
    gl.uniform4fv(us("u_plant"), f.plant);
    gl.uniform4fv(us("u_swag"), f.swag);
    gl.uniform4fv(us("u_swagB"), f.swagB);
    gl.uniform4fv(us("u_bulb"), f.bulb);
    gl.uniform4fv(us("u_bokeh"), f.bokeh);
    gl.uniform4fv(us("u_look"), f.look);
    gl.uniform4fv(us("u_shadow"), f.shadow);
    gl.uniform1f(us("u_caustic"), f.caustic);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.target);
    gl.generateMipmap(gl.TEXTURE_2D);

    // 2. the screen
    gl.viewport(0, 0, pw, ph);
    gl.useProgram(this.glass);
    const ug = this.ug;
    this.shapeUniforms(ug, f, pw / f.width);
    gl.uniform1i(ug("u_scene"), 0);
    gl.uniform2f(ug("u_px"), pw, ph);
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
    gl.uniform4fv(ug("u_envWin"), f.envWin);
    gl.uniform1f(ug("u_grain"), f.grain);
    gl.uniform1f(ug("u_grainSeed"), f.grainSeed);
    gl.uniform1f(ug("u_hdr"), this.hdr ? 1 : 0);
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
