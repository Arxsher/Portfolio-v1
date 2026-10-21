// WebGL2 plumbing for the snow globe: programs, render targets and the
// pass order.
//
//   SCENE (only when the globe or the light changed) → two targets:
//     seen  = what is seen through the glass (alpha: distance in the water)
//     refl  = the glass's reflection (alpha: the light that gets through)
//   FLAKES every frame, into their own target (so a still globe keeps its
//     scene and only the snow is redrawn), hidden behind the diorama by
//     the distance in `seen`
//   COMPOSITE to the canvas: exposure, tone, sRGB, dither
//
// Targets are half float where the browser can render to them, else RGBA8
// with the HDR values stored at a quarter. Nothing allocates per frame.

import { createProgram, uniformLocations } from "../../gl";
import { EXPOSURE, type Vec3 } from "./scene";
import { COMPOSITE_FS, FLAKES_FS, FULLSCREEN_VS, flakesVS, sceneFS, type Quality } from "./shaders";

export type Frame = {
  /** Camera (internal px; y up from the bottom of the target). */
  centerX: number;
  centerY: number;
  focal: number;
  cam: Vec3;
  fwd: Vec3;
  right: Vec3;
  up: Vec3;
  /** Object → world rotation (column-major) and translation. */
  rot: Float32Array;
  offset: Vec3;
  /** Toward the key light, world and object space. */
  key: Vec3;
  keyO: Vec3;
  /** The camera in object space (for the flakes' paths through the glass). */
  camO: Vec3;
  /** The stage colour, as the HDR value that comes out as it. */
  bg: Vec3;
  night: number;
  win: number;
  dark: number;
  /** World: centre of the foot's underside, the globe's centre, the base's up axis. */
  foot: Vec3;
  globe: Vec3;
  footUp: Vec3;
  time: number;
  stir: number;
  /** Distance to the focal plane, blur px per unit off it, smallest flake (px). */
  focus: number;
  dof: number;
  minPx: number;
  flakes: number;
};

export function newFrame(): Frame {
  return {
    centerX: 0,
    centerY: 0,
    focal: 1,
    cam: [0, 0, 7],
    fwd: [0, 0, -1],
    right: [1, 0, 0],
    up: [0, 1, 0],
    rot: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
    offset: [0, 0, 0],
    key: [0, 1, 0],
    keyO: [0, 1, 0],
    camO: [0, 0, 7],
    bg: [1, 1, 1],
    night: 0,
    win: 0,
    dark: 0,
    foot: [0, -1.4, 0],
    globe: [0, 0, 0],
    footUp: [0, 1, 0],
    time: 0,
    stir: 0,
    focus: 7,
    dof: 0,
    minPx: 1,
    flakes: 0,
  };
}

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };

const QUALITY: Record<"tile" | "stage", Quality> = {
  tile: { steps: 56, shadowSteps: 14, baseSteps: 36 },
  stage: { steps: 88, shadowSteps: 22, baseSteps: 56 },
};

export class GlobeRenderer {
  private gl: WebGL2RenderingContext;
  private scene: WebGLProgram;
  private flakeProg: WebGLProgram;
  private composite: WebGLProgram;
  private uS: ReturnType<typeof uniformLocations>;
  private uF: ReturnType<typeof uniformLocations>;
  private uC: ReturnType<typeof uniformLocations>;
  private vao: WebGLVertexArrayObject;
  private flakeVao: WebGLVertexArrayObject;
  private posBuffer: WebGLBuffer;
  private attrBuffer: WebGLBuffer;
  private capacity: number;
  private float: boolean;
  private seen: WebGLTexture | null = null;
  private refl: WebGLTexture | null = null;
  private sceneFbo: WebGLFramebuffer | null = null;
  private flakes: Target | null = null;
  private w = 0;
  private h = 0;
  /** Largest point size this GPU draws. */
  readonly maxPoint: number;

  constructor(gl: WebGL2RenderingContext, mode: "tile" | "stage", capacity: number) {
    this.gl = gl;
    this.capacity = capacity;
    this.scene = createProgram(gl, FULLSCREEN_VS, sceneFS(QUALITY[mode]));
    this.flakeProg = createProgram(gl, flakesVS(), FLAKES_FS);
    this.composite = createProgram(gl, FULLSCREEN_VS, COMPOSITE_FS);
    this.uS = uniformLocations(gl, this.scene);
    this.uF = uniformLocations(gl, this.flakeProg);
    this.uC = uniformLocations(gl, this.composite);
    this.float = !!gl.getExtension("EXT_color_buffer_float");
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null;
    this.maxPoint = range ? range[1] : 64;

    const vao = gl.createVertexArray();
    const flakeVao = gl.createVertexArray();
    const posBuffer = gl.createBuffer();
    const attrBuffer = gl.createBuffer();
    if (!vao || !flakeVao || !posBuffer || !attrBuffer) throw new Error("snow-globe: no buffers");
    this.vao = vao;
    this.flakeVao = flakeVao;
    this.posBuffer = posBuffer;
    this.attrBuffer = attrBuffer;
    gl.bindVertexArray(flakeVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, capacity * 16, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, capacity * 16, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /** Per-flake constants (seed, kind, phase, spin), once. */
  setAttributes(attr: Float32Array) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.attrBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, attr, 0, Math.min(attr.length, this.capacity * 4));
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  get width() {
    return this.w;
  }
  get height() {
    return this.h;
  }
  /** HDR values are stored at this scale (1 in half float). */
  get encode() {
    return this.float ? 1 : 0.25;
  }

  private texture(w: number, h: number): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error("snow-globe: no texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  private free() {
    const gl = this.gl;
    if (this.seen) gl.deleteTexture(this.seen);
    if (this.refl) gl.deleteTexture(this.refl);
    if (this.sceneFbo) gl.deleteFramebuffer(this.sceneFbo);
    if (this.flakes) {
      gl.deleteTexture(this.flakes.tex);
      gl.deleteFramebuffer(this.flakes.fbo);
    }
    this.seen = this.refl = null;
    this.sceneFbo = null;
    this.flakes = null;
  }

  private allocate(w: number, h: number): boolean {
    const gl = this.gl;
    this.free();
    this.seen = this.texture(w, h);
    this.refl = this.texture(w, h);
    const fbo = gl.createFramebuffer();
    const flakeTex = this.texture(w, h);
    const flakeFbo = gl.createFramebuffer();
    if (!fbo || !flakeFbo) throw new Error("snow-globe: no framebuffer");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.seen, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.refl, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, flakeFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, flakeTex, 0);
    const ok2 = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.sceneFbo = fbo;
    this.flakes = { tex: flakeTex, fbo: flakeFbo };
    return ok && ok2;
  }

