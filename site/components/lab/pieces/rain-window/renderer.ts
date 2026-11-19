// WebGL2 for the rain window: the passes are described in shaders.ts.
// Everything is allocated in the constructor and setSize(); the frame
// functions only upload into existing buffers and draw.

import { createProgram, uniformLocations } from "../../gl";
import { FOG_BACK, BREATH_FADE, WET_FADE, type Stamps } from "./fog";
import type { WindowLayout } from "./layout";
import { LIGHT_STRIDE, MAX_LIGHTS, type City } from "./scene";
import {
  CAR_FS,
  CAR_VS,
  COMPOSITE_FS,
  FADE_FS,
  FIELD_FS,
  FIELD_VS,
  QUAD_VS,
  SCENE_BASE_FS,
  SCENE_LIGHTS_FS,
  SCENE_LIGHTS_VS,
  STAMP_FS,
  STAMP_VS,
} from "./shaders";
import type { Water } from "./water";

type Uniforms = (name: string) => WebGLUniformLocation | null;

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; mips: boolean };

/** What the piece hands over each frame. */
export type RainFrame = {
  night: number;
  flash: number;
  /** scene x of the lightning */
  flashX: number;
  time: number;
  /** parallax, scene units */
  parX: number;
  parY: number;
  /** the stage colour, linear */
  wall: Float32Array;
  fogLo: number;
  fogHi: number;
  /** the fingertip ring: x, y, radius, alpha (CSS px) */
  ring: Float32Array;
  pressed: number;
  /** the wipes fog back (false under reduced motion) */
  fogBack: boolean;
};

export function newRainFrame(): RainFrame {
  return {
    night: 0,
    flash: 0,
    flashX: 0,
    time: 0,
    parX: 0,
    parY: 0,
    wall: new Float32Array([0.89, 0.89, 0.89]),
    fogLo: 0.3,
    fogHi: 0.94,
    ring: new Float32Array(4),
    pressed: 0,
    fogBack: true,
  };
}

/** Texels per CSS px for each target. */
const SCALES = {
  stage: { sharp: 0.5, bokeh: 0.62, fog: 0.25, fogMap: 0.5 },
  tile: { sharp: 0.75, bokeh: 0.9, fog: 0.4, fogMap: 0.75 },
} as const;

/** Out-of-focus disc radius and fog blur, in scene units (glass heights). */
const COC = 0.036;
const FOG_BLUR = 0.19;
/** Where the glass's middle looks, in scene y (up is negative). */
const VIEW_Y = -0.1;

export class RainRenderer {
  private gl: WebGL2RenderingContext;
  private tile: boolean;
  readonly float: boolean;

  private base: WebGLProgram;
  private cars: WebGLProgram;
  private lights: WebGLProgram;
  private field: WebGLProgram;
  private fade: WebGLProgram;
  private stamp: WebGLProgram;
  private comp: WebGLProgram;
  private uBase: Uniforms;
  private uCars: Uniforms;
  private uLights: Uniforms;
  private uField: Uniforms;
  private uFade: Uniforms;
  private uStamp: Uniforms;
  private uComp: Uniforms;

  private emptyVao: WebGLVertexArrayObject;
  private lightVao: WebGLVertexArrayObject;
  private lightBuf: WebGLBuffer;
  private carVao: WebGLVertexArrayObject;
  private carBuf: WebGLBuffer;
  private outerVao: WebGLVertexArrayObject;
  private outerBuf: WebGLBuffer;
  private outerCap = 0;
  private innerVao: WebGLVertexArrayObject;
  private innerBuf: WebGLBuffer;
  private innerCap = 0;
  private stampVao: WebGLVertexArrayObject;
  private stampBuf: WebGLBuffer;

  private sharp: Target | null = null;
  private bokeh: Target | null = null;
  private fogScene: Target | null = null;
  // the street's still part (sky, towers, facades, road), redrawn only when it changes
  private baseSharp: Target | null = null;
  private baseBokeh: Target | null = null;
  private baseFog: Target | null = null;
  private baseSig = new Float32Array(6).fill(NaN);
  private fieldT: Target | null = null;
  private fogMap: Target | null = null;

  // layout, in the forms the shaders take
  private panes = new Float32Array(12);
  private paneN = 1;
  private glass = new Float32Array(4);
  private casing = new Float32Array(4);
  private opening = new Float32Array(4);
  private wood = new Float32Array(4);
  private sill = new Float32Array(4);
  private sill2 = new Float32Array(4);
  private sceneRect = new Float32Array(4);
  private domain = new Float32Array(4);
  private lens = 100;
  private glassH = 1;
  private cssW = 1;
  private pxW = 1;
  private pxH = 1;
  private fieldScale = 1;

