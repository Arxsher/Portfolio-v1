// WebGL2 renderer for Disintegrate.
//
// The particles live on the GPU: each particle system is two interleaved
// state buffers (position + life, velocity + tumble angle) that the UPDATE
// program ping-pongs through transform feedback, plus one static buffer
// shared by every system (each cell's home, release order and randoms).
// There are two systems, so the dust of one deleted card can still be
// drifting off while the next card is already being held.
//
// A frame: clear; for each card back to front its soft shadow and then the
// card (a quad from the atlas, or its particles while it is in pieces);
// the loose flakes' shadows; the flakes. No depth buffer: the order of the
// draws is the order of depth. Premultiplied alpha throughout. Nothing
// allocates per frame.

import { compileShader, uniformLocations } from "../../gl";
import type { Atlas, Grid } from "./art";
import {
  CARD_FRAGMENT,
  CARD_VERTEX,
  PARTICLE_FRAGMENT,
  PARTICLE_VERTEX,
  SHADOW_FRAGMENT,
  SHADOW_VERTEX,
  UPDATE_FRAGMENT,
  UPDATE_VERTEX,
} from "./shaders";

type Uniforms = (name: string) => WebGLUniformLocation | null;
type Pass = { program: WebGLProgram; u: Uniforms };

const STRIDE = 8 * 4;

function link(gl: WebGL2RenderingContext, vs: string, fs: string, feedback?: string[]): Pass {
  const v = compileShader(gl, gl.VERTEX_SHADER, vs);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fs);
  const program = gl.createProgram();
  if (!program) throw new Error("disintegrate: could not create program");
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  if (feedback) gl.transformFeedbackVaryings(program, feedback, gl.INTERLEAVED_ATTRIBS);
  gl.linkProgram(program);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`disintegrate: program failed to link\n${log}`);
  }
  return { program, u: uniformLocations(gl, program) };
}

/** How the card looks right now (the parts cardColor() varies). */
export type Face = {
  slot: number;
  fill: number;
  hover: number;
  /** Diagonal glint: position (0..1 across the card) and strength. */
  shineAt: number;
  shine: number;
  glossX: number;
  glossY: number;
  gloss: number;
};

export function blankFace(): Face {
  return { slot: 0, fill: 0, hover: 0, shineAt: -1, shine: 0, glossX: 180, glossY: 120, gloss: 0 };
}

/** The flow the loose dust rides on (world px / s). */
export type Flow = {
  wind: Float32Array;
  curl: number;
  curlScale: number;
  vortex: Float32Array;
  lift: number;
  kick: number;
};

/** Per-theme lighting of the dust and the shadows. */
export type Look = {
  glow: Float32Array;
  glowGain: number;
  shadeAmt: number;
  spark: number;
  dustShadow: number;
  ambient: number;
  contact: number;
  hoverMul: number;
  /** Multiply per stack slot behind the front card. */
  depthTint: number;
};

type System = {
  state: [WebGLBuffer, WebGLBuffer];
  update: [WebGLVertexArrayObject, WebGLVertexArrayObject];
  draw: [WebGLVertexArrayObject, WebGLVertexArrayObject];
  cur: 0 | 1;
  count: number;
};

export type UpdateParams = {
  model: Float32Array;
  dt: number;
  time: number;
  mode: number;
  sweep: number;
  returnT: number;
  stirX: number;
  stirY: number;
  stirVX: number;
  stirVY: number;
  stirR: number;
  leash: number;
  depth: number;
};

export type DrawParams = {
  model: Float32Array;
  scale: number;
  mode: number;
  sweep: number;
  loose: number;
  time: number;
  alpha: number;
};

