// WebGL2 plumbing for the slice. Per frame:
//
//   floor (full screen) → face + bark (depth tested, the canvas's own MSAA)
//   → if the loupe is out: the same scene again through the zoomed camera
//     into a small multisampled target, resolved, then composited through
//     the glass with its shadow (premultiplied blending)
//
// The tables (ring field, day darkness) are uploaded once; the mesh and the
// outline only when the tree grows. Nothing allocates per frame.

import { createProgram, uniformLocations } from "../../gl";
import { BARK_STRIDE, newSliceMesh, updateSliceMesh, type SliceMesh } from "./geometry";
import { FR, SEG, TH, THICKNESS, type Rings } from "./rings";
import { BARK_FS, faceFS, floorFS, FULLSCREEN_VS, LOUPE_FS, RECT_VS, SLICE_VS } from "./shaders";
import type { Mat4 } from "./view";

export type Loupe = {
  /** 0..1: how far out it is (scale and fade). */
  show: number;
  /** Centre and radius in CSS px; rim width in CSS px. */
  x: number;
  y: number;
  radius: number;
  rim: number;
  /** Shadow offset (CSS px, y down) and its strength. */
  shadowX: number;
  shadowY: number;
  shadowA: number;
  /** Toward the light on screen (unit, y down). */
  lightX: number;
  lightY: number;
  mag: number;
  vp: Mat4;
  inv: Mat4;
};

export type Frame = {
  vp: Mat4;
  inv: Mat4;
  eye: Float32Array;
  light: Float32Array;
  sun: Float32Array;
  sky: Float32Array;
  pool: Float32Array;
  /** Stage colour, sRGB 0..1. */
  bg: Float32Array;
  line: Float32Array;
  /** Dial dots: sRGB + alpha. */
  dial: Float32Array;
  dialR: number;
  exposure: number;
  relief: number;
  shadowK: number;
  soft: number;
  bump: number;
  dark: number;
  /** Device px per CSS px. */
  dpr: number;
  selA: Float32Array;
  selB: Float32Array;
  knock: Float32Array;
  /** The lamp: position (world) and how much its distance matters (0 = a far sun). */
  lamp: Float32Array;
  loupe: Loupe;
};

type Quality = { shadowSteps: number; detail: boolean; loupe: boolean };

const QUALITY: Record<"tile" | "stage", Quality> = {
  tile: { shadowSteps: 5, detail: false, loupe: false },
  stage: { shadowSteps: 9, detail: true, loupe: true },
};

export class RingRenderer {
  private gl: WebGL2RenderingContext;
  private rings: Rings;
  private floor: WebGLProgram;
  private face: WebGLProgram;
  private bark: WebGLProgram;
  private loupe: WebGLProgram | null = null;
  private uF: ReturnType<typeof uniformLocations>;
  private uFa: ReturnType<typeof uniformLocations>;
  private uB: ReturnType<typeof uniformLocations>;
  private uL: ReturnType<typeof uniformLocations> | null = null;
  private fieldTex: WebGLTexture;
  private levelTex: WebGLTexture;
  private outlineTex: WebGLTexture;
  private faceVao: WebGLVertexArrayObject;
  private barkVao: WebGLVertexArrayObject;
  private emptyVao: WebGLVertexArrayObject;
  private faceVbo: WebGLBuffer;
  private barkVbo: WebGLBuffer;
  private faceIbo: WebGLBuffer;
  private barkIbo: WebGLBuffer;
  private mesh: SliceMesh;
  private grownNow = NaN;
  private outlineHalf = new Uint16Array(SEG);

  // the loupe's targets
  private msFbo: WebGLFramebuffer | null = null;
  private msColor: WebGLRenderbuffer | null = null;
  private msDepth: WebGLRenderbuffer | null = null;
  private resolveFbo: WebGLFramebuffer | null = null;
  private resolveTex: WebGLTexture | null = null;
  private loupeSize = 0;
  private samples = 4;

  constructor(gl: WebGL2RenderingContext, mode: "tile" | "stage", rings: Rings) {
    this.gl = gl;
    this.rings = rings;
    const q = QUALITY[mode];
    this.floor = createProgram(gl, FULLSCREEN_VS, floorFS(q.shadowSteps));
    this.face = createProgram(gl, SLICE_VS, faceFS({ detail: q.detail }));
    this.bark = createProgram(gl, SLICE_VS, BARK_FS);
    this.uF = uniformLocations(gl, this.floor);
    this.uFa = uniformLocations(gl, this.face);
    this.uB = uniformLocations(gl, this.bark);
    if (q.loupe) {
      this.loupe = createProgram(gl, RECT_VS, LOUPE_FS);
      this.uL = uniformLocations(gl, this.loupe);
      this.samples = Math.max(0, Math.min(4, gl.getParameter(gl.MAX_SAMPLES) as number));
    }

    // tables
    this.fieldTex = this.floatTexture(TH, FR, rings.field, false);
    this.levelTex = this.floatTexture(7, Math.max(1, rings.n), rings.level, false);
    this.outlineTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.outlineTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, SEG, 1, 0, gl.RED, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // mesh
    this.mesh = newSliceMesh();
    this.faceVao = gl.createVertexArray()!;
    this.faceVbo = gl.createBuffer()!;
    this.faceIbo = gl.createBuffer()!;
    gl.bindVertexArray(this.faceVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.faceVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.face.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceIbo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.faceIndex, gl.STATIC_DRAW);

    this.barkVao = gl.createVertexArray()!;
    this.barkVbo = gl.createBuffer()!;
    this.barkIbo = gl.createBuffer()!;
    gl.bindVertexArray(this.barkVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.barkVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.bark.byteLength, gl.DYNAMIC_DRAW);
    const stride = BARK_STRIDE * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.barkIbo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.barkIndex, gl.STATIC_DRAW);

