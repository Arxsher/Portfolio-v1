// The ink's fluid: velocity, pressure and dye on half-float render targets,
// stepped with stable fluids (advect → vorticity → divergence → pressure →
// gradient) and drawn by DISPLAY. Positions are 0…1 across the dish (y up);
// velocities are CSS px per second, converted to sim texels here.

import { createProgram, uniformLocations } from "../../gl";
import {
  ADVECT,
  COPY,
  CURL,
  DISPLAY,
  DIVERGENCE,
  GRADIENT,
  PRESSURE,
  SCALE,
  SIM_VERTEX,
  SPLAT,
  VORTICITY,
} from "./shaders";

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type Pair = { read: Target; write: Target };

type Program = { program: WebGLProgram; u: (name: string) => WebGLUniformLocation | null };

export type FluidSize = {
  /** Velocity grid, cells on the short side. */
  sim: number;
  /** Dye grid, cells on the short side. */
  dye: number;
};

/** Vorticity confinement strength. */
const CURL_STRENGTH = 16;
const PRESSURE_PASSES = 20;
/** Most ink a cell holds (amount, before the colour is scaled down with it). */
const DYE_CAP = 3;

export class InkFluid {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null;
  private size: FluidSize;
  /** Formats per field: RG/R if the GPU renders them, else RGBA for all. */
  private fmt: { two: [number, number]; one: [number, number] };
  private p: Record<
    "advect" | "splat" | "curl" | "vorticity" | "divergence" | "scale" | "pressure" | "gradient" | "copy" | "display",
    Program
  >;
  private velocity: Pair | null = null;
  private dye: Pair | null = null;
  private pressure: Pair | null = null;
  private divergence: Target | null = null;
  private curl: Target | null = null;
  /** CSS size of the dish and its aspect (w / h). */
  private cssW = 1;
  private cssH = 1;
  aspect = 1;

  constructor(gl: WebGL2RenderingContext, size: FluidSize) {
    this.gl = gl;
    this.size = size;
    const renderable = gl.getExtension("EXT_color_buffer_float") ?? gl.getExtension("EXT_color_buffer_half_float");
    if (!renderable) throw new Error("ink: this GPU can't render to half-float targets");
    this.vao = gl.createVertexArray();
    const make = (fragment: string): Program => {
      const program = createProgram(gl, SIM_VERTEX, fragment);
      return { program, u: uniformLocations(gl, program) };
    };
    this.p = {
      advect: make(ADVECT),
      splat: make(SPLAT),
      curl: make(CURL),
      vorticity: make(VORTICITY),
      divergence: make(DIVERGENCE),
      scale: make(SCALE),
      pressure: make(PRESSURE),
      gradient: make(GRADIENT),
      copy: make(COPY),
      display: make(DISPLAY),
    };
    // some GPUs render RGBA16F but not RG16F / R16F
    const probe = this.target(4, 4, gl.RG16F, gl.RG);
    const ok = probe !== null;
    if (probe) this.free(probe);
    this.fmt = ok
      ? { two: [gl.RG16F, gl.RG], one: [gl.R16F, gl.RED] }
      : { two: [gl.RGBA16F, gl.RGBA], one: [gl.RGBA16F, gl.RGBA] };
    if (!this.target(4, 4, gl.RGBA16F, gl.RGBA, true)) throw new Error("ink: no half-float framebuffer");
  }

