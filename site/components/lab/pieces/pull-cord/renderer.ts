// Draws a frame: turns the simulation and the light into the shader's
// uniforms (the cord as a Catmull-Rom spline through its particles, with
// arc length for the braid) and draws in two passes:
//   1. the room alone (wall, the lamp's light on it, bloom) over the canvas;
//   2. everything, scissored to a box around the canopy, the lamp, the cord
//      and the cord's shadow on the wall.
// Both run the same code for the room, so the box doesn't show; the costly
// part (ray casting the lamp, the cord's distance field) only runs where it
// can matter. Preallocated; render() does no allocation.

import { createProgram, FULLSCREEN_VERTEX, uniformLocations } from "../../gl";
import { BEAD_ATTACH, BULB_SY, CORD_R } from "./geometry";
import type { LampLight } from "./light";
import type { Layout } from "./layout";
import { N, type CordSim } from "./physics";
import { CORD_POINTS, FRAGMENT_FULL, FRAGMENT_ROOM } from "./shaders";

type RGB = [number, number, number];

export type Palette = {
  /** Linear RGB. */
  wallLit: RGB;
  wallDark: RGB;
  warm: RGB;
  glow: RGB;
};

const lin = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const hex = (value: string): RGB => [
  lin(parseInt(value.slice(1, 3), 16)),
  lin(parseInt(value.slice(3, 5), 16)),
  lin(parseInt(value.slice(5, 7), 16)),
];

/**
 * The room in the site's own greys: lit, the bounce light sits a little
 * under the light theme's tile colour and the lamp brings it up to it and
 * past; dark, it is the dark theme's tile. The lamp is a 2700 K warm white;
 * the pull's phosphorescent glaze a pale, barely green white.
 */