export class DustRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly updatePass: Pass;
  private readonly particlePass: Pass;
  private readonly dustShadowPass: Pass;
  private readonly cardPass: Pass;
  private readonly shadowPass: Pass;
  private readonly empty: WebGLVertexArrayObject;
  private readonly feedback: WebGLTransformFeedback;
  private readonly atlas: WebGLTexture;
  private readonly order: WebGLTexture;
  private staticBuf: WebGLBuffer | null = null;
  private systems: System[] = [];
  private grid: Grid | null = null;
  private slots = new Float32Array(24);
  private viewW = 1;
  private viewH = 1;
  private dist = 1600;
  readonly ready: boolean;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.updatePass = link(gl, UPDATE_VERTEX, UPDATE_FRAGMENT, ["vP", "vV"]);
    this.particlePass = link(gl, PARTICLE_VERTEX(false), PARTICLE_FRAGMENT(false));
    this.dustShadowPass = link(gl, PARTICLE_VERTEX(true), PARTICLE_FRAGMENT(true));
    this.cardPass = link(gl, CARD_VERTEX, CARD_FRAGMENT);
    this.shadowPass = link(gl, SHADOW_VERTEX, SHADOW_FRAGMENT);
    const empty = gl.createVertexArray();
    const feedback = gl.createTransformFeedback();
    const atlas = gl.createTexture();
    const order = gl.createTexture();
    if (!empty || !feedback || !atlas || !order) throw new Error("disintegrate: out of GL objects");
    this.empty = empty;
    this.feedback = feedback;
    this.atlas = atlas;
    this.order = order;
    for (const texture of [atlas, order]) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    // texture units: 0 the atlas, 1 the release order (bound once per frame)
    for (const pass of [this.particlePass, this.dustShadowPass, this.cardPass]) {
      gl.useProgram(pass.program);
      gl.uniform1i(pass.u("uAtlas"), 0);
    }
    gl.useProgram(this.shadowPass.program);
    gl.uniform1i(this.shadowPass.u("uOrder"), 1);
    gl.useProgram(null);
    this.ready = true;
  }

  /* -------------------------------------------------------------------- */
  /* resources                                                             */
  /* -------------------------------------------------------------------- */

  setAtlas(atlas: Atlas) {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.slots.set(atlas.slots);
  }

  /** Cut the cards into this grid (resets both systems to whole cards). */
  setGrid(grid: Grid, systems = 2) {
    const { gl } = this;
    this.disposeSystems();
    this.grid = grid;
    gl.bindTexture(gl.TEXTURE_2D, this.order);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, grid.cols, grid.rows, 0, gl.RED, gl.UNSIGNED_BYTE, grid.order);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const staticBuf = gl.createBuffer();
    if (!staticBuf) throw new Error("disintegrate: no buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.bufferData(gl.ARRAY_BUFFER, grid.data, gl.STATIC_DRAW);
    this.staticBuf = staticBuf;

    const blank = new Float32Array(grid.count * 8);
    for (let i = 0; i < grid.count; i++) blank[i * 8 + 3] = -1;
    for (let s = 0; s < systems; s++) {
      const a = gl.createBuffer();
      const b = gl.createBuffer();
      if (!a || !b) throw new Error("disintegrate: no buffer");
      for (const buffer of [a, b]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, blank, gl.DYNAMIC_COPY);
      }
      const update: WebGLVertexArrayObject[] = [];
      const draw: WebGLVertexArrayObject[] = [];
      for (const source of [a, b]) {
        update.push(this.vao(source, staticBuf, false));
        draw.push(this.vao(source, staticBuf, true));
      }
      this.systems.push({
        state: [a, b],
        update: [update[0], update[1]],
        draw: [draw[0], draw[1]],
        cur: 0,
        count: grid.count,
      });
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.blank = blank;
  }

  private blank: Float32Array | null = null;

  private vao(state: WebGLBuffer, staticBuf: WebGLBuffer, instanced: boolean): WebGLVertexArrayObject {
    const { gl } = this;
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("disintegrate: no vertex array");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, state);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, STRIDE, 16);
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, STRIDE, 16);
    const divisor = instanced ? 1 : 0;
    for (let i = 0; i < 4; i++) gl.vertexAttribDivisor(i, divisor);
    gl.bindVertexArray(null);
    return vao;
  }

  /** Every cell of system `index` back on its card. */
  resetSystem(index: number) {
    const system = this.systems[index];
    if (!system || !this.blank) return;
    const { gl } = this;
    gl.bindBuffer(gl.ARRAY_BUFFER, system.state[system.cur]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.blank);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  get count(): number {
    return this.grid?.count ?? 0;
  }

  /* -------------------------------------------------------------------- */
  /* simulation                                                            */
  /* -------------------------------------------------------------------- */

  update(index: number, p: UpdateParams, flow: Flow) {
    const system = this.systems[index];
    if (!system) return;
    const { gl } = this;
    const { u, program } = this.updatePass;
    gl.useProgram(program);
    gl.uniformMatrix4fv(u("uModel"), false, p.model);
    gl.uniform1f(u("uDt"), p.dt);
    gl.uniform1f(u("uTime"), p.time);
    gl.uniform1i(u("uMode"), p.mode);
    gl.uniform1f(u("uSweep"), p.sweep);
    gl.uniform1f(u("uReturnT"), p.returnT);
    gl.uniform3fv(u("uWind"), flow.wind);
    gl.uniform1f(u("uCurl"), flow.curl);
    gl.uniform1f(u("uCurlScale"), flow.curlScale);
    gl.uniform4fv(u("uVortex"), flow.vortex);
    gl.uniform1f(u("uLift"), flow.lift);
    gl.uniform1f(u("uKick"), flow.kick);
    gl.uniform4f(u("uStir"), p.stirX, p.stirY, p.stirVX, p.stirVY);
    gl.uniform1f(u("uStirR"), p.stirR);
    gl.uniform1f(u("uLeash"), p.leash);
    gl.uniform1f(u("uDepth"), p.depth);

    const from = system.cur;
    const to = (1 - from) as 0 | 1;
    gl.bindVertexArray(system.update[from]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.feedback);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, system.state[to]);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, system.count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
    system.cur = to;
  }

  /* -------------------------------------------------------------------- */
  /* drawing                                                               */
  /* -------------------------------------------------------------------- */

  begin(viewW: number, viewH: number, dist: number) {
    const { gl } = this;
    const canvas = gl.canvas as HTMLCanvasElement;
    this.viewW = viewW;
    this.viewH = viewH;
    this.dist = dist;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.order);
    gl.activeTexture(gl.TEXTURE0);
  }

  private view(u: Uniforms) {
    const { gl } = this;
    gl.uniform2f(u("uView"), this.viewW, this.viewH);
    gl.uniform1f(u("uDist"), this.dist);
  }

  private face(u: Uniforms, face: Face, look: Look) {
    const { gl } = this;
    const s = face.slot * 4;
    const f = 5 * 4;
    const slots = this.slots;
    gl.uniform2f(u("uCard"), 360, 240);
    gl.uniform4f(u("uSlot"), slots[s], slots[s + 1], slots[s + 2], slots[s + 3]);
    gl.uniform4f(u("uFillSlot"), slots[f], slots[f + 1], slots[f + 2], slots[f + 3]);
    gl.uniform4f(u("uButton"), 16, 188, 328, 36);
    gl.uniform1f(u("uButtonR"), 12);
    gl.uniform1f(u("uFill"), face.fill);
    gl.uniform1f(u("uHover"), face.hover);
    gl.uniform1f(u("uHoverMul"), look.hoverMul);
    gl.uniform2f(u("uShine"), face.shineAt, face.shine);
    gl.uniform4f(u("uGloss"), face.glossX, face.glossY, face.gloss, 150);
  }

  /** A card's soft shadow; `front` masks it by the release order (-1: the whole card). */
  shadow(cx: number, cy: number, halfW: number, halfH: number, scale: number, strength: number, front: number, look: Look) {
    const { gl } = this;
    const { u, program } = this.shadowPass;
    gl.useProgram(program);
    this.view(u);
    const blur = 26 * scale;
    gl.uniform4f(u("uRect"), cx, cy, halfW, halfH);
    gl.uniform1f(u("uMargin"), blur * 2.2);
    gl.uniform1f(u("uRadius"), 22 * scale);
    gl.uniform4f(u("uAmbient"), 0, -12 * scale, blur, look.ambient * strength);
    gl.uniform4f(u("uContact"), 0, -2 * scale, 3.5 * scale, look.contact * strength);
    gl.uniform1f(u("uFront"), front);
    gl.bindVertexArray(this.empty);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  card(model: Float32Array, face: Face, look: Look, tint: number, alpha: number) {
    const { gl } = this;
    const { u, program } = this.cardPass;
    gl.useProgram(program);
    this.view(u);
    this.face(u, face, look);
    gl.uniformMatrix4fv(u("uModel"), false, model);
    gl.uniform4f(u("uTint"), tint, tint, tint, 1);
    gl.uniform1f(u("uAlpha"), alpha);
    gl.bindVertexArray(this.empty);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private particleUniforms(u: Uniforms, p: DrawParams, face: Face, look: Look) {
    const { gl } = this;
    this.view(u);
    this.face(u, face, look);
    gl.uniformMatrix4fv(u("uModel"), false, p.model);
    gl.uniform1f(u("uCell"), this.grid?.cell ?? 2);
    gl.uniform1f(u("uScale"), p.scale);
    gl.uniform1f(u("uSweep"), p.sweep);
    gl.uniform1f(u("uLoose"), p.loose);
    gl.uniform1f(u("uTime"), p.time);
    gl.uniform1i(u("uMode"), p.mode);
    gl.uniform1f(u("uAlpha"), p.alpha);
    // light from the upper left, in front; the half vector toward the camera
    gl.uniform3f(u("uLight"), -0.45, 0.62, 0.64);
    gl.uniform3f(u("uHalf"), -0.24, 0.33, 0.91);
    gl.uniform1f(u("uShadeAmt"), look.shadeAmt);
    gl.uniform1f(u("uSpark"), look.spark);
    gl.uniform1f(u("uGlowGain"), look.glowGain);
    gl.uniform3fv(u("uGlowColor"), look.glow);
    gl.uniform1f(u("uShadowAlpha"), look.dustShadow);
  }

  /** The loose flakes' shadows on the stage. */
  dustShadows(index: number, p: DrawParams, face: Face, look: Look) {
    const system = this.systems[index];
    if (!system || look.dustShadow <= 0) return;
    const { gl } = this;
    const { u, program } = this.dustShadowPass;
    gl.useProgram(program);
    this.particleUniforms(u, p, face, look);
    gl.bindVertexArray(system.draw[system.cur]);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, system.count);
    gl.bindVertexArray(null);
  }

  /** The card in pieces: attached cells and loose flakes. */
  particles(index: number, p: DrawParams, face: Face, look: Look) {
    const system = this.systems[index];
    if (!system) return;
    const { gl } = this;
    const { u, program } = this.particlePass;
    gl.useProgram(program);
    this.particleUniforms(u, p, face, look);
    gl.bindVertexArray(system.draw[system.cur]);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, system.count);
    gl.bindVertexArray(null);
  }

  /* -------------------------------------------------------------------- */
  /* lifetime                                                              */
  /* -------------------------------------------------------------------- */

  private disposeSystems() {
    const { gl } = this;
    for (const system of this.systems) {
      for (const vao of [...system.update, ...system.draw]) gl.deleteVertexArray(vao);
      for (const buffer of system.state) gl.deleteBuffer(buffer);
    }
    this.systems = [];
    if (this.staticBuf) gl.deleteBuffer(this.staticBuf);
    this.staticBuf = null;
  }

  dispose() {
    const { gl } = this;
    this.disposeSystems();
    for (const pass of [this.updatePass, this.particlePass, this.dustShadowPass, this.cardPass, this.shadowPass]) {
      gl.deleteProgram(pass.program);
    }
    gl.deleteVertexArray(this.empty);
    gl.deleteTransformFeedback(this.feedback);
    gl.deleteTexture(this.atlas);
    gl.deleteTexture(this.order);
  }
}
