// WebGL2 side: one program, three small textures (the drop's profile, the
// wet film and the label mask), drawn once per frame inside a scissor box
// around the bar. Nothing is allocated per frame.

import { createProgram, uniformLocations } from "../../gl";
import type { Profile, Wet } from "./profile";
import { WET_STEP } from "./profile";
import { FRAGMENT, VERTEX } from "./shaders";

export type Vec3 = [number, number, number];

export type Frame = {
  /** Backing store size (device px) and the DPR it was made for. */
  width: number;
  height: number;
  dpr: number;
  /** The bar (CSS px inside the canvas). */
  bar: { x: number; y: number; width: number; height: number };
  dropH: number;
  dark: number;
  floor: Vec3;
  label: Vec3;
  fg: Vec3;
  ink: Vec3;
  onInk: Vec3;
  lip: Vec3;
  /** from, to, wipe progress (0..1; ≥ 1 done), wipe origin x. */
  mat: [number, number, number, number];
  ripple: [number, number, number];
  press: number;
  wetK: number;
};

export class LiquidRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject | null;
  private u: (name: string) => WebGLUniformLocation | null;
  private profileTex: WebGLTexture | null;
  private wetTex: WebGLTexture | null;
  private labelTex: WebGLTexture | null;
  private profileW = 0;
  private wetW = 0;
  private hasLabels = false;
  /** The box drawn last frame (device px), cleared before the next one. */
  private last = { x: 0, y: 0, w: 0, h: 0 };

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = createProgram(gl, VERTEX, FRAGMENT);
    this.u = uniformLocations(gl, this.program);
    this.vao = gl.createVertexArray();
    const make = (filter: number) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.profileTex = make(gl.NEAREST);
    this.wetTex = make(gl.LINEAR);
    this.labelTex = make(gl.LINEAR);
    // a blank label mask until the real one is drawn
    gl.bindTexture(gl.TEXTURE_2D, this.labelTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.useProgram(this.program);
    gl.uniform1i(this.u("uProfile"), 0);
    gl.uniform1i(this.u("uWet"), 1);
    gl.uniform1i(this.u("uLabels"), 2);
  }

  /** Upload the label mask (a canvas the size of the bar at device px). */
  setLabels(canvas: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.labelTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    this.hasLabels = true;
  }

  get labelsReady() {
    return this.hasLabels;
  }

  render(f: Frame, profile: Profile, wet: Wet) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    // profile: RG32F, one texel per sample (read with texelFetch)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.profileTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if (this.profileW !== profile.count) {
      this.profileW = profile.count;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, profile.count, 1, 0, gl.RG, gl.FLOAT, profile.data);
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, profile.count, 1, gl.RG, gl.FLOAT, profile.data);
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.wetTex);
    const wl = wet.bytes.length;
    if (this.wetW !== wl) {
      this.wetW = wl;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, wl, 1, 0, gl.RED, gl.UNSIGNED_BYTE, wet.bytes);
      wet.dirty = false;
    } else if (wet.dirty) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, wl, 1, gl.RED, gl.UNSIGNED_BYTE, wet.bytes);
      wet.dirty = false;
    }

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.labelTex);

    const u = this.u;
    gl.uniform2f(u("uCanvas"), f.width, f.height);
    gl.uniform1f(u("uDpr"), f.dpr);
    gl.uniform4f(u("uBar"), f.bar.x, f.bar.y, f.bar.width, f.bar.height);
    gl.uniform1f(u("uDropH"), f.dropH);
    gl.uniform3f(u("uProf"), profile.origin, 1 / profile.step, profile.count);
    gl.uniform1f(u("uWetLen"), wl * WET_STEP);
    gl.uniform1f(u("uDark"), f.dark);
    gl.uniform3f(u("uFloor"), f.floor[0], f.floor[1], f.floor[2]);
    gl.uniform3f(u("uLabelCol"), f.label[0], f.label[1], f.label[2]);
    gl.uniform3f(u("uFg"), f.fg[0], f.fg[1], f.fg[2]);
    gl.uniform3f(u("uOnInk"), f.onInk[0], f.onInk[1], f.onInk[2]);
    gl.uniform3f(u("uInk"), f.ink[0], f.ink[1], f.ink[2]);
    gl.uniform3f(u("uLip"), f.lip[0], f.lip[1], f.lip[2]);
    gl.uniform4f(u("uMat"), f.mat[0], f.mat[1], f.mat[2], f.mat[3]);
    gl.uniform4f(u("uRipple"), f.ripple[0], f.ripple[1], f.ripple[2], 0);
    gl.uniform1f(u("uPress"), f.press);
    gl.uniform1f(u("uWetK"), f.wetK);

    // the bar plus a pixel or two for the lip, in device px (GL's y is up)
    const m = 3;
    const x0 = Math.max(0, Math.floor((f.bar.x - m) * f.dpr));
    const y0 = Math.max(0, Math.floor((f.bar.y - m) * f.dpr));
    const x1 = Math.min(f.width, Math.ceil((f.bar.x + f.bar.width + m) * f.dpr));
    const y1 = Math.min(f.height, Math.ceil((f.bar.y + f.bar.height + m) * f.dpr));
    const box = { x: x0, y: f.height - y1, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };

    gl.enable(gl.SCISSOR_TEST);
    const l = this.last;
    if (l.w > 0 && (l.x !== box.x || l.y !== box.y || l.w !== box.w || l.h !== box.h)) {
      gl.scissor(l.x, l.y, l.w, l.h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.scissor(box.x, box.y, box.w, box.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    l.x = box.x;
    l.y = box.y;
    l.w = box.w;
    l.h = box.h;
  }

  /** The canvas was resized (its contents are gone): forget the last box. */
  resized() {
    this.last.w = 0;
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.profileTex);
    gl.deleteTexture(this.wetTex);
    gl.deleteTexture(this.labelTex);
  }
}