export const PALETTE: Palette = {
  wallLit: hex("#efefef"),
  wallDark: hex("#232323"),
  warm: hex("#ffd8ae"),
  glow: hex("#d9f2e6"),
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The filament's colour by temperature: deep red, orange, then the lamp's warm white. */
function filamentColour(t: number, warm: RGB, out: Float32Array) {
  const a = smoothstep(0.12, 0.55, t);
  const b = smoothstep(0.5, 0.96, t);
  const r = 1;
  const g = 0.13 + (0.4 - 0.13) * a;
  const bl = 0.015 + (0.09 - 0.015) * a;
  out[0] = r + (warm[0] - r) * b;
  out[1] = g + (warm[1] - g) * b;
  out[2] = bl + (warm[2] - bl) * b;
  return out;
}

type Pass = { program: WebGLProgram; u: (name: string) => WebGLUniformLocation | null };

export class PullCordRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly room: Pass;
  private readonly full: Pass;
  private readonly vao: WebGLVertexArrayObject | null;
  private readonly cord = new Float32Array(CORD_POINTS * 4);
  private readonly lampCol = new Float32Array(3);
  // control points: the grommet, then the particles
  private readonly cx = new Float64Array(N + 1);
  private readonly cy = new Float64Array(N + 1);
  private readonly cs = new Float64Array(N + 1);
  private count = 0;
  private seed = 0;
  // per-frame values shared by both passes
  private bx = 0;
  private by = 0;
  private reach = 1;
  private beadX = 0;
  private beadY = 0;
  private beadUx = 0;
  private beadUy = -1;
  private box = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const room = createProgram(gl, FULLSCREEN_VERTEX, FRAGMENT_ROOM);
    const full = createProgram(gl, FULLSCREEN_VERTEX, FRAGMENT_FULL);
    this.room = { program: room, u: uniformLocations(gl, room) };
    this.full = { program: full, u: uniformLocations(gl, full) };
    this.vao = gl.createVertexArray();
  }

  render(sim: CordSim, light: LampLight, layout: Layout, palette: Palette, hover: number) {
    const { gl } = this;
    const canvas = gl.canvas as HTMLCanvasElement;
    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height) return;
    const px = width / layout.width;
    this.prepare(sim, light, layout, palette);

    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(this.vao);
    this.seed = (this.seed + 17.31) % 1000;

    // 1: the room
    gl.disable(gl.SCISSOR_TEST);
    this.uniforms(this.room, sim, light, layout, palette, hover, px, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2: lamp, cord and shadows, inside their box
    const b = this.objectsBox(sim, layout);
    const x0 = Math.max(0, Math.floor(b.minX * px) - 2);
    const x1 = Math.min(width, Math.ceil(b.maxX * px) + 2);
    const y0 = Math.max(0, Math.floor(b.minY * px) - 2);
    const y1 = Math.min(height, Math.ceil(b.maxY * px) + 2);
    if (x1 > x0 && y1 > y0) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x0, height - y1, x1 - x0, y1 - y0);
      this.uniforms(this.full, sim, light, layout, palette, hover, px, width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.SCISSOR_TEST);
    }
  }

  /** Values both passes need: the bulb, the cord spline, the pull. */
  private prepare(sim: CordSim, light: LampLight, layout: Layout, palette: Palette) {
    this.bx = sim.ox - sim.ux * BULB_SY;
    this.by = sim.oy - sim.uy * BULB_SY;
    const { bx, by } = this;
    let reach = Math.hypot(bx, by);
    reach = Math.max(reach, Math.hypot(layout.width - bx, by));
    reach = Math.max(reach, Math.hypot(bx, layout.height - by));
    reach = Math.max(reach, Math.hypot(layout.width - bx, layout.height - by));
    this.reach = reach;
    filamentColour(light.filament, palette.warm, this.lampCol);

    const { cx, cy, cs } = this;
    cx[0] = sim.ex;
    cy[0] = sim.ey;
    cs[0] = -sim.d;
    for (let i = 0; i < N; i++) {
      cx[i + 1] = sim.x[i];
      cy[i + 1] = sim.y[i];
      cs[i + 1] = (i + 1) * sim.seg;
    }
    this.count = this.spline();

    // the pull hangs along the last stretch of cord
    let dx = sim.x[N - 1] - sim.x[N - 2];
    let dy = sim.y[N - 1] - sim.y[N - 2];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    this.beadX = sim.x[N - 1] + dx * BEAD_ATTACH;
    this.beadY = sim.y[N - 1] + dy * BEAD_ATTACH;
    this.beadUx = -dx;
    this.beadUy = -dy;

    // a box around cord and pull
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < this.count; i++) {
      const x = this.cord[i * 4];
      const y = this.cord[i * 4 + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const pad = CORD_R + 12;
    const box = this.box;
    box.minX = Math.min(minX, this.beadX - pad) - CORD_R;
    box.maxX = Math.max(maxX, this.beadX + pad) + CORD_R;
    box.minY = Math.min(minY, this.beadY - pad) - CORD_R;
    box.maxY = Math.max(maxY, this.beadY + pad) + CORD_R;
  }

  /** Scene-unit box the second pass covers. */
  private readonly objects = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  private objectsBox(sim: CordSim, layout: Layout) {
    const o = this.objects;
    const c = this.box;
    // canopy, cable, lamp (generously round the rim centre)
    let minX = Math.min(sim.ax, sim.ox) - 124;
    let maxX = Math.max(sim.ax, sim.ox) + 124;
    let minY = 0;
    let maxY = sim.oy + 124;
    // the cord, the pull and its glow
    minX = Math.min(minX, c.minX - 50);
    maxX = Math.max(maxX, c.maxX + 50);
    minY = Math.min(minY, c.minY - 50);
    maxY = Math.max(maxY, c.maxY + 50);
    // the cord's shadow: the cord's box seen from the bulb, 1.3× farther out
    const k = 1.3;
    const pen = 20;
    minX = Math.min(minX, this.bx + (c.minX - this.bx) * k - pen);
    maxX = Math.max(maxX, this.bx + (c.maxX - this.bx) * k + pen);
    minY = Math.min(minY, this.by + (c.minY - this.by) * k - pen);
    maxY = Math.max(maxY, this.by + (c.maxY - this.by) * k + pen);
    o.minX = Math.max(0, minX);
    o.minY = Math.max(0, minY);
    o.maxX = Math.min(layout.width, maxX);
    o.maxY = Math.min(layout.height, maxY);
    return o;
  }

  private uniforms(
    pass: Pass,
    sim: CordSim,
    light: LampLight,
    layout: Layout,
    palette: Palette,
    hover: number,
    px: number,
    width: number,
    height: number,
  ) {
    const { gl } = this;
    const { u } = pass;
    gl.useProgram(pass.program);
    gl.uniform2f(u("uRes"), width, height);
    gl.uniform1f(u("uPx"), px);
    gl.uniform2f(u("uView"), layout.width, layout.height);
    gl.uniform1f(u("uSeed"), this.seed);

    gl.uniform3fv(u("uWallLit"), palette.wallLit);
    gl.uniform3fv(u("uWallDark"), palette.wallDark);
    gl.uniform3fv(u("uWarm"), palette.warm);
    gl.uniform3fv(u("uGlowCol"), palette.glow);
    gl.uniform3fv(u("uLampCol"), this.lampCol);

    gl.uniform2f(u("uAnchor"), sim.ax, sim.ay);
    gl.uniform2f(u("uO"), sim.ox, sim.oy);
    gl.uniform2f(u("uRight"), sim.rx, sim.ry);
    gl.uniform2f(u("uDown"), sim.ux, sim.uy);
    gl.uniform2f(u("uBulb"), this.bx, this.by);

    const front = Math.max(1, light.front * this.reach);
    const room = light.room.value;
    gl.uniform1f(u("uEmit"), light.emission);
    gl.uniform1f(u("uFil"), light.filament);
    gl.uniform1f(u("uRoom"), room);
    gl.uniform1f(u("uFront"), front);
    gl.uniform1f(u("uReach"), this.reach);
    gl.uniform1f(u("uGlow"), light.glow);
    gl.uniform1f(u("uHover"), hover);
    // how lit the room is at the lamp itself
    const r = Math.min(1, Math.max(0, (room * (this.reach + front)) / front));
    gl.uniform1f(u("uRvLamp"), r * r * (3 - 2 * r));

    gl.uniform4fv(u("uCord"), this.cord);
    gl.uniform1i(u("uCordN"), this.count);
    const c = this.box;
    gl.uniform4f(u("uCordBox"), c.minX, c.minY, c.maxX, c.maxY);
    gl.uniform2f(u("uBeadO"), this.beadX, this.beadY);
    gl.uniform2f(u("uBeadUp"), this.beadUx, this.beadUy);
  }

  private put(k: number, x: number, y: number, s: number) {
    const cord = this.cord;
    cord[k * 4] = x;
    cord[k * 4 + 1] = y;
    cord[k * 4 + 2] = s;
    cord[k * 4 + 3] = 0;
  }

  /** Catmull-Rom through the control points, two pieces per span; returns the point count. */
  private spline(): number {
    const { cx, cy, cs } = this;
    const m = N + 1;
    // the weights for the point halfway along a span (t = 0.5)
    const a = -0.0625;
    const b = 0.5625;
    let k = 0;
    this.put(k++, cx[0], cy[0], cs[0]);
    for (let i = 0; i < m - 1; i++) {
      const i0 = Math.max(0, i - 1);
      const i2 = i + 1;
      const i3 = Math.min(m - 1, i + 2);
      if (k < CORD_POINTS - 1)
        this.put(
          k++,
          a * cx[i0] + b * cx[i] + b * cx[i2] + a * cx[i3],
          a * cy[i0] + b * cy[i] + b * cy[i2] + a * cy[i3],
          (cs[i] + cs[i2]) * 0.5,
        );
      if (k < CORD_POINTS) this.put(k++, cx[i2], cy[i2], cs[i2]);
    }
    return k;
  }

  dispose() {
    const { gl } = this;
    gl.deleteProgram(this.room.program);
    gl.deleteProgram(this.full.program);
    if (this.vao) gl.deleteVertexArray(this.vao);
  }
}
