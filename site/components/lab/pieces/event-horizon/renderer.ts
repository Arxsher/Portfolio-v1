// Draws Event horizon: SCENE into an offscreen target at a fraction of the
// canvas resolution (with mipmaps for the glow), then PRESENT scales it up.

import { createProgram, FULLSCREEN_VERTEX, uniformLocations } from "../../gl";
import { PRESENT, SCENE } from "./shaders";

export type HoleFrame = {
  cam: Float32Array;
  /** Columns: right, up, back (the camera looks down -back). */
  basis: Float32Array;
  tanHalf: number;
  time: number;
  night: number;
  /** Four flares: radius, angle, start time, strength (0 = unused). */
  flares: Float32Array;
  /** Scene resolution as a fraction of the canvas. */
  scale: number;
};

export class HoleRenderer {
  private gl: WebGL2RenderingContext;
  private scene: WebGLProgram;
  private present: WebGLProgram;
  private us: (name: string) => WebGLUniformLocation | null;
  private up: (name: string) => WebGLUniformLocation | null;
  private vao: WebGLVertexArrayObject | null;
  private tex: WebGLTexture | null = null;
  private fbo: WebGLFramebuffer | null = null;
  private w = 0;
  private h = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.scene = createProgram(gl, FULLSCREEN_VERTEX, SCENE);
    this.present = createProgram(gl, FULLSCREEN_VERTEX, PRESENT);
    this.us = uniformLocations(gl, this.scene);
    this.up = uniformLocations(gl, this.present);
    this.vao = gl.createVertexArray();
  }

  private ensure(w: number, h: number) {
    if (this.tex && w === this.w && h === this.h) return;
    const gl = this.gl;
    if (this.tex) gl.deleteTexture(this.tex);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    this.w = w;
    this.h = h;
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  draw(f: HoleFrame) {
    const gl = this.gl;
    const cw = gl.drawingBufferWidth;
    const ch = gl.drawingBufferHeight;
    const w = Math.max(16, Math.round(cw * f.scale));
    const h = Math.max(16, Math.round(ch * f.scale));
    this.ensure(w, h);
    gl.bindVertexArray(this.vao);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.scene);
    const us = this.us;
    gl.uniform2f(us("uRes"), w, h);
    gl.uniform3fv(us("uCam"), f.cam);
    gl.uniformMatrix3fv(us("uBasis"), false, f.basis);
    gl.uniform1f(us("uTanHalf"), f.tanHalf);
    gl.uniform1f(us("uTime"), f.time);
    gl.uniform1f(us("uNight"), f.night);
    gl.uniform4fv(us("uFlares"), f.flares);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    gl.useProgram(this.present);
    const up = this.up;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(up("uScene"), 0);
    gl.uniform2f(up("uRes"), cw, ch);
    gl.uniform1f(up("uNight"), f.night);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.scene);
    gl.deleteProgram(this.present);
    gl.deleteVertexArray(this.vao);
    if (this.tex) gl.deleteTexture(this.tex);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    this.tex = null;
    this.fbo = null;
  }
}