  /** The internal size (all targets). */
  setSize(w: number, h: number) {
    w = Math.max(2, Math.round(w));
    h = Math.max(2, Math.round(h));
    if (w === this.w && h === this.h && this.seen) return;
    this.w = w;
    this.h = h;
    if (!this.allocate(w, h) && this.float) {
      // half float isn't renderable here after all
      this.float = false;
      this.allocate(w, h);
    }
  }

  /** Upload this frame's flake positions (x, y, z, ±radius). */
  setFlakes(pos: Float32Array, count: number) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos, 0, Math.min(count, this.capacity) * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private camera(u: ReturnType<typeof uniformLocations>, f: Frame) {
    const gl = this.gl;
    gl.uniform3f(u("uCam"), f.cam[0], f.cam[1], f.cam[2]);
    gl.uniform3f(u("uFwd"), f.fwd[0], f.fwd[1], f.fwd[2]);
    gl.uniform3f(u("uRight"), f.right[0], f.right[1], f.right[2]);
    gl.uniform3f(u("uUp"), f.up[0], f.up[1], f.up[2]);
    gl.uniform1f(u("uFocal"), f.focal);
    gl.uniform2f(u("uCenter"), f.centerX, f.centerY);
    gl.uniformMatrix3fv(u("uRot"), false, f.rot);
    gl.uniform3f(u("uOffset"), f.offset[0], f.offset[1], f.offset[2]);
    gl.uniform1f(u("uNight"), f.night);
    gl.uniform1f(u("uWin"), f.win);
    gl.uniform1f(u("uEnc"), this.encode);
  }

  /** The globe, the base, the floor (only when something about them changed). */
  drawScene(f: Frame) {
    const gl = this.gl;
    if (!this.sceneFbo) return;
    const u = this.uS;
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.scene);
    this.camera(u, f);
    gl.uniform3f(u("uKey"), f.key[0], f.key[1], f.key[2]);
    gl.uniform3f(u("uBg"), f.bg[0], f.bg[1], f.bg[2]);
    gl.uniform1f(u("uDark"), f.dark);
    gl.uniform3f(u("uFoot"), f.foot[0], f.foot[1], f.foot[2]);
    gl.uniform3f(u("uGlobe"), f.globe[0], f.globe[1], f.globe[2]);
    gl.uniform3f(u("uFootUp"), f.footUp[0], f.footUp[1], f.footUp[2]);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** The snow, then the composite to the canvas. */
  drawFrame(f: Frame, canvasW: number, canvasH: number) {
    const gl = this.gl;
    const flakes = this.flakes;
    if (!flakes || !this.seen || !this.refl) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, flakes.fbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const count = Math.min(this.capacity, f.flakes);
    if (count > 0) {
      const u = this.uF;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.flakeProg);
      this.camera(u, f);
      gl.uniform3f(u("uCamO"), f.camO[0], f.camO[1], f.camO[2]);
      gl.uniform3f(u("uKeyO"), f.keyO[0], f.keyO[1], f.keyO[2]);
      gl.uniform2f(u("uSize"), this.w, this.h);
      gl.uniform1f(u("uTime"), f.time);
      gl.uniform1f(u("uStir"), f.stir);
      gl.uniform1f(u("uFocus"), f.focus);
      gl.uniform1f(u("uDof"), f.dof);
      gl.uniform1f(u("uMinPx"), f.minPx);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.seen);
      gl.uniform1i(u("uSeen"), 0);
      gl.bindVertexArray(this.flakeVao);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.disable(gl.BLEND);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasW, canvasH);
    gl.useProgram(this.composite);
    const c = this.uC;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.seen);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.refl);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, flakes.tex);
    gl.uniform1i(c("uSeen"), 0);
    gl.uniform1i(c("uRefl"), 1);
    gl.uniform1i(c("uFlakes"), 2);
    gl.uniform2f(c("uCanvas"), canvasW, canvasH);
    gl.uniform1f(c("uDec"), 1 / this.encode);
    gl.uniform1f(c("uExposure"), EXPOSURE);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    this.free();
    gl.deleteProgram(this.scene);
    gl.deleteProgram(this.flakeProg);
    gl.deleteProgram(this.composite);
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.flakeVao);
    gl.deleteBuffer(this.posBuffer);
    gl.deleteBuffer(this.attrBuffer);
  }
}
