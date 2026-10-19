// WebGL2 plumbing for liquid glass: the scene pass renders the backdrop
// into a mipmapped texture (the mips are the frost), the glass pass draws
// the screen from it. Nothing here knows about React.

import { createProgram, uniformLocations } from "../../gl";
import { GLASS, SCENE, VERTEX } from "./shaders";

export type Vec3 = readonly [number, number, number];
export type Vec4 = readonly [number, number, number, number];

/** Everything one frame needs, in CSS px. */
export type GlassFrame = {
  width: number;
  height: number;
  dpr: number;
  // shapes
  dock: Vec4;
  dockR: number;
  drop: Vec4;
  squash: Vec3;
  bevelDock: number;
  bevelDrop: number;
  // backdrop
  typeRect: Vec4;
  base: Vec3;
  baseHi: Vec3;
  ink: Vec3;
  inkAlpha: number;
  c1: Vec3;
  c1b: Vec3;
  c2: Vec3;
  c2b: Vec3;
  disc: Vec4;
  band: Vec4;
  bandAngle: number;
  grid: Vec4;
  fade: Vec4;
  shadow: Vec4;
  caustic: number;
  grain: number;
  // material
  refract: number;
  frost: number;
  tint: Vec4;
  pill: Vec4;
  pillAmt: number;
  hover: Vec4;
  ripples: Float32Array;
  pointer: Vec3;
  dark: number;
};

export class GlassRenderer {
  private gl: WebGL2RenderingContext;
  private scene: WebGLProgram;
  private glass: WebGLProgram;
  private us: (name: string) => WebGLUniformLocation | null;
  private ug: (name: string) => WebGLUniformLocation | null;
  private vao: WebGLVertexArrayObject;
  private fbo: WebGLFramebuffer;
  private target: WebGLTexture;
  private type: WebGLTexture;
  private pw = 0;
  private ph = 0;
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

  private ensureTarget(pw: number, ph: number) {
    if (pw === this.pw && ph === this.ph) return;
    const gl = this.gl;
    this.pw = pw;
    this.ph = ph;
    this.levels = Math.floor(Math.log2(Math.max(pw, ph))) + 1;
    gl.bindTexture(gl.TEXTURE_2D, this.target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, pw, ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.target, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private shapes(u: (name: string) => WebGLUniformLocation | null, f: GlassFrame) {
    const gl = this.gl;
    gl.uniform2f(u("u_res"), f.width, f.height);
    gl.uniform1f(u("u_dpr"), this.pw / Math.max(1, f.width));
    gl.uniform4fv(u("u_dock"), f.dock);
    gl.uniform1f(u("u_dockR"), f.dockR);
    gl.uniform4fv(u("u_drop"), f.drop);
    gl.uniform3fv(u("u_squash"), f.squash);
  }

  draw(f: GlassFrame) {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const pw = canvas.width;
    const ph = canvas.height;
    if (pw < 2 || ph < 2) return;
    this.ensureTarget(pw, ph);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(this.vao);

    // 1. the backdrop, into the mipmapped target
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, pw, ph);
    gl.useProgram(this.scene);
    const us = this.us;
    this.shapes(us, f);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.type);
    gl.uniform1i(us("u_type"), 0);
    gl.uniform4fv(us("u_typeRect"), f.typeRect);
    gl.uniform3fv(us("u_base"), f.base);
    gl.uniform3fv(us("u_baseHi"), f.baseHi);
    gl.uniform3fv(us("u_ink"), f.ink);
    gl.uniform1f(us("u_inkAlpha"), f.inkAlpha);
    gl.uniform3fv(us("u_c1"), f.c1);
    gl.uniform3fv(us("u_c1b"), f.c1b);
    gl.uniform3fv(us("u_c2"), f.c2);
    gl.uniform3fv(us("u_c2b"), f.c2b);
    gl.uniform4fv(us("u_disc"), f.disc);
    gl.uniform4fv(us("u_band"), f.band);
    gl.uniform2f(us("u_bandRot"), Math.cos(f.bandAngle), Math.sin(f.bandAngle));
    gl.uniform4fv(us("u_grid"), f.grid);
    gl.uniform4fv(us("u_fade"), f.fade);
    gl.uniform4fv(us("u_shadow"), f.shadow);
    gl.uniform1f(us("u_caustic"), f.caustic);
    gl.uniform1f(us("u_grain"), f.grain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this.target);
    gl.generateMipmap(gl.TEXTURE_2D);

    // 2. the glass, to the screen
    gl.viewport(0, 0, pw, ph);
    gl.useProgram(this.glass);
    const ug = this.ug;
    this.shapes(ug, f);
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
    gl.uniform1f(ug("u_lens"), -1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

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
