// WebGL2 plumbing for the golden hour room: programs, render targets and
// the pass order. The room's G-buffer is drawn once per size (the camera
// is fixed) and kept; each frame only relights it:
//
//   G-buffer (when dirty) → light → dust → shafts (½ size, blurred) →
//   bloom (¼ size, two blurs) → FXAA composite to the canvas
//
// The light and bloom targets are drawn at an internal size that the
// piece picks (at or a step below the screen's DPR); the composite scales
// it up to the canvas. Nothing here allocates per frame.

import { seededRandom } from "../../hooks";
import { createProgram, uniformLocations } from "../../gl";
import type { Light, Vec3 } from "./scene";
import { BLUR_FS, BRIGHT_FS, COMPOSITE_FS, FULLSCREEN_VS, gbufferFS, lightFS, MOTES_FS, motesVS, shaftFS, type Quality } from "./shaders";

export type Frame = {
  /** Internal px of the view's target point, and world units per internal px. */
  viewX: number;
  viewY: number;
  unitsPerPx: number;
  light: Light;
  lamp: number;
  screen: number;
  hour: number;
  time: number;
  /** Density of the light shafts. */
  shaft: number;
  /** How much a fast sun stirs the dust (0..1). */
  stir: number;
  /** Stage colour (sRGB 0..1), and the theme. */
  bg: Vec3;
  dark: boolean;
  /** Light on the model's cut faces (linear). */
  studio: Vec3;
  /** The disc in internal px: centre, radius (0 hides it). */
  sunX: number;
  sunY: number;
  sunR: number;
  glow: number;
  bloom: number;
  /** How many motes to draw (≤ the count made at creation), their size and colour. */
  motes: number;
  moteScale: number;
  moteColor: Vec3;
};

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };

const QUALITY: Record<"tile" | "stage", Quality> = {
  tile: { shadowSteps: 22, lampSteps: 12, shaftSteps: 14 },
  stage: { shadowSteps: 40, lampSteps: 22, shaftSteps: 26 },
};

function makeTexture(gl: WebGL2RenderingContext, w: number, h: number, filter: number): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("golden-room: no texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function makeTarget(gl: WebGL2RenderingContext, w: number, h: number, filter: number): Target {
  const tex = makeTexture(gl, w, h, filter);
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error("golden-room: no framebuffer");
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo, w, h };
}

function freeTarget(gl: WebGL2RenderingContext, t: Target | null) {
  if (!t) return;
  gl.deleteTexture(t.tex);
  gl.deleteFramebuffer(t.fbo);
}

export class RoomRenderer {
  private gl: WebGL2RenderingContext;
  private gbuf: WebGLProgram;
  private light: WebGLProgram;
  private shaft: WebGLProgram;
  private motes: WebGLProgram;
  private bright: WebGLProgram;
  private blur: WebGLProgram;
  private composite: WebGLProgram;
  private uG: ReturnType<typeof uniformLocations>;
  private uL: ReturnType<typeof uniformLocations>;
  private uS: ReturnType<typeof uniformLocations>;
  private uM: ReturnType<typeof uniformLocations>;
  private uB: ReturnType<typeof uniformLocations>;
  private uBl: ReturnType<typeof uniformLocations>;
  private uC: ReturnType<typeof uniformLocations>;
  private vao: WebGLVertexArrayObject;
  private moteVao: WebGLVertexArrayObject;
  private moteBuffer: WebGLBuffer;
  readonly moteCount: number;

  private g0: WebGLTexture | null = null;
  private g1: WebGLTexture | null = null;
  private gFbo: WebGLFramebuffer | null = null;
  private lit: Target | null = null;
  private bloomA: Target | null = null;
  private bloomB: Target | null = null;
  private shaftA: Target | null = null;
  private shaftB: Target | null = null;
  private w = 0;
  private h = 0;
  private gView = [NaN, NaN, NaN];
  private gDirty = true;

