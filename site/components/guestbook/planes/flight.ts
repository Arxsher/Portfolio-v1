// A thrown plane: it leaves the folding table, flies away from you, straight
// into the screen, and passes behind the page.
//
// World. A camera at the origin looks down +z at the viewport, which sits
// at depth F (so at depth F one world px is one CSS px). A point projects
// to (cx + F·x/z, cy + F·y/z): (cx, cy) is the vanishing point, a little
// above the middle of the viewport, where anything flying straight away
// converges. The plane starts at the table, a little in front of the page
// (depth 0.82F), sized and turned so its first frame matches the table's.
// The rotation handed to draw.ts carries the plane's world position, so the
// projection is true perspective: it shrinks with distance, and seen below
// the vanishing point you look down on its wings.
//
// Path (integrated every frame, dt-clamped). Launched mostly straight into
// depth, climbing a little, its heading tilted a few degrees by the flick's
// direction; the faster the flick, the faster and further it goes. Its
// horizontal speed eases to a glide and its climb relaxes into a gentle
// sink (the gravity arc). Late in the flight it banks left and its heading
// swings left (never back towards you), so it curves away; then it fades.
//
// Attitude. The nose trails the velocity (it weathervanes into the airflow,
// which whips it from the table pose into the flight) with a wobble that
// dies out. It spins about its long axis like a damped pendulum: the throw
// gives it a spin, drag slows it, and dihedral pulls it upright, so a hard
// flick barrel rolls a few times, slows, rocks and settles. The bank for the
// final turn rides on top.
//
// Layers. The plane is drawn on two small canvases that move with it (a
// transform per frame, no full-screen redraw): one above everything (z 60)
// for while it is in front of the page, one under the page content (z −1),
// so text and cards pass in front of it. It stays in front until it has
// cleared the surface it was thrown from (the floating panel); then the
// page plane is set just ahead of its nose and every part of it beyond that
// depth is drawn on the back layer only (faces are clipped at the crossing
// on the front layer), so it goes through the page nose first.
//
// Reduced motion: no spin and no path; it shrinks and fades into depth
// where it is, on the top layer.

import { anglesFrom, buildSheet } from "./fold";
import { PlaneScratch, drawPlane, drawShadow, projectPlane, type PlaneContent, type PlaneParams } from "./draw";
import type { PlaneLook, RGB } from "./look";
import { clamp, quatToRigid, rigid, smoothstep, type Quat, type Rigid } from "./math";
import { SHEET } from "./note";
import { PLANE_LENGTH, PLANE_PIVOT } from "./pose";

export type FlightStart = {
  /** Viewport position (CSS px) of the plane's middle. */
  x: number;
  y: number;
  /** The flick's velocity, CSS px per second (its direction steers a little). */
  vx: number;
  vy: number;
  /** How hard it was thrown, 0…1: speed, distance and spin. */
  strength: number;
  /** CSS px per sheet unit at the start. */
  scale: number;
  /** Orientation at the start, as the table drew it. */
  quat: Quat;
  look: PlaneLook;
  paper: RGB;
  content: PlaneContent | null;
  /** The surface it is thrown from (viewport px): it stays in front of the page until it has cleared it. */
  origin?: { left: number; top: number; right: number; bottom: number } | null;
  reduced?: boolean;
};

const DEG = Math.PI / 180;
/** Camera distance (CSS px); the folding table draws with the same focal. */
const F = 1000;
/** Where the plane starts: a little in front of the page. */
const START_DEPTH = 0.82 * F;
/** Height of the vanishing point, as a share of the viewport. */
const VANISH = 0.34;
/** Front layer: above the page and the dock. Back layer: under the page content. */
const Z_FRONT = 60;
const Z_BACK = -1;

type Layer = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; shown: boolean };

function makeLayer(z: number, name: string): Layer | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.flight = name;
  canvas.style.cssText = `position:fixed;left:0;top:0;pointer-events:none;z-index:${z};will-change:transform;contain:strict;visibility:hidden`;
  document.body.appendChild(canvas);
  return { canvas, ctx, shown: false };
}

function sizeLayer(layer: Layer, size: number, dpr: number) {
  layer.canvas.width = Math.round(size * dpr);
  layer.canvas.height = Math.round(size * dpr);
  layer.canvas.style.width = `${size}px`;
  layer.canvas.style.height = `${size}px`;
}

