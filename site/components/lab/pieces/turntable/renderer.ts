// WebGL2 side of the deck: one full-screen pass of the fragment shader in
// shaders.ts, two textures (the label and the plinth's printing) and the
// uniforms for a frame. The frame's size is the canvas's backing store,
// which the piece may run below the screen's DPR when a machine is slow.

import { createProgram, drawFullscreen, FULLSCREEN_VERTEX, uniformLocations } from "../../gl";
import { FRAGMENT } from "./shaders";
import type { Look, Pressing, Vec3 } from "./look";

export type Frame = {
  /** Backing store, device px. */
  width: number;
  height: number;
  /** Device pixels of the plinth's top-left corner (y down) and device px per mm. */
  originX: number;
  originY: number;
  scale: number;
  detail: number;
  look: Look;
  pressing: Pressing;
  recordAngle: number;
  platterAngle: number;
  platterVel: number;
  strobe: readonly number[];
  lamp: number;
  arm: { s: Vec2; k: Vec2; h: Vec2; u: Vec2 };
  lift: number;
  cue: number;
  start: number;
  power: number;
  speedPress: [number, number];
  speedLed: [number, number];
  /** Fader cap position (y, mm) and the quartz-lock light (0..1). */
  faderY: number;
  lock: number;
  /** Hover per part (0..1): arm, record, start, 33, 45, cue, pitch. */
  hover: Float32Array;
};

/** The parts that light up under the pointer, in uHov order. */
export const HOVER_PARTS = ["arm", "record", "start", "speed33", "speed45", "cue", "pitch"] as const;

type Vec2 = { x: number; y: number };

export class DeckRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject | null;
  private u: (name: string) => WebGLUniformLocation | null;
  private label: WebGLTexture | null;
  private print: WebGLTexture | null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = createProgram(gl, FULLSCREEN_VERTEX, FRAGMENT);
    this.u = uniformLocations(gl, this.program);
    this.vao = gl.createVertexArray();
    this.label = this.blank();
    this.print = this.blank();
    gl.useProgram(this.program);
    gl.uniform1i(this.u("uLabel"), 0);
    gl.uniform1i(this.u("uPrint"), 1);
  }

  private blank(): WebGLTexture | null {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  private upload(texture: WebGLTexture | null, canvas: HTMLCanvasElement, premultiply: boolean) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  }

  /** The label: paper in RGB, the run-out etching in alpha (kept apart). */
  setLabel(canvas: HTMLCanvasElement) {
    this.upload(this.label, canvas, false);
  }

  /** The plinth's printing: coverage per channel, premultiplied so it filters cleanly. */
  setPrint(canvas: HTMLCanvasElement) {
    this.upload(this.print, canvas, true);
  }

  draw(f: Frame) {
    const gl = this.gl;
    const u = this.u;
    const L = f.look;
    const P = f.pressing;
    gl.viewport(0, 0, f.width, f.height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    gl.uniform2f(u("uRes"), f.width, f.height);
    gl.uniform2f(u("uOrigin"), f.originX, f.originY);
    gl.uniform1f(u("uScale"), f.scale);
    gl.uniform1f(u("uDetail"), f.detail);

    gl.uniform3fv(u("uLight"), L.light);
    gl.uniform3fv(u("uKey"), L.key);
    gl.uniform3fv(u("uAmbTop"), L.ambTop);
    gl.uniform3fv(u("uAmbLow"), L.ambLow);
    gl.uniform3fv(u("uEnvHigh"), L.envHigh);
    gl.uniform3fv(u("uEnvLow"), L.envLow);
    gl.uniform3fv(u("uBox"), L.box);
    gl.uniform1f(u("uGround"), L.ground);
    gl.uniform3fv(u("uPlinth"), L.plinth);
    gl.uniform3fv(u("uInk"), L.ink);
    gl.uniform3fv(u("uMetal"), L.metal);
    gl.uniform3fv(u("uDark"), L.dark);
    gl.uniform3fv(u("uGlow"), L.glow);
    gl.uniform3fv(u("uCart"), L.cart);
    gl.uniform3fv(u("uGuard"), L.guard);
    gl.uniform1f(u("uExposure"), L.exposure);
    gl.uniform1f(u("uRim"), L.rim);
    gl.uniform1f(u("uStrobeK"), L.strobe);
    gl.uniform1f(u("uCap"), L.cap);
    gl.uniform3fv(u("uVinyl"), P.vinyl);
    gl.uniform3f(u("uSheen"), P.sheen[0] * L.sheen, P.sheen[1] * L.sheen, P.sheen[2] * L.sheen);
    gl.uniform1f(u("uTrans"), P.trans);

    gl.uniform1f(u("uRecordAngle"), f.recordAngle);
    gl.uniform1f(u("uPlatterAngle"), f.platterAngle);
    gl.uniform1f(u("uPlatterVel"), f.platterVel);
    gl.uniform2f(u("uStrobe"), f.strobe[0], f.strobe[1]);
    gl.uniform1f(u("uLamp"), f.lamp);

    const { s, k, h, u: tube } = f.arm;
    gl.uniform2f(u("uArmS"), s.x, s.y);
    gl.uniform2f(u("uArmK"), k.x, k.y);
    gl.uniform2f(u("uArmH"), h.x, h.y);
    gl.uniform2f(u("uArmU"), tube.x, tube.y);
    gl.uniform2f(u("uArmSide"), -h.y, h.x);
    gl.uniform1f(u("uLift"), f.lift);
    gl.uniform1f(u("uCue"), f.cue);
    gl.uniform1f(u("uStart"), f.start);
    gl.uniform1f(u("uPower"), f.power);
    gl.uniform2f(u("uSpeedPress"), f.speedPress[0], f.speedPress[1]);
    gl.uniform2f(u("uSpeedLed"), f.speedLed[0], f.speedLed[1]);
    gl.uniform1f(u("uFaderY"), f.faderY);
    gl.uniform1f(u("uLock"), f.lock);
    gl.uniform1fv(u("uHov[0]"), f.hover);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.label);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.print);
    drawFullscreen(gl, this.vao);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.label);
    gl.deleteTexture(this.print);
  }
}
