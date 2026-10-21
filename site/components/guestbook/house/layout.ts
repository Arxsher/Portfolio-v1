// The guest house's geometry: one building on a model plinth, drawn in a
// front-on oblique projection so the facade (where the windows are) stays
// a flat, readable rectangle while the side wall, the roof and the plinth
// give it Commit city's massing-model depth.
//
// Units are CSS px at scale 1. x runs right along the facade, `up` is the
// height above the plinth, z runs away from the viewer (z = 0 is the
// facade). The screen point of (x, up, z) is
//
//   sx = x + z·DX        sy = −(up + z·DY)          (y down, like SVG)
//
// so depth goes up and to the right. Everything the component draws comes
// from here, and the window buttons are placed in percentages of the same
// box, so the SVG and the HTML line up at any size.
//
// Floors: every guest gets the next window, five to a floor, filled from
// the first floor up, left to right. The building is as tall as it needs
// to be to hold everyone plus one free window (and never shorter than
// MIN_FLOORS). When it is taller than `maxFloors`, the floors in between
// are left out behind an architectural break line, so the lobby and the
// newest floors always show.

export const PER_FLOOR = 5;
export const MIN_FLOORS = 3;

export const WIN_W = 52;
export const WIN_H = 38;
const GAP_X = 16;
const PAD_X = 26;
/** Facade width. */
export const FW = PAD_X * 2 + PER_FLOOR * WIN_W + (PER_FLOOR - 1) * GAP_X;
const FLOOR_H = 58;
/** Window sill height above its floor line. */
const WIN_Y = 10;
const LOBBY_H = 80;
const BREAK_H = 34;
const PARAPET_H = 18;
/** Building depth (z). */
const DEPTH = 96;
export const DX = 0.42;
export const DY = 0.3;

const PLINTH = { left: 78, right: 88, front: 76, back: 18, thick: 12 };

export type Pt = readonly [number, number];

/** Screen point of a model point. */
export const P = (x: number, up: number, z: number): Pt => [x + z * DX, -(up + z * DY)];

export type Rect = { x: number; y: number; w: number; h: number };

export type Slot = {
  /** Sign order, 0 = the first guest. */
  index: number;
  floor: number;
  col: number;
  /** The window opening in screen units. */
  rect: Rect;
};

export type HouseLayout = {
  floors: number;
  /** Floors drawn, lowest first. */
  shown: number[];
  /** Floors left out behind the break line (inclusive), or null. */
  hidden: { from: number; to: number } | null;
  /** Facade height (lobby to parapet). */
  height: number;
  box: Rect;
  /** Horizontal extent of the building itself (phones fit this, not the plinth). */
  core: { x: number; w: number };
  slots: Slot[];
  /** y (up) of every floor line above the lobby, for the slab lines. */
  slabs: number[];
  /** Up position of the break band's bottom, when there is one. */
  breakAt: number | null;
  lobbyHeight: number;
  plinth: typeof PLINTH;
  depth: number;
  rooftop: { x0: number; x1: number; z0: number; z1: number; h: number; antenna: { x: number; z: number; h: number } };
};

/** Floors needed for `total` guests plus the free window. */
export function floorsFor(total: number): number {
  return Math.max(MIN_FLOORS, Math.ceil((Math.max(0, total) + 1) / PER_FLOOR));
}

export function houseLayout(total: number, maxFloors: number): HouseLayout {
  const floors = floorsFor(total);
  const limit = Math.max(2, maxFloors);
  const broken = floors > limit;
  const first = broken ? floors - limit + 1 : 1;
  const shown: number[] = [];
  for (let f = first; f <= floors; f++) shown.push(f);
  const floorsBase = LOBBY_H + (broken ? BREAK_H : 0);
  const height = floorsBase + shown.length * FLOOR_H + PARAPET_H;

  const slots: Slot[] = [];
  shown.forEach((floor, k) => {
    const base = floorsBase + k * FLOOR_H;
    for (let col = 0; col < PER_FLOOR; col++) {
      const x = PAD_X + col * (WIN_W + GAP_X);
      const top = -(base + WIN_Y + WIN_H);
      slots.push({ index: (floor - 1) * PER_FLOOR + col, floor, col, rect: { x, y: top, w: WIN_W, h: WIN_H } });
    }
  });

  const slabs: number[] = [];
  for (let k = 0; k <= shown.length; k++) slabs.push(floorsBase + k * FLOOR_H);

  const rooftop = {
    x0: FW - 132,
    x1: FW - 60,
    z0: 24,
    z1: 70,
    h: 24,
    antenna: { x: FW - 76, z: 47, h: 32 },
  };

  // Bounds: plinth corners, roof, rooftop box and antenna, plus a margin
  // for the shadows, the glow and the stars.
  const pts: Pt[] = [
    P(-PLINTH.left, -PLINTH.thick, -PLINTH.front),
    P(FW + PLINTH.right, -PLINTH.thick, -PLINTH.front),
    P(FW + PLINTH.right, 0, DEPTH + PLINTH.back),
    P(-PLINTH.left, 0, DEPTH + PLINTH.back),
    P(0, height, DEPTH),
    P(FW, height, DEPTH),
    P(rooftop.antenna.x, height + rooftop.h + rooftop.antenna.h, rooftop.antenna.z),
  ];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const box: Rect = { x: minX - 10, y: minY - 22, w: maxX - minX + 20, h: maxY - minY + 34 };
  const coreX0 = -26;
  const coreX1 = FW + DEPTH * DX + 26;

  return {
    floors,
    shown,
    hidden: broken ? { from: 1, to: first - 1 } : null,
    height,
    box,
    core: { x: coreX0, w: coreX1 - coreX0 },
    slots,
    slabs,
    breakAt: broken ? LOBBY_H : null,
    lobbyHeight: LOBBY_H,
    plinth: PLINTH,
    depth: DEPTH,
    rooftop,
  };
}

/** The red light on top of the antenna (screen units). */
export function beaconPoint(layout: HouseLayout): Pt {
  const { rooftop, height } = layout;
  return P(rooftop.antenna.x, height + rooftop.h + rooftop.antenna.h, rooftop.antenna.z);
}

/** SVG path through points. */
export function poly(points: readonly Pt[]): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${r(x)} ${r(y)}`).join("") + "Z";
}

/**
 * A parallelogram with rounded corners (the plinth top): `radius` is cut
 * from each edge and the corners are quadratic curves through the vertex.
 */
export function roundedPoly(points: readonly Pt[], radius: number): string {
  const n = points.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = points[(i + n - 1) % n];
    const cur = points[i];
    const next = points[(i + 1) % n];
    const a = toward(cur, prev, radius);
    const b = toward(cur, next, radius);
    d += `${i ? "L" : "M"}${r(a[0])} ${r(a[1])}Q${r(cur[0])} ${r(cur[1])} ${r(b[0])} ${r(b[1])}`;
  }
  return d + "Z";
}

function toward(from: Pt, to: Pt, distance: number): Pt {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) || 1;
  const t = Math.min(0.5, distance / length);
  return [from[0] + dx * t, from[1] + dy * t];
}

export const r = (n: number) => Math.round(n * 100) / 100;

/** Stable 0..1 hash of a string (FNV-1a). */
export function hashUnit(text: string, salt = 0): number {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}