function showLayer(layer: Layer, shown: boolean) {
  if (layer.shown === shown) return;
  layer.shown = shown;
  layer.canvas.style.visibility = shown ? "visible" : "hidden";
  if (!shown) layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
}

/** Canvas size (CSS px) that holds a plane drawn at `scale`, with room to spin. */
const boxFor = (scale: number) => Math.max(64, Math.ceil((PLANE_LENGTH * scale * 1.25 + 72) / 16) * 16);

/**
 * Fill `out` with the rotation that points the nose (sheet +x) along the
 * unit vector f and rolls it by `roll` from wings-level (+ = right wing
 * down). Sheet "up" (−z) goes to the plane's up, and the sheet's y axis to
 * whatever keeps the frame right-handed.
 */
function orient(fx: number, fy: number, fz: number, roll: number, out: Rigid) {
  // wings-level up: world up (−y) made perpendicular to the nose
  let ux = fy * fx;
  let uy = fy * fy - 1;
  let uz = fy * fz;
  const len = Math.hypot(ux, uy, uz);
  if (len < 1e-5) {
    ux = 0;
    uy = 0;
    uz = -1;
  } else {
    ux /= len;
    uy /= len;
    uz /= len;
  }
  // right = f × up
  const rx = fy * uz - fz * uy;
  const ry = fz * ux - fx * uz;
  const rz = fx * uy - fy * ux;
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const ax = ux * c + rx * s;
  const ay = uy * c + ry * s;
  const az = uz * c + rz * s;
  // sheet y = (−up) × f
  const sx = -(ay * fz - az * fy);
  const sy = -(az * fx - ax * fz);
  const sz = -(ax * fy - ay * fx);
  out[0] = fx;
  out[1] = sx;
  out[2] = -ax;
  out[3] = fy;
  out[4] = sy;
  out[5] = -ay;
  out[6] = fz;
  out[7] = sz;
  out[8] = -az;
}

/** Roll of a plane whose nose is f and whose up is u, measured as orient() does. */
function rollOf(fx: number, fy: number, fz: number, ux: number, uy: number, uz: number): number {
  let lx = fy * fx;
  let ly = fy * fy - 1;
  let lz = fy * fz;
  const len = Math.hypot(lx, ly, lz) || 1;
  lx /= len;
  ly /= len;
  lz /= len;
  const rx = fy * lz - fz * ly;
  const ry = fz * lx - fx * lz;
  const rz = fx * ly - fy * lx;
  return Math.atan2(ux * rx + uy * ry + uz * rz, ux * lx + uy * ly + uz * lz);
}

/** Rotate v (in place) by the smallest rotation taking +z to the unit vector d. */
function turnToRay(v: number[], dx: number, dy: number, dz: number) {
  const ax0 = -dy;
  const ay0 = dx;
  const s = Math.hypot(ax0, ay0);
  if (s < 1e-6) return;
  const ax = ax0 / s;
  const ay = ay0 / s;
  const c = dz;
  const [x, y, z] = v;
  // Rodrigues, axis (ax, ay, 0), sin = s, cos = c
  const dot = ax * x + ay * y;
  const cx = ay * z;
  const cy = -ax * z;
  const cz = ax * y - ay * x;
  v[0] = x * c + cx * s + ax * dot * (1 - c);
  v[1] = y * c + cy * s + ay * dot * (1 - c);
  v[2] = z * c + cz * s;
}