  /** Fit the grids to the dish (CSS px), carrying the ink and flow over. */
  resize(cssW: number, cssH: number) {
    const gl = this.gl;
    if (cssW < 2 || cssH < 2) return;
    this.cssW = cssW;
    this.cssH = cssH;
    this.aspect = cssW / cssH;
    const grid = (short: number) => {
      const k = short / Math.min(cssW, cssH);
      return [Math.max(8, Math.round(cssW * k)), Math.max(8, Math.round(cssH * k))] as const;
    };
    const [sw, sh] = grid(this.size.sim);
    const [dw, dh] = grid(this.size.dye);
    if (this.velocity && this.velocity.read.w === sw && this.velocity.read.h === sh && this.dye?.read.w === dw && this.dye.read.h === dh)
      return;

    const pair = (w: number, h: number, [internal, format]: [number, number], old: Pair | null): Pair => {
      const read = this.target(w, h, internal, format);
      const write = this.target(w, h, internal, format);
      if (!read || !write) throw new Error("ink: could not allocate targets");
      if (old) {
        this.run(this.p.copy, read, { uSource: old.read });
        this.free(old.read);
        this.free(old.write);
      }
      return { read, write };
    };
    this.velocity = pair(sw, sh, this.fmt.two, this.velocity);
    this.dye = pair(dw, dh, [gl.RGBA16F, gl.RGBA], this.dye);
    if (this.pressure) {
      this.free(this.pressure.read);
      this.free(this.pressure.write);
    }
    this.pressure = pair(sw, sh, this.fmt.one, null);
    if (this.divergence) this.free(this.divergence);
    if (this.curl) this.free(this.curl);
    this.divergence = this.target(sw, sh, ...this.fmt.one);
    this.curl = this.target(sw, sh, ...this.fmt.one);
    for (const t of [this.pressure.read, this.pressure.write, this.divergence, this.curl]) if (t) this.clear(t);
  }

  /** Ink (rgb premultiplied by amount) and/or a push (CSS px / s, y up) at (x, y). */
  splat(x: number, y: number, vx: number, vy: number, r: number, g: number, b: number, amount: number, radius: number) {
    const vel = this.velocity;
    const dye = this.dye;
    if (!vel || !dye) return;
    if (vx !== 0 || vy !== 0) {
      const k = vel.read.w / this.cssW;
      this.run(this.p.splat, vel.write, {
        uTarget: vel.read,
        uPoint: [x, y],
        uAspect: this.aspect,
        uRadius: radius,
        uColor: [vx * k, vy * k, 0, 0],
        uRadial: 0,
        uCap: 0,
      });
      swap(vel);
    }
    if (amount > 0) {
      this.run(this.p.splat, dye.write, {
        uTarget: dye.read,
        uPoint: [x, y],
        uAspect: this.aspect,
        uRadius: radius,
        uColor: [r * amount, g * amount, b * amount, amount],
        uRadial: 0,
        uCap: DYE_CAP,
      });
      swap(dye);
    }
  }

  /** A drop landing: water pushed outward from (x, y) at about `speed` CSS px / s. */
  bloom(x: number, y: number, speed: number, radius: number) {
    const vel = this.velocity;
    if (!vel) return;
    const k = vel.read.w / this.cssW;
    this.run(this.p.splat, vel.write, {
      uTarget: vel.read,
      uPoint: [x, y],
      uAspect: this.aspect,
      uRadius: radius,
      uColor: [speed * k, 0, 0, 0],
      uRadial: 1,
      uCap: 0,
    });
    swap(vel);
  }

  /**
   * One step of `dt` seconds. `flowKeep` / `inkKeep` are how much of the
   * motion and the ink survive one second.
   */
  step(dt: number, flowKeep: number, inkKeep: number) {
    const vel = this.velocity;
    const dye = this.dye;
    const pressure = this.pressure;
    const curl = this.curl;
    const divergence = this.divergence;
    if (!vel || !dye || !pressure || !curl || !divergence) return;
    const P = this.p;
    const simTexel: [number, number] = [1 / vel.read.w, 1 / vel.read.h];

    this.run(P.curl, curl, { uVelocity: vel.read }, simTexel);
    this.run(P.vorticity, vel.write, { uVelocity: vel.read, uCurl: curl, uStrength: CURL_STRENGTH, uDt: dt }, simTexel);
    swap(vel);
    this.run(P.divergence, divergence, { uVelocity: vel.read }, simTexel);
    this.run(P.scale, pressure.write, { uSource: pressure.read, uValue: 0.8 }, simTexel);
    swap(pressure);
    for (let i = 0; i < PRESSURE_PASSES; i++) {
      this.run(P.pressure, pressure.write, { uPressure: pressure.read, uDivergence: divergence }, simTexel);
      swap(pressure);
    }
    this.run(P.gradient, vel.write, { uPressure: pressure.read, uVelocity: vel.read }, simTexel);
    swap(vel);
    this.run(P.advect, vel.write, {
      uVelocity: vel.read,
      uSource: vel.read,
      uSimTexel: simTexel,
      uDt: dt,
      uKeep: Math.pow(flowKeep, dt),
    });
    swap(vel);
    this.run(P.advect, dye.write, {
      uVelocity: vel.read,
      uSource: dye.read,
      uSimTexel: simTexel,
      uDt: dt,
      uKeep: Math.pow(inkKeep, dt),
    });
    swap(dye);
  }

