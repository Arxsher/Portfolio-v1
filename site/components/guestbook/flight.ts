"use client";

// The moment a signature leaves the sign form and flies into its window.
//
// The sign form and the guest house never import each other: every house
// on the page registers itself here, and after a successful signature the
// form calls flySignature(entry, sourceSvg). If a house shows that entry's
// window fully on screen, a copy of the signature lifts off the form's lit
// pane and travels to the window:
//
// - Path: a cubic Bézier from the pane to the window that first rises
//   (a toss rather than a slide) and drops into the window from above.
// - Clock: one spring drives progress along the path (stiffness 40,
//   damping 12: just under critical, so it arrives briskly and eases in
//   with the faintest settle). The size shrinks on a log scale so it reads
//   as moving away, the stroke thins to the window's, the ink takes the
//   window's colour on the way, it banks a little into the curve, and a
//   soft shadow grows while it is in the air and is gone when it lands.
// - Every frame the window is located again, so scrolling mid-flight just
//   bends the path. At 95% the house lights the window (flash, ring and a
//   click), and the copy dissolves into the window's own signature.
//
// No visible window, or reduced motion: no flight. The houses are told to
// light the window (house.tsx flashes it later, once it scrolls into view).

import { Spring } from "@/components/lab/hooks";
import type { GuestbookEntry } from "@/lib/guestbook";
import { signatureBounds } from "./signature";

export type WindowTarget = {
  /** Viewport box the window's signature is drawn into (centred, meet). */
  rect: DOMRect;
  /** The window's ink colour. */
  color: string;
  /** The window's stroke width in px. */
  stroke: number;
};

export type HouseTarget = {
  locate(id: string): WindowTarget | null;
  /** The signature is in: light the window. `flown` when it arrived by flight. */
  land(id: string, flown: boolean): void;
};

const houses = new Set<HouseTarget>();

export function registerHouse(house: HouseTarget): () => void {
  houses.add(house);
  return () => {
    houses.delete(house);
  };
}

type Box = { x: number; y: number; w: number; h: number };

/** Where the ink of a signature with `bounds` sits when drawn centred ("meet") into `box`. */
export function inkBox(box: { left: number; top: number; width: number; height: number }, bounds: { width: number; height: number }): Box {
  const scale = Math.min(box.width / bounds.width, box.height / bounds.height);
  const w = bounds.width * scale;
  const h = bounds.height * scale;
  return { x: box.left + (box.width - w) / 2, y: box.top + (box.height - h) / 2, w, h };
}

const fullyVisible = (rect: DOMRect) =>
  rect.width > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Fly `entry`'s signature from `source` (the form's lit signature) into its
 * window. Returns true when a flight started.
 */
export function flySignature(entry: GuestbookEntry, source: SVGSVGElement | null): boolean {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bounds = signatureBounds(entry.signature);
  let house: HouseTarget | null = null;
  let first: WindowTarget | null = null;
  if (!reduced && source && bounds && source.isConnected) {
    for (const candidate of houses) {
      const target = candidate.locate(entry.id);
      if (target && fullyVisible(target.rect)) {
        house = candidate;
        first = target;
        break;
      }
    }
  }
  if (!house || !first || !bounds || !source) {
    houses.forEach((h) => h.land(entry.id, false));
    return false;
  }

  const from = inkBox(source.getBoundingClientRect(), bounds);
  const sourceStyle = getComputedStyle(source);
  const fromColor = sourceStyle.color;
  const fromStroke = 2;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText =
    "position:fixed;left:0;top:0;overflow:visible;pointer-events:none;z-index:2147483000;will-change:transform,width,height;transform-origin:50% 50%;transition:color .45s ease-out, opacity .24s ease-out;";
  svg.style.color = fromColor;
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", entry.signature);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.setAttribute("stroke-width", String(fromStroke));
  svg.appendChild(path);
  // Start exactly over the pane's ink, so the first painted frame matches.
  svg.style.width = `${from.w}px`;
  svg.style.height = `${from.h}px`;
  svg.style.transform = `translate3d(${from.x}px, ${from.y}px, 0)`;
  document.body.appendChild(svg);
  source.style.transition = "opacity 120ms ease-out";
  source.style.opacity = "0";

  const progress = new Spring(0, { stiffness: 40, damping: 12, precision: 0.0005 });
  progress.to(1);
  const owner = house;
  let target = first;
  let landed = false;
  let recoloured = false;
  let last = performance.now();
  const started = last;

  const finish = () => {
    window.setTimeout(() => svg.remove(), 280);
    svg.style.opacity = "0";
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = progress.step(dt);
    const located = houses.has(owner) ? owner.locate(entry.id) : null;
    if (located) target = located;
    const to = inkBox(target.rect, bounds);

    // the path: rise from the pane, drop into the window from above
    const x0 = from.x + from.w / 2;
    const y0 = from.y + from.h / 2;
    const x3 = to.x + to.w / 2;
    const y3 = to.y + to.h / 2;
    const dist = Math.hypot(x3 - x0, y3 - y0);
    const lift = Math.min(200, Math.max(80, dist * 0.32));
    const x1 = x0 + (x3 - x0) * 0.15;
    const y1 = Math.min(y0, y3) - lift;
    const x2 = x3 - (x3 - x0) * 0.05;
    const y2 = y3 - lift * 0.55;
    const u = Math.min(1.04, Math.max(0, t));
    const iu = 1 - u;
    const bx = iu * iu * iu * x0 + 3 * iu * iu * u * x1 + 3 * iu * u * u * x2 + u * u * u * x3;
    const by = iu * iu * iu * y0 + 3 * iu * iu * u * y1 + 3 * iu * u * u * y2 + u * u * u * y3;
    const dx = 3 * iu * iu * (x1 - x0) + 6 * iu * u * (x2 - x1) + 3 * u * u * (x3 - x2);
    const dy = 3 * iu * iu * (y1 - y0) + 6 * iu * u * (y2 - y1) + 3 * u * u * (y3 - y2);

    const k = Math.min(1, Math.max(0, t));
    const w = Math.exp(Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * k);
    const h = Math.exp(Math.log(from.h) + (Math.log(to.h) - Math.log(from.h)) * k);
    const air = Math.sin(Math.PI * k);
    const bank = Math.max(-0.22, Math.min(0.22, (dx / (Math.hypot(dx, dy) || 1)) * 0.16 * air));

    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;
    svg.style.transform = `translate3d(${bx - w / 2}px, ${by - h / 2}px, 0) rotate(${bank}rad)`;
    svg.style.filter = air > 0.02 ? `drop-shadow(0 ${(air * 9).toFixed(1)}px ${(air * 10).toFixed(1)}px rgb(0 0 0 / ${(air * 0.18).toFixed(3)}))` : "none";
    path.setAttribute("stroke-width", (fromStroke + (target.stroke - fromStroke) * k).toFixed(2));
    if (!recoloured && k > 0.45) {
      recoloured = true;
      svg.style.color = target.color;
    }

    if (!landed && (t >= 0.95 || now - started > 1800)) {
      landed = true;
      if (houses.has(owner)) owner.land(entry.id, true);
      houses.forEach((h) => h !== owner && h.land(entry.id, false));
      finish();
    }
    if (progress.settled || now - started > 2200) {
      if (!landed) {
        landed = true;
        owner.land(entry.id, true);
        finish();
      }
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return true;
}