/** Fly a thrown plane away into the page. Resolves once it is gone. */
export function launchFlight(start: FlightStart): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve();
    const reduced = Boolean(start.reduced);
    const front = makeLayer(Z_FRONT, "front");
    const back = reduced ? null : makeLayer(Z_BACK, "behind");
    if (!front || (!reduced && !back)) {
      front?.canvas.remove();
      back?.canvas.remove();
      return resolve();
    }
    const layers = back ? [front, back] : [front];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = boxFor(start.scale);
    for (const layer of layers) sizeLayer(layer, size, dpr);

    const sheet = buildSheet(SHEET.width, SHEET.height);
    const scratch = new PlaneScratch(sheet);
    const params: PlaneParams = {
      sheet,
      angles: anglesFrom(sheet, 1, 1, 1, 1, new Float64Array(8)),
      rot: rigid(),
      pivotX: PLANE_PIVOT.x,
      pivotY: 0,
      pivotZ: PLANE_PIVOT.z,
      x: 0,
      y: 0,
      scale: start.scale,
      focal: F,
      paper: start.paper,
      look: start.look,
      content: start.content,
      creases: 0,
    };
    const rot = params.rot;
    // Far away, its hairline edges would vanish into the page: they firm
    // up as it shrinks, so the plane still reads as folded paper.
    const look: PlaneLook = { ...start.look };
    params.look = look;
    const maxVerts = scratch.cam.length / (scratch.n * 3);

    // --- where it starts --------------------------------------------------
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = vw / 2;
    const cy = vh * VANISH;
    let z = START_DEPTH;
    let x = ((start.x - cx) * z) / F;
    let y = ((start.y - cy) * z) / F;
    /** World px per sheet unit (fixed: the plane's real size). */
    const unit = (start.scale * z) / F;

    // The table drew the plane looking straight at it; here it is seen
    // along the ray from the camera, so turn it by that ray to match.
    const startRot = quatToRigid(start.quat);
    const ray = Math.hypot(x, y, z);
    const nose = [startRot[0], startRot[3], startRot[6]];
    const up = [-startRot[2], -startRot[5], -startRot[8]];
    turnToRay(nose, x / ray, y / ray, z / ray);
    turnToRay(up, x / ray, y / ray, z / ray);
    let [fx, fy, fz] = nose;

    // --- the throw --------------------------------------------------------
    const power = clamp(start.strength, 0, 1);
    const flick = Math.hypot(start.vx, start.vy) || 1;
    const across = start.vx / flick;
    const down = start.vy / flick;
    // the flick's direction tilts the heading a little; mostly it goes away
    const side = Math.tan(13 * DEG) * across;
    const climb = Math.tan((10 + 8 * Math.max(0, -down) - 8 * Math.max(0, down)) * DEG);
    const speed0 = F * (1.55 + 2.3 * power);
    const norm = Math.hypot(side, climb, 1);
    let vx = (speed0 * side) / norm;
    let vy = (-speed0 * climb) / norm;
    let vz = speed0 / norm;
    const turnAt = 0.95 + 0.4 * power;
    const endAt = turnAt + 1.55;

    // spin about the long axis, from the roll it already has
    let spin = rollOf(fx, fy, fz, up[0], up[1], up[2]);
    let spinRate = (start.vx >= 0 ? 1 : -1) * 2 * Math.PI * (1.3 + 2.4 * power);
    let bank = 0;

    /** Depth of the page (world px) once it can pass behind it; Infinity before. */
    let page = Infinity;
    let age = 0;
    let last = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      for (const layer of layers) layer.canvas.remove();
      resolve();
    };

    const step = (dt: number) => {
      age += dt;
      if (reduced) {
        // recede straight back and fade
        const t = clamp(age / 0.5, 0, 1);
        z = START_DEPTH * (1 + 0.9 * (1 - (1 - t) * (1 - t) * (1 - t)));
        return;
      }
      // path
      const turning = smoothstep(turnAt, turnAt + 0.5, age);
      const cruise = F * (1.35 + 0.6 * turning);
      const level = Math.hypot(vx, vz) || 1;
      const ease = (level + (cruise - level) * Math.min(1, dt * 1.2)) / level;
      vx *= ease;
      vz *= ease;
      const sink = 0.07 * cruise + 0.12 * F * turning;
      vy += (sink - vy) * Math.min(1, dt * 1.25);
      if (turning > 0) {
        // swing the heading to the left (0 = straight away), never past ~83°
        const heading = Math.atan2(-vx, vz);
        const a = 2.3 * turning * clamp((1.45 - heading) / 0.3, 0, 1) * dt;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const nx = vx * c - vz * s;
        vz = vx * s + vz * c;
        vx = nx;
      }
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;

      // nose trails the velocity
      const speed = Math.hypot(vx, vy, vz) || 1;
      const follow = Math.min(1, dt * 7);
      fx += (vx / speed - fx) * follow;
      fy += (vy / speed - fy) * follow;
      fz += (vz / speed - fz) * follow;
      const fl = Math.hypot(fx, fy, fz) || 1;
      fx /= fl;
      fy /= fl;
      fz /= fl;

      // spin: damped, with dihedral pulling it upright once it slows
      const upright = 22 * smoothstep(0.35, 1.2, age);
      spinRate += (-spinRate * 1.1 - upright * Math.sin(spin)) * dt;
      spin += spinRate * dt;
      bank += (-0.95 * turning - bank) * Math.min(1, dt * 4);
    };

    const pose = () => {
      let nx = fx;
      let ny = fy;
      let nz = fz;
      let roll = spin + bank;
      if (!reduced) {
        // the throw's wobble: the nose wags and nods, dying out
        const wobble = (0.1 + 0.14 * power) * Math.exp(-age / 0.5) * smoothstep(0, 0.08, age);
        if (wobble > 1e-4) {
          const yaw = wobble * Math.sin(2 * Math.PI * 2.4 * age + 0.6);
          const nod = 0.7 * wobble * Math.sin(2 * Math.PI * 3.1 * age);
          // level up and right for the nose, as in orient()
          let lx = fy * fx;
          let ly = fy * fy - 1;
          let lz = fy * fz;
          const len = Math.hypot(lx, ly, lz) || 1;
          lx /= len;
          ly /= len;
          lz /= len;
          const rx = fy * lz - fz * ly;
          const ry = fz * lx - fx * lz;
          const rz = fx * ly - fy * lx;
          nx += rx * yaw + lx * nod;
          ny += ry * yaw + ly * nod;
          nz += rz * yaw + lz * nod;
          const n = Math.hypot(nx, ny, nz) || 1;
          nx /= n;
          ny /= n;
          nz /= n;
        }
      } else {
        roll = spin;
      }
      orient(nx, ny, nz, roll, rot);
      // the world position rides in the rotation's translation (sheet units)
      rot[9] = x / unit;
      rot[10] = y / unit;
      rot[11] = 0;
    };

    /** Project with the box centred on the plane; returns the box's viewport corner. */
    const place = () => {
      const sx = cx + (F * x) / z;
      const sy = cy + (F * y) / z;
      const left = sx - size / 2;
      const top = sy - size / 2;
      params.scale = (unit * F) / z;
      params.x = cx - left;
      params.y = cy - top;
      projectPlane(params, scratch);
      return { left, top };
    };

    // a face clipped by one plane gains at most one corner
    const cut = new Float64Array((maxVerts + 2) * 2);
    const clip = (ctx: CanvasRenderingContext2D, near: number) => {
      // union of every face's part in front of the page, all wound the same
      // way so "nonzero" adds them up
      const cam = scratch.cam;
      ctx.beginPath();
      for (let r = 0; r < scratch.n; r++) {
        const count = sheet.regions[r].count;
        let m = 0;
        const put = (px: number, py: number, pz: number) => {
          const f = F / Math.max(pz, 1);
          cut[m * 2] = params.x + px * f;
          cut[m * 2 + 1] = params.y + py * f;
          m++;
        };
        for (let k = 0; k < count; k++) {
          const a = (r * maxVerts + k) * 3;
          const b = (r * maxVerts + ((k + 1) % count)) * 3;
          const az = cam[a + 2];
          const bz = cam[b + 2];
          if (az < near) put(cam[a], cam[a + 1], az);
          if (az < near !== bz < near) {
            const t = (near - az) / (bz - az);
            put(cam[a] + (cam[b] - cam[a]) * t, cam[a + 1] + (cam[b + 1] - cam[a + 1]) * t, near);
          }
        }
        if (m < 3) continue;
        let area = 0;
        for (let i = 0; i < m; i++) {
          const j = (i + 1) % m;
          area += cut[i * 2] * cut[j * 2 + 1] - cut[j * 2] * cut[i * 2 + 1];
        }
        for (let i = 0; i < m; i++) {
          const k = area >= 0 ? i : m - 1 - i;
          if (i) ctx.lineTo(cut[k * 2], cut[k * 2 + 1]);
          else ctx.moveTo(cut[k * 2], cut[k * 2 + 1]);
        }
        ctx.closePath();
      }
      ctx.clip("nonzero");
    };

    const render = () => {
      pose();
      let { left, top } = place();
      const distance = clamp(1 - params.scale / start.scale, 0, 1);
      look.edge = start.look.edge * (1 + 1.6 * distance);
      look.crease = start.look.crease * (1 + 1.2 * distance);
      // keep the boxes just big enough
      const shadow = reduced ? 0 : 1 - smoothstep(0, 0.3, age);
      const grow = params.scale / start.scale;
      const shadowDx = (6 + 40 * age) * grow;
      const shadowDy = (26 + 220 * age) * grow;
      const shadowBlur = (12 + 40 * age) * grow;
      const margin = (shadow > 0 ? shadowDy + shadowBlur * 1.5 : 0) + 6;
      const half = size / 2;
      const reach =
        Math.max(half - scratch.minX, scratch.maxX - half, half - scratch.minY, scratch.maxY - half) + margin;
      if (reach * 2 > size || (reach * 2 < size * 0.45 && size > 64)) {
        size = Math.max(64, Math.ceil((reach * 2 * 1.2) / 16) * 16);
        for (const layer of layers) sizeLayer(layer, size, dpr);
        ({ left, top } = place());
      }

      // gone off screen?
      const x0 = left + scratch.minX;
      const x1 = left + scratch.maxX;
      const y0 = top + scratch.minY;
      const y1 = top + scratch.maxY;
      if (age > 0.3 && (x1 < 0 || x0 > vw || y1 < 0 || y0 > vh)) return false;

      const alpha = reduced
        ? 1 - smoothstep(0.08, 0.5, age)
        : clamp((endAt - age) / 0.45, 0, 1);
      if (alpha <= 0.002) return false;
      params.alpha = alpha;

      // through the page: once clear of where it was thrown from, the page
      // sits just ahead of its nose
      const depth = z / F; // camera-space z (draw units) → world px
      if (!reduced && page === Infinity) {
        const o = start.origin;
        const clear = o ? x1 < o.left - 2 || x0 > o.right + 2 || y1 < o.top - 2 || y0 > o.bottom + 2 : age > 0.15;
        if (clear || age > 0.9) {
          let far = 0;
          for (let r = 0; r < scratch.n; r++) {
            const count = sheet.regions[r].count;
            for (let k = 0; k < count; k++) far = Math.max(far, scratch.cam[(r * maxVerts + k) * 3 + 2]);
          }
          page = far * depth + 0.5;
        }
      }
      const near = page / depth; // the page's depth in draw units
      let inFront = 0;
      let total = 0;
      for (let r = 0; r < scratch.n; r++) {
        const count = sheet.regions[r].count;
        for (let k = 0; k < count; k++) {
          total++;
          if (scratch.cam[(r * maxVerts + k) * 3 + 2] < near) inFront++;
        }
      }

      const transform = `translate3d(${left}px, ${top}px, 0)`;
      for (const layer of layers) layer.canvas.style.transform = transform;

      // front: whatever is still in front of the page
      showLayer(front, inFront > 0);
      if (inFront > 0) {
        const ctx = front.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, front.canvas.width, front.canvas.height);
        if (shadow > 0.002 && page === Infinity) {
          ctx.globalAlpha = alpha * shadow * 0.9;
          drawShadow(ctx, dpr, scratch, shadowDx, shadowDy, shadowBlur, start.look.shadow);
          ctx.globalAlpha = 1;
        }
        if (inFront < total) {
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          clip(ctx, near);
          drawPlane(ctx, dpr, params, scratch);
          ctx.restore();
        } else {
          drawPlane(ctx, dpr, params, scratch);
        }
      }
      // back: the whole plane, under the page (the front layer covers the
      // part still in front)
      if (back) {
        showLayer(back, inFront < total);
        if (inFront < total) {
          const ctx = back.ctx;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, back.canvas.width, back.canvas.height);
          drawPlane(ctx, dpr, params, scratch);
        }
      }
      return true;
    };

    const frame = (now: number) => {
      if (done) return;
      const dt = last ? clamp((now - last) / 1000, 0, 1 / 30) : 1 / 60;
      last = now;
      step(dt);
      if (!render() || age > 8) {
        finish();
        return;
      }
      requestAnimationFrame(frame);
    };

    // first frame now, where the table left it, so the hand-over is seamless
    if (!render()) {
      finish();
      return;
    }
    requestAnimationFrame(frame);
  });
}