  // the fog's fade, in whole 8-bit steps
  private accR = 0;
  private accG = 0;
  private accB = 0;
  private fogCleared = false;

  constructor(gl: WebGL2RenderingContext, tile: boolean) {
    this.gl = gl;
    this.tile = tile;
    this.float = !!gl.getExtension("EXT_color_buffer_float");
    this.base = createProgram(gl, QUAD_VS, SCENE_BASE_FS);
    this.cars = createProgram(gl, CAR_VS, CAR_FS);
    this.lights = createProgram(gl, SCENE_LIGHTS_VS, SCENE_LIGHTS_FS);
    this.field = createProgram(gl, FIELD_VS, FIELD_FS);
    this.fade = createProgram(gl, QUAD_VS, FADE_FS);
    this.stamp = createProgram(gl, STAMP_VS, STAMP_FS);
    this.comp = createProgram(gl, QUAD_VS, COMPOSITE_FS);
    this.uBase = uniformLocations(gl, this.base);
    this.uCars = uniformLocations(gl, this.cars);
    this.uLights = uniformLocations(gl, this.lights);
    this.uField = uniformLocations(gl, this.field);
    this.uFade = uniformLocations(gl, this.fade);
    this.uStamp = uniformLocations(gl, this.stamp);
    this.uComp = uniformLocations(gl, this.comp);

    const vao = () => {
      const v = gl.createVertexArray();
      if (!v) throw new Error("rain-window: no vertex array");
      return v;
    };
    const buffer = (bytes: number) => {
      const b = gl.createBuffer();
      if (!b) throw new Error("rain-window: no buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, bytes, gl.DYNAMIC_DRAW);
      return b;
    };
    this.emptyVao = vao();

    this.lightVao = vao();
    gl.bindVertexArray(this.lightVao);
    this.lightBuf = buffer(MAX_LIGHTS * LIGHT_STRIDE * 4);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
    gl.vertexAttribDivisor(1, 1);

    this.carVao = vao();
    gl.bindVertexArray(this.carVao);
    this.carBuf = buffer(4 * 16);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(0, 1);

    this.outerVao = vao();
    gl.bindVertexArray(this.outerVao);
    this.outerBuf = buffer(16);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(0, 1);

    this.innerVao = vao();
    gl.bindVertexArray(this.innerVao);
    this.innerBuf = buffer(16);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(0, 1);

    this.stampVao = vao();
    gl.bindVertexArray(this.stampVao);
    this.stampBuf = buffer(512 * 32);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
    gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);
  }

  /* -------------------------------------------------------------------- */
  /* targets                                                               */
  /* -------------------------------------------------------------------- */