  constructor(gl: WebGL2RenderingContext, mode: "tile" | "stage") {
    this.gl = gl;
    const q = QUALITY[mode];
    this.gbuf = createProgram(gl, FULLSCREEN_VS, gbufferFS());
    this.light = createProgram(gl, FULLSCREEN_VS, lightFS(q));
    this.shaft = createProgram(gl, FULLSCREEN_VS, shaftFS(q));
    this.motes = createProgram(gl, motesVS(), MOTES_FS);
    this.bright = createProgram(gl, FULLSCREEN_VS, BRIGHT_FS);
    this.blur = createProgram(gl, FULLSCREEN_VS, BLUR_FS);
    this.composite = createProgram(gl, FULLSCREEN_VS, COMPOSITE_FS);
    this.uG = uniformLocations(gl, this.gbuf);
    this.uL = uniformLocations(gl, this.light);
    this.uS = uniformLocations(gl, this.shaft);
    this.uM = uniformLocations(gl, this.motes);
    this.uB = uniformLocations(gl, this.bright);
    this.uBl = uniformLocations(gl, this.blur);
    this.uC = uniformLocations(gl, this.composite);

    const vao = gl.createVertexArray();
    const moteVao = gl.createVertexArray();
    const moteBuffer = gl.createBuffer();
    if (!vao || !moteVao || !moteBuffer) throw new Error("golden-room: no buffers");
    this.vao = vao;
    this.moteVao = moteVao;
    this.moteBuffer = moteBuffer;

    // dust: four random numbers per mote (where in the room, and a phase)
    this.moteCount = mode === "stage" ? 520 : 110;
    const seeds = new Float32Array(this.moteCount * 4);
    const random = seededRandom(0x60_1d);
    for (let i = 0; i < seeds.length; i++) seeds[i] = random();
    gl.bindVertexArray(moteVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, moteBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.motes, "aSeed");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /** The internal size (light and G-buffer); the G-buffer is redrawn when it changes. */
  setSize(w: number, h: number) {
    const gl = this.gl;
    w = Math.max(2, Math.round(w));
    h = Math.max(2, Math.round(h));
    if (w === this.w && h === this.h && this.lit) return;
    this.w = w;
    this.h = h;
    if (this.g0) gl.deleteTexture(this.g0);
    if (this.g1) gl.deleteTexture(this.g1);
    if (this.gFbo) gl.deleteFramebuffer(this.gFbo);
    freeTarget(gl, this.lit);
    freeTarget(gl, this.bloomA);
    freeTarget(gl, this.bloomB);
    freeTarget(gl, this.shaftA);
    freeTarget(gl, this.shaftB);

    this.g0 = makeTexture(gl, w, h, gl.NEAREST);
    this.g1 = makeTexture(gl, w, h, gl.NEAREST);
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("golden-room: no framebuffer");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.g0, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.g1, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.gFbo = fbo;
    this.lit = makeTarget(gl, w, h, gl.LINEAR);
    const bw = Math.max(1, Math.round(w / 4));
    const bh = Math.max(1, Math.round(h / 4));
    this.bloomA = makeTarget(gl, bw, bh, gl.LINEAR);
    this.bloomB = makeTarget(gl, bw, bh, gl.LINEAR);
    const sw = Math.max(1, Math.ceil(w / 2));
    const sh = Math.max(1, Math.ceil(h / 2));
    this.shaftA = makeTarget(gl, sw, sh, gl.LINEAR);
    this.shaftB = makeTarget(gl, sw, sh, gl.LINEAR);
    this.gDirty = true;
  }

  get width() {
    return this.w;
  }
  get height() {
    return this.h;
  }

  /** Draw the G-buffer again on the next frame (after a context restore, say). */
  invalidate() {
    this.gDirty = true;
  }

  private drawGBuffer(f: Frame) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.gFbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.gbuf);
    gl.uniform3f(this.uG("uView"), f.viewX, f.viewY, f.unitsPerPx);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.gView[0] = f.viewX;
    this.gView[1] = f.viewY;
    this.gView[2] = f.unitsPerPx;
    this.gDirty = false;
  }

  draw(f: Frame, canvasW: number, canvasH: number) {
    const gl = this.gl;
    const lit = this.lit;
    const bloomA = this.bloomA;
    const bloomB = this.bloomB;
    const shaftA = this.shaftA;
    const shaftB = this.shaftB;
    if (!lit || !bloomA || !bloomB || !shaftA || !shaftB || !this.g0 || !this.g1) return;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    if (this.gDirty || this.gView[0] !== f.viewX || this.gView[1] !== f.viewY || this.gView[2] !== f.unitsPerPx) {
      this.drawGBuffer(f);
    }
    gl.bindVertexArray(this.vao);

    // light
    const L = f.light;
    const u = this.uL;
    gl.bindFramebuffer(gl.FRAMEBUFFER, lit.fbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.light);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.g0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.g1);
    gl.uniform1i(u("uG0"), 0);
    gl.uniform1i(u("uG1"), 1);
    gl.uniform3f(u("uView"), f.viewX, f.viewY, f.unitsPerPx);
    gl.uniform3f(u("uWinDir"), L.winDir[0], L.winDir[1], L.winDir[2]);
    gl.uniform3f(u("uWinCol"), L.winCol[0], L.winCol[1], L.winCol[2]);
    gl.uniform1f(u("uSunShare"), L.sunShare);
    gl.uniform3f(u("uSkyTop"), L.skyTop[0], L.skyTop[1], L.skyTop[2]);
    gl.uniform3f(u("uSkyLow"), L.skyLow[0], L.skyLow[1], L.skyLow[2]);
    gl.uniform3f(u("uAmb"), L.ambient[0], L.ambient[1], L.ambient[2]);
    gl.uniform3f(u("uStudio"), f.studio[0], f.studio[1], f.studio[2]);
    gl.uniform3f(u("uBounceAt"), L.bounceAt[0], L.bounceAt[1], L.bounceAt[2]);
    gl.uniform3f(u("uBounceCol"), L.bounceCol[0], L.bounceCol[1], L.bounceCol[2]);
    gl.uniform1f(u("uLamp"), f.lamp);
    gl.uniform1f(u("uScreen"), f.screen);
    gl.uniform1f(u("uNight"), L.night);
    gl.uniform1f(u("uExposure"), L.exposure);
    gl.uniform1f(u("uHour"), f.hour);
    gl.uniform1f(u("uTime"), f.time);
    gl.uniform3f(u("uBg"), f.bg[0], f.bg[1], f.bg[2]);
    gl.uniform1f(u("uDark"), f.dark ? 1 : 0);
    gl.uniform4f(u("uSun"), f.sunX, f.sunY, f.sunR, L.discSun);
    gl.uniform3f(u("uDisc"), L.disc[0], L.disc[1], L.disc[2]);
    gl.uniform1f(u("uGlow"), f.glow);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // dust in the beam, added on top
    const count = Math.min(this.moteCount, Math.max(0, Math.round(f.motes)));
    if (count > 0) {
      const m = this.uM;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.motes);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.g0);
      gl.uniform1i(m("uG0"), 0);
      gl.uniform3f(m("uView"), f.viewX, f.viewY, f.unitsPerPx);
      gl.uniform2f(m("uSize"), this.w, this.h);
      gl.uniform1f(m("uTime"), f.time);
      gl.uniform1f(m("uStir"), f.stir);
      gl.uniform3f(m("uWinDir"), L.winDir[0], L.winDir[1], L.winDir[2]);
      gl.uniform1f(m("uScale"), f.moteScale);
      gl.uniform3f(m("uColor"), f.moteColor[0], f.moteColor[1], f.moteColor[2]);
      gl.bindVertexArray(this.moteVao);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.bindVertexArray(this.vao);
      gl.disable(gl.BLEND);
    }

    // shafts at half size, softened
    const sU = this.uS;
    gl.useProgram(this.shaft);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shaftA.fbo);
    gl.viewport(0, 0, shaftA.w, shaftA.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.g0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.g1);
    gl.uniform1i(sU("uG0"), 0);
    gl.uniform1i(sU("uG1"), 1);
    gl.uniform3f(sU("uView"), f.viewX, f.viewY, f.unitsPerPx);
    gl.uniform3f(sU("uWinDir"), L.winDir[0], L.winDir[1], L.winDir[2]);
    gl.uniform3f(sU("uWinCol"), L.winCol[0], L.winCol[1], L.winCol[2]);
    gl.uniform1f(sU("uShaft"), f.shaft);
    gl.uniform1f(sU("uExposure"), L.exposure);
    gl.uniform2f(sU("uFull"), this.w, this.h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(this.blur);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.uBl("uSrc"), 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shaftB.fbo);
    gl.bindTexture(gl.TEXTURE_2D, shaftA.tex);
    gl.uniform2f(this.uBl("uStep"), 1 / shaftA.w, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shaftA.fbo);
    gl.bindTexture(gl.TEXTURE_2D, shaftB.tex);
    gl.uniform2f(this.uBl("uStep"), 0, 1 / shaftA.h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // bloom: bright parts at a quarter size, blurred twice
    gl.useProgram(this.bright);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
    gl.viewport(0, 0, bloomA.w, bloomA.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lit.tex);
    gl.uniform1i(this.uB("uSrc"), 0);
    gl.uniform2f(this.uB("uTexel"), 1 / this.w, 1 / this.h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(this.blur);
    gl.uniform1i(this.uBl("uSrc"), 0);
    for (let pass = 0; pass < 2; pass++) {
      const spread = pass === 0 ? 1 : 2.2;
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      gl.uniform2f(this.uBl("uStep"), spread / bloomA.w, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
      gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
      gl.uniform2f(this.uBl("uStep"), 0, spread / bloomA.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // composite to the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasW, canvasH);
    gl.useProgram(this.composite);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lit.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, shaftA.tex);
    gl.uniform1i(this.uC("uLit"), 0);
    gl.uniform1i(this.uC("uBloom"), 1);
    gl.uniform1i(this.uC("uShafts"), 2);
    gl.uniform2f(this.uC("uTexel"), 1 / this.w, 1 / this.h);
    gl.uniform1f(this.uC("uBloomAmt"), f.bloom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    for (const p of [this.gbuf, this.light, this.shaft, this.motes, this.bright, this.blur, this.composite]) gl.deleteProgram(p);
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.moteVao);
    gl.deleteBuffer(this.moteBuffer);
    if (this.g0) gl.deleteTexture(this.g0);
    if (this.g1) gl.deleteTexture(this.g1);
    if (this.gFbo) gl.deleteFramebuffer(this.gFbo);
    freeTarget(gl, this.lit);
    freeTarget(gl, this.bloomA);
    freeTarget(gl, this.bloomB);
    freeTarget(gl, this.shaftA);
    freeTarget(gl, this.shaftB);
    this.lit = this.bloomA = this.bloomB = this.shaftA = this.shaftB = null;
    this.g0 = this.g1 = null;
    this.gFbo = null;
  }
}