  /** Draw the dish into the canvas (device px), `night` 0 paper … 1 dark water. */
  render(width: number, height: number, night: number, paper: readonly number[], deep: readonly number[]) {
    const gl = this.gl;
    const dye = this.dye;
    if (!dye) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    const { program, u } = this.p.display;
    gl.useProgram(program);
    gl.uniform2f(u("uTexel"), 1 / width, 1 / height);
    this.bind(u("uDye"), 0, dye.read);
    gl.uniform2f(u("uDyeTexel"), 1 / dye.read.w, 1 / dye.read.h);
    gl.uniform2f(u("uRes"), width, height);
    gl.uniform1f(u("uNight"), night);
    gl.uniform3f(u("uPaper"), paper[0], paper[1], paper[2]);
    gl.uniform3f(u("uDeep"), deep[0], deep[1], deep[2]);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Wipe the ink and the flow. */
  clearAll() {
    for (const t of [this.velocity, this.dye, this.pressure]) {
      if (!t) continue;
      this.clear(t.read);
      this.clear(t.write);
    }
  }

  dispose() {
    const gl = this.gl;
    for (const pair of [this.velocity, this.dye, this.pressure]) {
      if (!pair) continue;
      this.free(pair.read);
      this.free(pair.write);
    }
    if (this.divergence) this.free(this.divergence);
    if (this.curl) this.free(this.curl);
    for (const { program } of Object.values(this.p)) gl.deleteProgram(program);
    gl.deleteVertexArray(this.vao);
    this.velocity = this.dye = this.pressure = null;
    this.divergence = this.curl = null;
  }

  /* -------------------------------------------------------------------- */

  private target(w: number, h: number, internal: number, format: number, probeOnly = false): Target | null {
    const gl = this.gl;
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const t = { tex, fbo, w, h };
    if (!complete || probeOnly) {
      this.free(t);
      return complete ? t : null;
    }
    this.clear(t);
    return t;
  }

  private free(t: Target) {
    this.gl.deleteTexture(t.tex);
    this.gl.deleteFramebuffer(t.fbo);
  }

  private clear(t: Target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.viewport(0, 0, t.w, t.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private bind(location: WebGLUniformLocation | null, unit: number, t: Target) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.uniform1i(location, unit);
  }

  /** Run one pass into `out`. Uniform values: a target (sampled), a number or a vector. */
  private run(
    { program, u }: Program,
    out: Target,
    uniforms: Record<string, Target | number | readonly number[]>,
    texel?: [number, number],
  ) {
    const gl = this.gl;
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo);
    gl.viewport(0, 0, out.w, out.h);
    const t = texel ?? [1 / out.w, 1 / out.h];
    gl.uniform2f(u("uTexel"), t[0], t[1]);
    let unit = 0;
    for (const name in uniforms) {
      const value = uniforms[name];
      const loc = u(name);
      if (typeof value === "number") gl.uniform1f(loc, value);
      else if (isTarget(value)) this.bind(loc, unit++, value);
      else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
      else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
      else gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
    }
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

function isTarget(value: Target | readonly number[]): value is Target {
  return (value as Target).fbo !== undefined;
}

function swap(pair: Pair) {
  const t = pair.read;
  pair.read = pair.write;
  pair.write = t;
}
