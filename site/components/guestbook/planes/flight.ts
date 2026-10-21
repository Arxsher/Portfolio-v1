// A thrown plane leaving the command panel and flying off across the page.
//
// The panel clips its content, so at the moment of the throw the plane is
// handed to a small fixed canvas on <body> that follows it (a 320px square
// moved with a transform, so nothing full-screen is redrawn).
//
// Flight model (integrated every frame): the plane keeps a speed and a
// heading. The speed eases toward a gliding speed; the heading turns
// toward a gentle climb in the direction it was thrown, at a rate that
// falls as speed rises. So the flick decides the arc: a hard flick up
// shoots high and only slowly bends over into the glide, a flat one glides
// straight off, a flick down dips and pulls up, a soft one curves early.
// The plane also recedes (its scale decays) so it flies off into the page,
// its nose follows its heading and it banks into the turn. It ends off
// screen or once it has shrunk away, fading out.

import { anglesFrom, buildSheet } from "./fold";
import { PlaneScratch, drawPlane, drawShadow, projectPlane, type PlaneContent, type PlaneParams } from "./draw";
import type { PlaneLook, RGB } from "./look";
import { clamp, quatSlerp, quatToRigid, rigid, smoothstep, type Quat } from "./math";
import { SHEET } from "./note";
import { flightQuat, PLANE_PIVOT } from "./pose";

export type FlightStart = {
  /** Viewport position (CSS px) of the plane's middle. */
  x: number;
  y: number;
  /** Velocity, CSS px per second. */
  vx: number;
  vy: number;
  /** CSS px per sheet unit at the start. */
  scale: number;
  /** Orientation at the start (blends into the flight attitude). */
  quat: Quat;
  look: PlaneLook;
  paper: RGB;
  content: PlaneContent | null;
};

const BOX = 320;
/** Gliding speed, CSS px per second. */
const CRUISE = 640;
/** Climb angle of the glide (radians, screen y is down). */
const GLIDE = (-14 * Math.PI) / 180;

/** Fly a plane off across the page. Resolves once it is gone. */
export function launchFlight(start: FlightStart): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve();
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = BOX * dpr;
    canvas.height = BOX * dpr;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = `position:fixed;left:0;top:0;width:${BOX}px;height:${BOX}px;pointer-events:none;z-index:60;will-change:transform;contain:strict`;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return resolve();
    }

    const sheet = buildSheet(SHEET.width, SHEET.height);
    const scratch = new PlaneScratch(sheet);
    const angles = anglesFrom(sheet, 1, 1, 1, 1, new Float64Array(8));
    const params: PlaneParams = {
      sheet,
      angles,
      rot: rigid(),
      pivotX: PLANE_PIVOT.x,
      pivotY: 0,
      pivotZ: PLANE_PIVOT.z,
      x: BOX / 2,
      y: BOX / 2,
      scale: start.scale,
      focal: 900,
      paper: start.paper,
      look: start.look,
      content: start.content,
      creases: 0,
    };

    let { x, y } = start;
    let speed = Math.max(1, Math.hypot(start.vx, start.vy));
    let heading = Math.atan2(start.vy, start.vx);
    // Which way it glides off: the way it was thrown (right if straight up).
    const right = Math.abs(start.vx) < speed * 0.2 ? true : start.vx > 0;
    const target = right ? GLIDE : Math.PI - GLIDE;
    let scale = start.scale;
    let age = 0;
    let roll = 0;
    let last = 0;
    const blendQuat: Quat = [0, 0, 0, 1];
    const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

    const finish = () => {
      canvas.remove();
      resolve();
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
      last = now;
      age += dt;

      // speed eases to the glide; the heading bends toward it
      speed += (CRUISE - speed) * Math.min(1, dt * 1.3);
      let turn = target - heading;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      const rate = 2.3 * clamp(620 / speed, 0.45, 1.7);
      const dHeading = turn * Math.min(1, dt * rate);
      heading += dHeading;
      x += Math.cos(heading) * speed * dt;
      y += Math.sin(heading) * speed * dt;
      scale *= Math.exp(-dt * 0.85);

      // attitude: nose along the heading, banking into the turn
      roll += (clamp((dHeading / Math.max(dt, 1e-3)) * 14, -40, 40) - roll) * Math.min(1, dt * 7);
      const left = Math.cos(heading) < 0;
      const climb = (Math.atan2(-Math.sin(heading), Math.abs(Math.cos(heading))) * 180) / Math.PI;
      const attitude = flightQuat(18, left ? 195 : -15, clamp(left ? -climb : climb, -80, 80), left ? -roll : roll);
      quatSlerp(start.quat, attitude, smoothstep(0, 0.2, age), blendQuat);
      quatToRigid(blendQuat, params.rot);

      const { w, h } = viewport();
      const off = x < -BOX || x > w + BOX || y < -BOX || y > h + BOX;
      const fade = clamp((3.4 - age) / 0.35, 0, 1) * clamp((scale - 0.035) / 0.04, 0, 1);
      if (off || fade <= 0) {
        finish();
        return;
      }

      params.scale = scale;
      params.alpha = fade;
      canvas.style.transform = `translate3d(${x - BOX / 2}px, ${y - BOX / 2}px, 0)`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      projectPlane(params, scratch);
      const k = scale / 0.25;
      ctx.globalAlpha = fade * 0.9;
      drawShadow(ctx, dpr, scratch, 6 * k, 30 * k, 12 * k + 4, start.look.shadow);
      ctx.globalAlpha = 1;
      drawPlane(ctx, dpr, params, scratch);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