  private makeTarget(w: number, h: number, hdr: boolean, mips: boolean): Target {
    const gl = this.gl;
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) throw new Error("rain-window: no render target");
    w = Math.max(2, Math.min(2048, Math.round(w)));
    h = Math.max(2, Math.min(2048, Math.round(h)));
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (hdr && this.float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h, mips };
  }

  private dropTarget(t: Target | null) {
    if (!t) return;
    this.gl.deleteTexture(t.tex);
    this.gl.deleteFramebuffer(t.fbo);
  }

  /**
   * Size everything for a canvas of pxW × pxH device px that is cssW CSS px
   * wide, with the window at `l`. `fieldScale`: field texels per CSS px.
   */
  setSize(pxW: number, pxH: number, cssW: number, l: WindowLayout, fieldScale: number) {
    this.pxW = pxW;
    this.pxH = pxH;
    this.cssW = cssW;
    this.fieldScale = fieldScale;
    this.paneN = l.paneCount;
    this.panes.fill(0);
    for (let i = 0; i < l.paneCount; i++) {
      const p = l.panes[i];
      this.panes.set([p.x, p.y, p.w, p.h], i * 4);
    }
    this.glass.set([l.glass.x, l.glass.y, l.glass.w, l.glass.h]);
    this.casing.set([l.casing.x, l.casing.y, l.casing.w, l.casing.h]);
    this.opening.set([l.opening.x, l.opening.y, l.opening.w, l.opening.h]);
    this.wood.set([l.casingW, l.stile, l.bottomRail, l.unit]);
    this.sill.set([l.sillX0, l.sillX1, l.sillY, l.sillTop]);
    this.sill2.set([l.nose, l.apron, l.handleX, l.handleY]);
    this.glassH = Math.max(1, l.glass.h);
    // how far a drop's lens reaches into the street
    this.lens = this.glassH * 0.13;
    const margin = this.lens * 1.15 + 24;
    const rx = l.glass.x - margin;
    const ry = l.glass.y - margin;
    const rw = l.glass.w + margin * 2;
    const rh = l.glass.h + margin * 2;
    this.sceneRect.set([rx, ry, rw, rh]);
    const cx = l.glass.x + l.glass.w / 2;
    const cy = l.glass.y + l.glass.h / 2;
    // the eye is a little above the street: the kerb sits low in the glass, the shopfronts behind the thick fog
    this.domain.set([(rx - cx) / this.glassH, (ry - cy) / this.glassH + VIEW_Y, rw / this.glassH, rh / this.glassH]);

    const s = this.tile ? SCALES.tile : SCALES.stage;
    this.sharp = this.ensure(this.sharp, rw * s.sharp, rh * s.sharp, true, true);
    this.bokeh = this.ensure(this.bokeh, rw * s.bokeh, rh * s.bokeh, true, false);
    this.fogScene = this.ensure(this.fogScene, rw * s.fog, rh * s.fog, true, false);
    this.baseSharp = this.ensure(this.baseSharp, rw * s.sharp, rh * s.sharp, true, false);
    this.baseBokeh = this.ensure(this.baseBokeh, rw * s.bokeh, rh * s.bokeh, true, false);
    this.baseFog = this.ensure(this.baseFog, rw * s.fog, rh * s.fog, true, false);
    this.baseSig.fill(NaN);
    this.fieldT = this.ensure(this.fieldT, l.glass.w * fieldScale, l.glass.h * fieldScale, true, true);
    const fog = this.ensure(this.fogMap, l.glass.w * s.fogMap, l.glass.h * s.fogMap, false, false);
    if (fog !== this.fogMap) this.fogCleared = true;
    this.fogMap = fog;
  }

  /** The target as it is if its size holds, else a new one (a DPR step keeps the fog map). */
  private ensure(t: Target | null, w: number, h: number, hdr: boolean, mips: boolean): Target {
    const W = Math.max(2, Math.min(2048, Math.round(w)));
    const H = Math.max(2, Math.min(2048, Math.round(h)));
    if (t && t.w === W && t.h === H) return t;
    this.dropTarget(t);
    return this.makeTarget(W, H, hdr, mips);
  }

  /** The scene x range the glass (and the lens margin) shows. */
  sceneRange(out: { x0: number; x1: number }) {
    out.x0 = this.domain[0];
    out.x1 = this.domain[0] + this.domain[2];
    return out;
  }

  /** Did setSize() just start a fresh (clear) fog map? Reading it resets the flag. */
  takeFogReset(): boolean {
    const v = this.fogCleared;
    this.fogCleared = false;
    return v;
  }

  /* -------------------------------------------------------------------- */
  /* passes                                                                */
  /* -------------------------------------------------------------------- */

  private bind(t: Target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.viewport(0, 0, t.w, t.h);
  }

  /** Has the street's still part changed since it was last drawn? */
  private baseChanged(f: RainFrame): boolean {
    const sig = this.baseSig;
    const v0 = f.night;
    const v1 = f.flash;
    const v2 = f.flashX;
    const v3 = f.parX;
    const v4 = f.parY;
    const changed =
      !(Math.abs(sig[0] - v0) <= 1e-3) ||
      !(Math.abs(sig[1] - v1) <= 2e-3) ||
      !(Math.abs(sig[2] - v2) <= 1e-3) ||
      !(Math.abs(sig[3] - v3) <= 2e-4) ||
      !(Math.abs(sig[4] - v4) <= 2e-4);
    if (changed) {
      sig[0] = v0;
      sig[1] = v1;
      sig[2] = v2;
      sig[3] = v3;
      sig[4] = v4;
    }
    return changed;
  }

  /** The street, into the three scene targets: the still part (cached), the cars, the lights. */
  drawScene(city: City, f: RainFrame) {
    const gl = this.gl;
    if (!this.sharp || !this.bokeh || !this.fogScene || !this.baseSharp || !this.baseBokeh || !this.baseFog) return;
    const range = this.domain;
    const count = city.fill(range[0] - 0.2, range[0] + range[2] + 0.2, f.parX, f.parY);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lightBuf);
    if (count > 0) gl.bufferSubData(gl.ARRAY_BUFFER, 0, city.out, 0, count * LIGHT_STRIDE);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.carBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, city.carBodies);
    const redrawBase = this.baseChanged(f);

    gl.disable(gl.DEPTH_TEST);
    for (let m = 0; m < 3; m++) {
      const t = m === 0 ? this.sharp : m === 1 ? this.bokeh : this.fogScene;
      const base = m === 0 ? this.baseSharp : m === 1 ? this.baseBokeh : this.baseFog;
      const px = range[3] / t.h;
      const blur = m === 0 ? px * 0.8 : m === 1 ? COC : FOG_BLUR;
      const edge = m === 0 ? px * 0.8 : m === 1 ? blur * 0.55 : blur * 0.7;
      // the still part: sky, towers, facades, the road and its reflections
      if (redrawBase) {
        this.bind(base);
        gl.disable(gl.BLEND);
        gl.useProgram(this.base);
        const u = this.uBase;
        gl.uniform4fv(u("uDomain"), range);
        gl.uniform1f(u("uBlur"), edge);
        gl.uniform1f(u("uNight"), f.night);
        gl.uniform1f(u("uFlash"), f.flash);
        gl.uniform1f(u("uFlashX"), f.flashX);
        gl.uniform2f(u("uPar"), f.parX, f.parY);
        gl.uniform4fv(u("uB"), city.buildings);
        gl.uniform4fv(u("uG"), city.grids);
        gl.uniform1fv(u("uF"), city.floors);
        gl.uniform1i(u("uBN"), city.buildingN);
        gl.uniform4fv(u("uAwn"), city.awnings);
        gl.uniform4fv(u("uLamp"), city.lamps);
        gl.uniform1i(u("uLampN"), city.lampN);
        gl.uniform3fv(u("uTower"), city.tower);
        gl.uniform2fv(u("uTraffic"), city.traffic);
        gl.bindVertexArray(this.emptyVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      // copy it in
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, base.fbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, t.fbo);
      gl.blitFramebuffer(0, 0, base.w, base.h, 0, 0, t.w, t.h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      this.bind(t);
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      // the cars' bodies, for the drops (out of focus they would only be smudges)
      if (m === 0) {
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.useProgram(this.cars);
        const c = this.uCars;
        gl.uniform4fv(c("uDomain"), range);
        gl.uniform1f(c("uBlur"), edge);
        gl.uniform1f(c("uNight"), f.night);
        gl.uniform2f(c("uPar"), f.parX, f.parY);
        gl.bindVertexArray(this.carVao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 4);
      }
      // the lights, added
      if (count > 0) {
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(this.lights);
        const l = this.uLights;
        gl.uniform4fv(l("uDomain"), range);
        gl.uniform1f(l("uBlur"), blur);
        gl.uniform1i(l("uMode"), m);
        gl.uniform1f(l("uPx"), px);
        gl.uniform1f(l("uTime"), f.time);
        gl.bindVertexArray(this.lightVao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      }
    }
    gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, this.sharp.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindVertexArray(null);
  }

  private upload(which: "outer" | "inner", water: Water) {
    const gl = this.gl;
    const n = water.instanceCount;
    const buf = which === "outer" ? this.outerBuf : this.innerBuf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const cap = which === "outer" ? this.outerCap : this.innerCap;
    if (n > cap) {
      const next = Math.max(n, water.instances.length / 4);
      gl.bufferData(gl.ARRAY_BUFFER, next * 16, gl.DYNAMIC_DRAW);
      if (which === "outer") this.outerCap = next;
      else this.innerCap = next;
    }
    if (n > 0) gl.bufferSubData(gl.ARRAY_BUFFER, 0, water.instances, 0, n * 4);
  }

  /** The drops and beads, outside (R, G) and inside (B, A). */
  drawField(outer: Water, inner: Water, outerDirty: boolean, innerDirty: boolean) {
    const gl = this.gl;
    const t = this.fieldT;
    if (!t) return;
    if (outerDirty) this.upload("outer", outer);
    if (innerDirty) this.upload("inner", inner);
    this.bind(t);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.field);
    const u = this.uField;
    gl.uniform4fv(u("uGlass"), this.glass);
    gl.uniform1f(u("uTexel"), 1 / this.fieldScale);
    gl.uniform1f(u("uRScale"), this.float ? 1 : 1 / 24);
    if (outer.instanceCount > 0) {
      gl.colorMask(true, true, false, false);
      gl.bindVertexArray(this.outerVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, outer.instanceCount);
    }
    if (inner.instanceCount > 0) {
      gl.colorMask(false, false, true, true);
      gl.bindVertexArray(this.innerVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, inner.instanceCount);
    }
    gl.colorMask(true, true, true, true);
    gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindVertexArray(null);
  }

  /** The fog map: let it relax by dt (if `back`), then lay this frame's stamps. */
  updateFog(stamps: Stamps, dt: number, back: boolean) {
    const gl = this.gl;
    const t = this.fogMap;
    if (!t) return;
    // under reduced motion nothing fades: a wipe stays wiped, a breath stays
    const span = back ? dt : 0;
    this.accR += (span / FOG_BACK) * 255;
    this.accG += (span / BREATH_FADE) * 255;
    this.accB += (span / WET_FADE) * 255;
    const kR = Math.floor(this.accR);
    const kG = Math.floor(this.accG);
    const kB = Math.floor(this.accB);
    this.accR -= kR;
    this.accG -= kG;
    this.accB -= kB;
    if (kR + kG + kB === 0 && stamps.count === 0) return;
    this.bind(t);
    gl.enable(gl.BLEND);
    if (kR + kG + kB > 0) {
      gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.fade);
      gl.uniform4f(this.uFade("uAmount"), kR / 255, kG / 255, kB / 255, 0);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (stamps.count > 0) {
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.useProgram(this.stamp);
      gl.uniform4fv(this.uStamp("uGlass"), this.glass);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.stampBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, stamps.data, 0, stamps.count * 8);
      gl.bindVertexArray(this.stampVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, stamps.count);
    }
    gl.disable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.bindVertexArray(null);
  }

  /** Everything, onto the canvas. */
  composite(f: RainFrame) {
    const gl = this.gl;
    if (!this.sharp || !this.bokeh || !this.fogScene || !this.fieldT || !this.fogMap) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.pxW, this.pxH);
    gl.disable(gl.BLEND);
    gl.useProgram(this.comp);
    const u = this.uComp;
    gl.uniform2f(u("uRes"), this.pxW, this.pxH);
    gl.uniform1f(u("uScale"), this.pxW / Math.max(1, this.cssW));
    gl.uniform4fv(u("uCasing"), this.casing);
    gl.uniform4fv(u("uOpening"), this.opening);
    gl.uniform4fv(u("uPanes"), this.panes);
    gl.uniform1i(u("uPaneN"), this.paneN);
    gl.uniform4fv(u("uGlass"), this.glass);
    gl.uniform4fv(u("uWood"), this.wood);
    gl.uniform4fv(u("uSill"), this.sill);
    gl.uniform4fv(u("uSill2"), this.sill2);
    gl.uniform4fv(u("uSceneRect"), this.sceneRect);
    gl.uniform2f(u("uFieldTexel"), 1 / this.fieldT.w, 1 / this.fieldT.h);
    gl.uniform1f(u("uFieldCss"), this.glass[2] / this.fieldT.w);
    gl.uniform1f(u("uNight"), f.night);
    gl.uniform1f(u("uFlash"), f.flash);
    gl.uniform1f(u("uTime"), f.time);
    gl.uniform3fv(u("uWall"), f.wall);
    gl.uniform2f(u("uFogLevel"), f.fogLo, f.fogHi);
    gl.uniform1f(u("uLens"), this.lens);
    gl.uniform4fv(u("uRing"), f.ring);
    gl.uniform1f(u("uPressed"), f.pressed);
    gl.uniform1f(u("uTile"), this.tile ? 1 : 0);
    gl.uniform1f(u("uRScale"), this.float ? 1 : 1 / 24);
    gl.uniform1f(u("uSharpScale"), this.sharp.w / Math.max(1, this.sceneRect[2]));
    this.bindTex(0, "uSharp", this.sharp.tex);
    this.bindTex(1, "uBokeh", this.bokeh.tex);
    this.bindTex(2, "uFogTex", this.fogScene.tex);
    this.bindTex(3, "uField", this.fieldT.tex);
    this.bindTex(4, "uFog", this.fogMap.tex);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
  }

  private bindTex(unit: number, name: string, tex: WebGLTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(this.uComp(name), unit);
  }

  dispose() {
    const gl = this.gl;
    for (const t of [this.sharp, this.bokeh, this.fogScene, this.baseSharp, this.baseBokeh, this.baseFog, this.fieldT, this.fogMap]) {
      this.dropTarget(t);
    }
    this.sharp = this.bokeh = this.fogScene = this.fieldT = this.fogMap = null;
    this.baseSharp = this.baseBokeh = this.baseFog = null;
    for (const p of [this.base, this.cars, this.lights, this.field, this.fade, this.stamp, this.comp]) gl.deleteProgram(p);
    for (const b of [this.lightBuf, this.carBuf, this.outerBuf, this.innerBuf, this.stampBuf]) gl.deleteBuffer(b);
    for (const v of [this.emptyVao, this.lightVao, this.carVao, this.outerVao, this.innerVao, this.stampVao]) gl.deleteVertexArray(v);
  }
}