    this.emptyVao = gl.createVertexArray()!;
    gl.bindVertexArray(null);
    this.setGrown(rings.n);
  }

  private floatTexture(w: number, h: number, data: Float32Array, linear: boolean): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error("year-rings: no texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, w, h, 0, gl.RED, gl.FLOAT, data);
    const filter = linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  /** The tree as grown to `grown` rings: rebuilds the mesh and the outline (only when it changed). */
  setGrown(grown: number) {
    if (grown === this.grownNow) return;
    this.grownNow = grown;
    const gl = this.gl;
    updateSliceMesh(this.mesh, this.rings, grown);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.faceVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.mesh.face);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.barkVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.mesh.bark);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const half = this.outlineHalf;
    for (let i = 0; i < SEG; i++) half[i] = toHalf(this.mesh.outline[i]);
    gl.bindTexture(gl.TEXTURE_2D, this.outlineTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SEG, 1, gl.RED, gl.HALF_FLOAT, half);
  }

  /** Outer radius at SEG angles as grown now (for picking the bark). */
  get outline(): Float32Array {
    return this.mesh.outline;
  }

  private ensureLoupeTarget(size: number) {
    const gl = this.gl;
    if (size === this.loupeSize && this.msFbo) return;
    this.freeLoupeTarget();
    this.loupeSize = size;
    this.resolveTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.resolveTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.resolveFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.resolveFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.resolveTex, 0);

    this.msFbo = gl.createFramebuffer();
    this.msColor = gl.createRenderbuffer();
    this.msDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msColor);
    if (this.samples > 1) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.RGBA8, size, size);
    else gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, size, size);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msDepth);
    if (this.samples > 1) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, size, size);
    else gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, size, size);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFbo);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.msColor);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.msDepth);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private freeLoupeTarget() {
    const gl = this.gl;
    if (this.msFbo) gl.deleteFramebuffer(this.msFbo);
    if (this.msColor) gl.deleteRenderbuffer(this.msColor);
    if (this.msDepth) gl.deleteRenderbuffer(this.msDepth);
    if (this.resolveFbo) gl.deleteFramebuffer(this.resolveFbo);
    if (this.resolveTex) gl.deleteTexture(this.resolveTex);
    this.msFbo = this.msColor = this.msDepth = this.resolveFbo = null;
    this.resolveTex = null;
    this.loupeSize = 0;
  }

  private drawScene(f: Frame, vp: Mat4, inv: Mat4, dotScale: number, close: number) {
    const gl = this.gl;
    gl.clear(gl.DEPTH_BUFFER_BIT);

    // floor
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(this.floor);
    const uF = this.uF;
    gl.uniformMatrix4fv(uF("uInv"), false, inv);
    gl.uniform3fv(uF("uLight"), f.light);
    gl.uniform3fv(uF("uBg"), f.bg);
    gl.uniform3fv(uF("uPoolCol"), f.pool);
    gl.uniform1f(uF("uShadowK"), f.shadowK);
    gl.uniform1f(uF("uSoft"), f.soft);
    gl.uniform1f(uF("uH"), THICKNESS);
    gl.uniform1f(uF("uDialR"), f.dialR);
    gl.uniform4fv(uF("uDialCol"), f.dial);
    gl.uniform1f(uF("uDpr"), dotScale);
    gl.uniform4fv(uF("uLamp"), f.lamp);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.outlineTex);
    gl.uniform1i(uF("uOutline"), 0);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // the slice
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);

    gl.useProgram(this.face);
    const uA = this.uFa;
    gl.uniformMatrix4fv(uA("uVP"), false, vp);
    gl.uniform3fv(uA("uLight"), f.light);
    gl.uniform3fv(uA("uSun"), f.sun);
    gl.uniform3fv(uA("uSky"), f.sky);
    gl.uniform3fv(uA("uEye"), f.eye);
    gl.uniform1f(uA("uRelief"), f.relief);
    gl.uniform1f(uA("uExposure"), f.exposure);
    gl.uniform1i(uA("uN"), this.rings.n);
    gl.uniform1f(uA("uGrown"), this.grownNow);
    gl.uniform4fv(uA("uSelA"), f.selA);
    gl.uniform4fv(uA("uSelB"), f.selB);
    gl.uniform3fv(uA("uLineCol"), f.line);
    gl.uniform4fv(uA("uKnock"), f.knock);
    gl.uniform4fv(uA("uLamp"), f.lamp);
    gl.uniform1f(uA("uClose"), close);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.uniform1i(uA("uField"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.levelTex);
    gl.uniform1i(uA("uLevel"), 1);
    gl.bindVertexArray(this.faceVao);
    gl.drawElements(gl.TRIANGLES, SEG * 3, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(this.bark);
    const uB = this.uB;
    gl.uniformMatrix4fv(uB("uVP"), false, vp);
    gl.uniform3fv(uB("uLight"), f.light);
    gl.uniform3fv(uB("uSun"), f.sun);
    gl.uniform3fv(uB("uSky"), f.sky);
    gl.uniform3fv(uB("uEye"), f.eye);
    gl.uniform1f(uB("uExposure"), f.exposure);
    gl.uniform1f(uB("uBump"), f.bump);
    gl.uniform4fv(uB("uLamp"), f.lamp);
    gl.bindVertexArray(this.barkVao);
    gl.drawElements(gl.TRIANGLES, this.mesh.barkIndex.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
  }

  render(f: Frame, width: number, height: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    this.drawScene(f, f.vp, f.inv, f.dpr, 0);

    const lo = f.loupe;
    if (!this.loupe || !this.uL || lo.show < 0.01 || lo.radius < 2) return;
    const glassR = Math.max(1, lo.radius - lo.rim);
    const size = Math.max(16, Math.min(1024, Math.ceil(2 * glassR * f.dpr)));
    this.ensureLoupeTarget(size);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFbo);
    gl.viewport(0, 0, size, size);
    this.drawScene(f, lo.vp, lo.inv, f.dpr * lo.mag, 1);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msFbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.resolveFbo);
    gl.blitFramebuffer(0, 0, size, size, 0, 0, size, size, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

    // composite through the glass
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.loupe);
    const uL = this.uL;
    const k = f.dpr;
    const cx = lo.x * k;
    const cy = height - lo.y * k;
    const R = lo.radius * k;
    const reach = R * 1.45 + Math.hypot(lo.shadowX, lo.shadowY) * k;
    gl.uniform4f(
      uL("uRect"),
      ((cx - reach) / width) * 2 - 1,
      ((cy - reach) / height) * 2 - 1,
      ((cx + reach) / width) * 2 - 1,
      ((cy + reach) / height) * 2 - 1,
    );
    gl.uniform2f(uL("uCentre"), cx, cy);
    gl.uniform1f(uL("uR"), R);
    gl.uniform1f(uL("uRim"), lo.rim * k);
    gl.uniform2f(uL("uShadowOff"), lo.shadowX * k, -lo.shadowY * k);
    gl.uniform1f(uL("uShadowA"), lo.shadowA);
    gl.uniform2f(uL("uLightDir"), lo.lightX, -lo.lightY);
    gl.uniform1f(uL("uDark"), f.dark);
    gl.uniform1f(uL("uShow"), Math.min(1, lo.show));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.resolveTex);
    gl.uniform1i(uL("uView"), 0);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }

  dispose() {
    const gl = this.gl;
    this.freeLoupeTarget();
    gl.deleteProgram(this.floor);
    gl.deleteProgram(this.face);
    gl.deleteProgram(this.bark);
    if (this.loupe) gl.deleteProgram(this.loupe);
    gl.deleteTexture(this.fieldTex);
    gl.deleteTexture(this.levelTex);
    gl.deleteTexture(this.outlineTex);
    gl.deleteBuffer(this.faceVbo);
    gl.deleteBuffer(this.barkVbo);
    gl.deleteBuffer(this.faceIbo);
    gl.deleteBuffer(this.barkIbo);
    gl.deleteVertexArray(this.faceVao);
    gl.deleteVertexArray(this.barkVao);
    gl.deleteVertexArray(this.emptyVao);
  }
}

/** float → IEEE half (for the R16F outline). */
const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);
function toHalf(value: number): number {
  f32[0] = value;
  const x = u32[0];
  const sign = (x >>> 16) & 0x8000;
  let exp = ((x >>> 23) & 0xff) - 127 + 15;
  let mant = x & 0x7fffff;
  if (exp <= 0) return sign;
  if (exp >= 31) return sign | 0x7c00;
  // round to nearest
  mant += 0x1000;
  if (mant & 0x800000) {
    mant = 0;
    exp += 1;
    if (exp >= 31) return sign | 0x7c00;
  }
  return sign | (exp << 10) | (mant >>> 13);
}
