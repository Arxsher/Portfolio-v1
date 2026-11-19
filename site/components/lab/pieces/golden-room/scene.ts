// The room, the camera and the sun, as plain numbers shared by the shaders
// (which get them baked in as GLSL constants, see glslScene()) and the
// piece (framing, the sun handle, picking, the light levels per frame).
//
// World units are metres. The room's inside is the box [0, W] × [0, H] ×
// [0, D] with the floor at y = 0. Wall A (x = 0, the window wall) is the
// left wall on screen, wall B (z = 0, the desk wall) the right one; the two
// walls nearest the camera, and the ceiling, are cut away for the view but
// still keep the light out, so sunlight only gets in through the window.
//
// The window faces west-south-west at a middle latitude (34°, sun 10°
// north of the equator), so the room gets no sun in the morning, a patch
// under the window from about midday, and long golden light raking across
// the floor and up the desk wall toward sunset at 19:45.

import { clamp, lerp, smoothstep } from "../../hooks";

export type Vec3 = [number, number, number];
type ReadVec3 = readonly [number, number, number];

const DEG = Math.PI / 180;

/* ---------------------------------------------------------------------- */
/* the room                                                                */
/* ---------------------------------------------------------------------- */

export const ROOM = {
  /** Inside width along x (from the window wall to the cut-away front right). */
  W: 4.2,
  /** Inside depth along z (from the desk wall to the cut-away front left). */
  D: 4.2,
  H: 2.7,
  /** Wall thickness. */
  T: 0.16,
  /** Floor slab thickness (the model's base). */
  slab: 0.2,
} as const;

/** The window in wall A: the opening through the wall, in (y, z). */
export const WINDOW = {
  y0: 0.8,
  y1: 2.42,
  z0: 1.42,
  z1: 3.12,
  /** Steel frame width inside the opening, and the glazing bars. */
  frame: 0.05,
  bar: 0.026,
  cols: 3,
  rows: 4,
} as const;

/** Inside area of the opening (m²): how much sky and sun the room gets. */
export const WINDOW_AREA = (WINDOW.y1 - WINDOW.y0) * (WINDOW.z1 - WINDOW.z0);
/** Centre of the opening on the inside face of the wall. */
export const WINDOW_CENTRE: ReadVec3 = [0, (WINDOW.y0 + WINDOW.y1) / 2, (WINDOW.z0 + WINDOW.z1) / 2];

export const DESK = {
  /** Centre of the top, half extents. */
  top: [2.72, 0.738, 0.4] as ReadVec3,
  half: [0.95, 0.017, 0.36] as ReadVec3,
};
/** Height of the desk's top surface. */
export const DESK_Y = DESK.top[1] + DESK.half[1];

export const MONITOR = {
  /** Panel centre and half extents (it faces +z, toward the room). */
  centre: [2.72, 1.17, 0.19] as ReadVec3,
  half: [0.32, 0.19, 0.012] as ReadVec3,
  bezel: 0.014,
};

/** The desk lamp: base, elbow, head (narrow end of the shade) and the shade's axis. */
const lampHead: ReadVec3 = [3.16, 1.31, 0.43];
const lampAxisRaw: ReadVec3 = [-0.3, -0.84, 0.45];
const lampAxisLen = Math.hypot(...lampAxisRaw);
const lampAxis: ReadVec3 = [lampAxisRaw[0] / lampAxisLen, lampAxisRaw[1] / lampAxisLen, lampAxisRaw[2] / lampAxisLen];
export const LAMP = {
  base: [3.38, DESK_Y, 0.2] as ReadVec3,
  elbow: [3.32, 1.24, 0.13] as ReadVec3,
  head: lampHead,
  axis: lampAxis,
  /** Shade length and its radii at the head and at the mouth. */
  shadeLen: 0.17,
  shadeR0: 0.032,
  shadeR1: 0.088,
  /** The bulb, a little way down the shade. */
  bulb: [lampHead[0] + lampAxis[0] * 0.06, lampHead[1] + lampAxis[1] * 0.06, lampHead[2] + lampAxis[2] * 0.06] as ReadVec3,
};

export const CHAIR = {
  /** Floor point under the seat's centre, and its turn (radians, about y). */
  at: [2.62, 0, 1.2] as ReadVec3,
  yaw: -0.24,
};

export const PLANT = {
  /** Floor point under the pot. */
  at: [0.62, 0, 0.66] as ReadVec3,
  potH: 0.44,
  potR0: 0.15,
  potR1: 0.2,
};

/** A round clock on the desk wall (its hands show the hour you set). */
export const CLOCK = { centre: [2.72, 1.98, 0] as ReadVec3, r: 0.15, depth: 0.035 };
/** A framed print on the desk wall, where the late sun lands. */
export const PRINT = { centre: [1.18, 1.42, 0] as ReadVec3, half: [0.24, 0.31, 0.012] as ReadVec3 };

/** A leaf of the fig: centre, length axis u, normal w, side v, and half length / half width. */
export type Leaf = { c: Vec3; u: Vec3; w: Vec3; v: Vec3; len: number; wid: number };

const normalize = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: ReadVec3, b: ReadVec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** The fig's stem, as two capsules from the soil up. */
export const STEM: readonly ReadVec3[] = [
  [PLANT.at[0], PLANT.potH - 0.03, PLANT.at[2]],
  [PLANT.at[0] + 0.04, 1.12, PLANT.at[2] - 0.03],
  [PLANT.at[0] - 0.02, 1.74, PLANT.at[2] + 0.05],
];

function stemPoint(t: number): Vec3 {
  // t 0..1 along both segments
  const seg = t < 0.5 ? 0 : 1;
  const k = seg === 0 ? t * 2 : (t - 0.5) * 2;
  const a = STEM[seg];
  const b = STEM[seg + 1];
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
}

/** Big, round, slightly cupped leaves spiralling up the stem (golden angle), younger ones pointing up. */
export const LEAVES: readonly Leaf[] = (() => {
  const leaves: Leaf[] = [];
  const count = 13;
  for (let i = 0; i < count; i++) {
    const k = i / (count - 1);
    const t = 0.3 + k * 0.7;
    const s = stemPoint(t);
    const azimuth = i * 2.39996 + 0.6;
    const pitch = lerp(-0.12, 0.85, Math.pow(k, 1.4)); // older leaves hang, the top ones rise
    const dir = normalize([Math.cos(azimuth) * Math.cos(pitch), Math.sin(pitch), Math.sin(azimuth) * Math.cos(pitch)]);
    const len = lerp(0.15, 0.12, k) * (0.92 + 0.16 * ((i * 7) % 5) / 4);
    const wid = len * 0.66;
    const c: Vec3 = [s[0] + dir[0] * (len + 0.02), s[1] + dir[1] * (len + 0.02) + 0.02, s[2] + dir[2] * (len + 0.02)];
    const side = normalize(cross([0, 1, 0], dir));
    // roll each leaf a little about its length so the faces catch light differently
    const roll = (((i * 5) % 7) / 6 - 0.5) * 0.9;
    let w = normalize(cross(dir, side));
    w = normalize([
      w[0] * Math.cos(roll) + side[0] * Math.sin(roll),
      w[1] * Math.cos(roll) + side[1] * Math.sin(roll),
      w[2] * Math.cos(roll) + side[2] * Math.sin(roll),
    ]);
    const v = normalize(cross(w, dir));
    leaves.push({ c, u: dir, w, v, len, wid });
  }
  return leaves;
})();

/* ---------------------------------------------------------------------- */
/* camera                                                                  */
/* ---------------------------------------------------------------------- */

/** An orthographic camera at the front corner, 45° round and 32° down. */
const PITCH = 32 * DEG;
const YAW = 45 * DEG;
/** Toward the camera (view rays travel along -BACK). */
export const BACK: ReadVec3 = [Math.cos(PITCH) * Math.sin(YAW), Math.sin(PITCH), Math.cos(PITCH) * Math.cos(YAW)];
export const RIGHT: ReadVec3 = normalize([BACK[2], 0, -BACK[0]]);
export const UP: ReadVec3 = cross(BACK, RIGHT);
/** The world point the view is centred on (screen offsets are measured from here). */
export const TARGET: ReadVec3 = [(ROOM.W - ROOM.T) / 2, 1.05, (ROOM.D - ROOM.T) / 2];

const dot = (a: ReadVec3, b: ReadVec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Screen offset of a world point from TARGET, in world units (x right, y up). */
export function screenOf(p: ReadVec3, out: { x: number; y: number }) {
  const d: Vec3 = [p[0] - TARGET[0], p[1] - TARGET[1], p[2] - TARGET[2]];
  out.x = dot(d, RIGHT);
  out.y = dot(d, UP);
  return out;
}

/** The model's outline points (slab, wall tops), for fitting it into the stage. */
const OUTLINE: readonly ReadVec3[] = (() => {
  const { W, D, H, T, slab } = ROOM;
  const xs = [-T, W];
  const zs = [-T, D];
  const pts: ReadVec3[] = [];
  for (const x of xs) for (const z of zs) pts.push([x, -slab, z]);
  // the walls only stand along the back: their tops
  pts.push([-T, H, -T], [-T, H, D], [W, H, -T], [0, H, D], [W, H, 0]);
  return pts;
})();

/* ---------------------------------------------------------------------- */
/* the sun                                                                 */
/* ---------------------------------------------------------------------- */

const LATITUDE = 34 * DEG;
const DECLINATION = 10 * DEG;
/** Clock time of solar noon. */
const SOLAR_NOON = 13.25;
/** Compass bearing the window looks out to (west-south-west). */
const FACING = 225 * DEG;

/** The hours the stage's sun can be dragged across. */
export const HOUR_MIN = 6;
export const HOUR_MAX = 23.5;
export const SUNRISE = 6.85;
export const SUNSET = 19.72;

export type Sun = {
  /** Unit vector toward the sun (world). */
  dir: Vec3;
  /** Elevation in degrees. */
  elevation: number;
  /** Bearing in degrees from north. */
  bearing: number;
};

export function newSun(): Sun {
  return { dir: [0, 1, 0], elevation: 0, bearing: 0 };
}

/** Where the sun is at a clock hour (any real number; wraps by the day). */
export function sunAt(hour: number, out: Sun): Sun {
  const H = (hour - SOLAR_NOON) * 15 * DEG;
  const sinEl =
    Math.sin(LATITUDE) * Math.sin(DECLINATION) + Math.cos(LATITUDE) * Math.cos(DECLINATION) * Math.cos(H);
  const el = Math.asin(clamp(sinEl, -1, 1));
  // bearing from south (west positive), then from north
  const fromSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LATITUDE) - Math.tan(DECLINATION) * Math.cos(LATITUDE));
  const bearing = fromSouth + Math.PI;
  const a = bearing - FACING;
  const ce = Math.cos(el);
  out.dir[0] = -Math.cos(a) * ce;
  out.dir[1] = Math.sin(el);
  out.dir[2] = Math.sin(a) * ce;
  out.elevation = el / DEG;
  out.bearing = (((bearing / DEG) % 360) + 360) % 360;
  return out;
}

/** The fixed moon (high in the south-west), only its light is used. */
export const MOON_DIR: ReadVec3 = normalize([-0.62, 0.58, 0.28]);

/* ---------------------------------------------------------------------- */
/* the sun's path on screen                                                */
/* ---------------------------------------------------------------------- */

// The sun's direction seen through the camera sweeps an almost perfect
// circle, 15° an hour: rising at the right, over the top at 13:00, setting
// at the left. Its angle on screen (counter-clockwise from the right) is
// tabulated so a pointer's angle can be turned back into an hour.

const TABLE_FROM = 3.5;
const TABLE_TO = 28.5;
const TABLE_N = 500;
const angleTable = new Float64Array(TABLE_N + 1);
{
  const sun = newSun();
  let previous = 0;
  for (let i = 0; i <= TABLE_N; i++) {
    const hour = TABLE_FROM + ((TABLE_TO - TABLE_FROM) * i) / TABLE_N;
    sunAt(hour, sun);
    let a = Math.atan2(dot(sun.dir, UP), dot(sun.dir, RIGHT));
    if (i > 0) {
      while (a - previous > Math.PI) a -= Math.PI * 2;
      while (a - previous < -Math.PI) a += Math.PI * 2;
    }
    angleTable[i] = a;
    previous = a;
  }
}

/** The sun's angle on screen at an hour (radians, counter-clockwise from the right, unwrapped). */
export function angleAt(hour: number): number {
  const f = ((clamp(hour, TABLE_FROM, TABLE_TO) - TABLE_FROM) / (TABLE_TO - TABLE_FROM)) * TABLE_N;
  const i = Math.min(TABLE_N - 1, Math.floor(f));
  return lerp(angleTable[i], angleTable[i + 1], f - i);
}

/**
 * The hour whose screen angle is nearest to `angle` (radians, any wrap),
 * looking only within [from, to] and preferring the one closest to `near`.
 */
export function hourForAngle(angle: number, near: number, from = HOUR_MIN - 1.5, to = HOUR_MAX + 1.5): number {
  // bring the angle next to the angle at `near`, then search the (monotonic) table
  const ref = angleAt(near);
  let a = angle;
  while (a - ref > Math.PI) a -= Math.PI * 2;
  while (a - ref < -Math.PI) a += Math.PI * 2;
  let lo = 0;
  let hi = TABLE_N;
  // the table rises with the hour
  if (a <= angleTable[0]) return clamp(TABLE_FROM, from, to);
  if (a >= angleTable[TABLE_N]) return clamp(TABLE_TO, from, to);
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (angleTable[mid] < a) lo = mid;
    else hi = mid;
  }
  const k = (a - angleTable[lo]) / Math.max(1e-9, angleTable[hi] - angleTable[lo]);
  const hour = TABLE_FROM + ((TABLE_TO - TABLE_FROM) * (lo + k)) / TABLE_N;
  return clamp(hour, from, to);
}

/* ---------------------------------------------------------------------- */
/* framing                                                                 */
/* ---------------------------------------------------------------------- */

export type Layout = {
  /** CSS px per world unit. */
  scale: number;
  /** CSS px position of TARGET. */
  ox: number;
  oy: number;
  /** The sun's path: an ellipse around (cx, cy) with radii rx, ry (CSS px). */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** The sun disc's radius (CSS px). */
  sunR: number;
};

export function newLayout(): Layout {
  return { scale: 1, ox: 0, oy: 0, cx: 0, cy: 0, rx: 1, ry: 1, sunR: 10 };
}

const tmp = { x: 0, y: 0 };

/**
 * Fits the model and the sun's path into a stage of width × height (CSS
 * px), leaving `bottom` px free for the controls. Stage: the path is as
 * wide as the stage allows, its top (noon) near the top edge and its night
 * end clear of the controls; the model is then as big as fits inside it.
 * Tile: the model fills the tile and the path runs mostly outside it.
 */
export function layoutFor(width: number, height: number, mode: "tile" | "stage", bottom: number, out: Layout): Layout {
  // the model's outline about TARGET, in world units
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of OUTLINE) {
    screenOf(p, tmp);
    minX = Math.min(minX, tmp.x);
    maxX = Math.max(maxX, tmp.x);
    minY = Math.min(minY, tmp.y);
    maxY = Math.max(maxY, tmp.y);
  }
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  if (mode === "tile") {
    const scale = Math.min((width * 0.9) / (maxX - minX), (height * 0.86) / (maxY - minY));
    out.scale = scale;
    out.ox = width / 2 - midX * scale;
    out.oy = height * 0.53 + midY * scale;
    out.sunR = Math.max(6, Math.min(width, height) * 0.04);
    out.cx = width / 2;
    out.cy = height * 0.5;
    out.rx = width * 0.47;
    out.ry = height * 0.47;
    return out;
  }

  const narrow = width < 560;
  const sunR = narrow ? 13 : 16;
  out.sunR = sunR;
  const top = sunR + (narrow ? 14 : 22);
  const floor = height - bottom - sunR - 8;
  // the night end of the path sits ~0.8 ry below its centre
  const ry = Math.max(40, (floor - top) / 1.8);
  const cy = top + ry;
  const rx = Math.max(40, Math.min(width / 2 - sunR - (narrow ? 14 : 26), ry * 2.25));
  out.cx = width / 2;
  out.cy = cy;
  out.rx = rx;
  out.ry = ry;

  // the model: as tall as the space above the controls allows, never so
  // wide that the sun's path at the horizon would cross it (the noon sun
  // may pass behind the back corner, as the real one would)
  const margin = sunR + (narrow ? 8 : 18);
  const fitTall = (floor + sunR - (narrow ? 10 : 16) - top + sunR) / (maxY - minY);
  const fitWide = (2 * (rx - margin)) / (maxX - minX);
  const scale = Math.min(fitTall, fitWide, (width - 24) / (maxX - minX));
  out.scale = scale;
  out.ox = out.cx - midX * scale;
  out.oy = cy - (narrow ? 0 : 6) + midY * scale;
  return out;
}

/** CSS px position of the sun on its path at an hour. */
export function sunScreen(hour: number, layout: Layout, out: { x: number; y: number }) {
  const a = angleAt(hour);
  out.x = layout.cx + Math.cos(a) * layout.rx;
  out.y = layout.cy - Math.sin(a) * layout.ry;
  return out;
}

/** The pointer's angle about the path's centre, in the path's own (elliptic) terms. */
export function pathAngle(x: number, y: number, layout: Layout): number {
  return Math.atan2(-(y - layout.cy) / layout.ry, (x - layout.cx) / layout.rx);
}

/** CSS px position of a world point under a layout. */
export function project(p: ReadVec3, layout: Layout, out: { x: number; y: number }) {
  screenOf(p, out);
  out.x = layout.ox + out.x * layout.scale;
  out.y = layout.oy - out.y * layout.scale;
  return out;
}

/* ---------------------------------------------------------------------- */
/* picking (the lamp and the screen can be switched by hand)               */
/* ---------------------------------------------------------------------- */

export type Pickable = "lamp" | "screen";

type Box = { lo: ReadVec3; hi: ReadVec3 };
const PICK_BOXES: Record<Pickable, Box> = {
  lamp: { lo: [3.0, DESK_Y, 0.06], hi: [3.48, 1.38, 0.6] },
  screen: { lo: [2.38, 0.96, 0.16], hi: [3.06, 1.38, 0.22] },
};

const corner = { x: 0, y: 0 };
/** What's under a CSS px point, by the screen rectangles of small boxes round the lamp and the monitor. */
export function pick(x: number, y: number, layout: Layout): Pickable | null {
  for (const key of ["screen", "lamp"] as const) {
    const { lo, hi } = PICK_BOXES[key];
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p: ReadVec3 = [i & 1 ? hi[0] : lo[0], i & 2 ? hi[1] : lo[1], i & 4 ? hi[2] : lo[2]];
      project(p, layout, corner);
      x0 = Math.min(x0, corner.x);
      x1 = Math.max(x1, corner.x);
      y0 = Math.min(y0, corner.y);
      y1 = Math.max(y1, corner.y);
    }
    const pad = key === "lamp" ? 2 : 0;
    if (x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad) return key;
  }
  return null;
}

/* ---------------------------------------------------------------------- */
/* light                                                                   */
/* ---------------------------------------------------------------------- */

/** Everything the lighting pass needs that changes with the hour (linear RGB). */
export type Light = {
  sun: Sun;
  /** Direction and irradiance of the light coming through the window (the sun, or the moon at night). */
  winDir: Vec3;
  winCol: Vec3;
  /** 0..1 how much of winCol is the sun (for the shafts and the dust). */
  sunShare: number;
  /** Sky through the window: zenith and horizon radiance. */
  skyTop: Vec3;
  skyLow: Vec3;
  /** Light bounced round the room. */
  ambient: Vec3;
  /** The bright patch as a soft light: position and colour. */
  bounceAt: Vec3;
  bounceCol: Vec3;
  /** 0..1: daylight left (0 deep night). */
  day: number;
  /** 0..1: night (stars, the moon). */
  night: number;
  /** Exposure before the tone curve. */
  exposure: number;
  /** The disc on the path: its colour (sRGB 0..1) and how much of it is sun (1) or moon (0). */
  disc: Vec3;
  discSun: number;
};

export function newLight(): Light {
  return {
    sun: newSun(),
    winDir: [0, 1, 0],
    winCol: [0, 0, 0],
    sunShare: 1,
    skyTop: [0, 0, 0],
    skyLow: [0, 0, 0],
    ambient: [0, 0, 0],
    bounceAt: [1, 0, 1],
    bounceCol: [0, 0, 0],
    day: 1,
    night: 0,
    exposure: 1,
    disc: [1, 1, 1],
    discSun: 1,
  };
}

type Key = { el: number; top: ReadVec3; low: ReadVec3; exposure: number };

/** Sky through the window and exposure, by the sun's elevation (degrees). */
const SKY: readonly Key[] = [
  { el: -18, top: [0.006, 0.009, 0.024], low: [0.014, 0.018, 0.038], exposure: 2.7 },
  { el: -11, top: [0.012, 0.02, 0.06], low: [0.04, 0.045, 0.1], exposure: 2.7 },
  { el: -7, top: [0.035, 0.06, 0.17], low: [0.16, 0.13, 0.26], exposure: 2.5 },
  { el: -3.5, top: [0.11, 0.15, 0.34], low: [0.55, 0.3, 0.3], exposure: 1.95 },
  { el: 0, top: [0.26, 0.3, 0.52], low: [1.0, 0.46, 0.24], exposure: 1.55 },
  { el: 5, top: [0.36, 0.46, 0.7], low: [1.0, 0.68, 0.42], exposure: 1.3 },
  { el: 14, top: [0.36, 0.55, 0.86], low: [0.86, 0.82, 0.74], exposure: 1.15 },
  { el: 35, top: [0.3, 0.52, 0.9], low: [0.74, 0.82, 0.92], exposure: 1.05 },
];

function skyAt(el: number, top: Vec3, low: Vec3): number {
  if (el <= SKY[0].el) {
    for (let c = 0; c < 3; c++) {
      top[c] = SKY[0].top[c];
      low[c] = SKY[0].low[c];
    }
    return SKY[0].exposure;
  }
  for (let i = 1; i < SKY.length; i++) {
    const b = SKY[i];
    if (el <= b.el) {
      const a = SKY[i - 1];
      const k = smoothstep(0, 1, (el - a.el) / (b.el - a.el));
      for (let c = 0; c < 3; c++) {
        top[c] = lerp(a.top[c], b.top[c], k);
        low[c] = lerp(a.low[c], b.low[c], k);
      }
      return lerp(a.exposure, b.exposure, k);
    }
  }
  const last = SKY[SKY.length - 1];
  for (let c = 0; c < 3; c++) {
    top[c] = last.top[c];
    low[c] = last.low[c];
  }
  return last.exposure;
}

/** Air mass toward a sun `el` degrees up (Kasten and Young). */
function airMass(el: number) {
  const e = Math.max(-1, el);
  return 1 / (Math.sin(Math.max(0, e) * DEG) + 0.50572 * Math.pow(Math.max(0.5, e + 6.07995), -1.6364));
}

/** How the air reddens the sun with air mass (per channel extinction). */
const EXTINCTION: ReadVec3 = [0.04, 0.11, 0.28];
const SUN_POWER = 2.7;
const MOON_COLOUR: ReadVec3 = [0.46, 0.6, 1.0];
const MOON_POWER = 0.1;
const WOOD: ReadVec3 = [0.62, 0.46, 0.32];
const PLASTER: ReadVec3 = [0.86, 0.85, 0.83];

/**
 * The light at an hour. `lamp` (0..1) is how far the desk lamp is on:
 * it lifts the room a little and lets the exposure come down.
 */
export function lightAt(hour: number, lamp: number, screen: number, out: Light): Light {
  const sun = sunAt(hour, out.sun);
  const el = sun.elevation;
  const exposure = skyAt(el, out.skyTop, out.skyLow);

  // the sun's irradiance: reddened by the air, fading as the disc sets
  const m = airMass(el);
  const fade = smoothstep(-0.9, 1.2, el);
  const sunR = SUN_POWER * Math.exp(-EXTINCTION[0] * m) * fade;
  const sunG = SUN_POWER * Math.exp(-EXTINCTION[1] * m) * fade;
  const sunB = SUN_POWER * Math.exp(-EXTINCTION[2] * m) * fade;

  // the moon takes over through the window once it's dark
  const night = smoothstep(-4, -12, el);
  const moon = MOON_POWER * night;
  const sunLevel = (sunR + sunG + sunB) / 3;
  if (sunLevel >= moon) {
    out.winDir[0] = sun.dir[0];
    out.winDir[1] = sun.dir[1];
    out.winDir[2] = sun.dir[2];
    out.winCol[0] = sunR;
    out.winCol[1] = sunG;
    out.winCol[2] = sunB;
    out.sunShare = 1;
  } else {
    out.winDir[0] = MOON_DIR[0];
    out.winDir[1] = MOON_DIR[1];
    out.winDir[2] = MOON_DIR[2];
    out.winCol[0] = MOON_COLOUR[0] * moon;
    out.winCol[1] = MOON_COLOUR[1] * moon;
    out.winCol[2] = MOON_COLOUR[2] * moon;
    out.sunShare = 0;
  }
  out.night = night;
  out.day = smoothstep(-10, 6, el);

  // the patch of light on the room: follow the window's centre along the
  // light to the floor or the desk wall; it bounces some of itself back
  const L = out.winDir;
  const flux = L[0] < -1e-3 ? -L[0] * WINDOW_AREA : 0;
  let s = Infinity;
  let albedo: ReadVec3 = WOOD;
  if (L[1] > 1e-3) {
    s = WINDOW_CENTRE[1] / L[1];
  }
  if (L[2] > 1e-3) {
    const toWall = WINDOW_CENTRE[2] / L[2];
    if (toWall < s) {
      s = toWall;
      albedo = PLASTER;
    }
  }
  if (!Number.isFinite(s)) s = 2;
  s = Math.min(s, 4.5);
  out.bounceAt[0] = clamp(WINDOW_CENTRE[0] - L[0] * s, 0.1, ROOM.W - 0.1);
  out.bounceAt[1] = clamp(WINDOW_CENTRE[1] - L[1] * s, 0.05, ROOM.H - 0.1);
  out.bounceAt[2] = clamp(WINDOW_CENTRE[2] - L[2] * s, 0.05, ROOM.D - 0.1);
  const bounce = 0.1 * flux;
  out.bounceCol[0] = out.winCol[0] * albedo[0] * bounce;
  out.bounceCol[1] = out.winCol[1] * albedo[1] * bounce;
  out.bounceCol[2] = out.winCol[2] * albedo[2] * bounce;

  // light that has gone round the room a few times: the sky's, and the lamp's
  const skyMean0 = (out.skyTop[0] + out.skyLow[0]) * 0.5;
  const skyMean1 = (out.skyTop[1] + out.skyLow[1]) * 0.5;
  const skyMean2 = (out.skyTop[2] + out.skyLow[2]) * 0.5;
  out.ambient[0] = skyMean0 * 0.12 + 0.012 * lamp + 0.004 * screen;
  out.ambient[1] = skyMean1 * 0.12 + 0.008 * lamp + 0.005 * screen;
  out.ambient[2] = skyMean2 * 0.12 + 0.005 * lamp + 0.008 * screen;

  // with the lamp on, the eye adapts to it a little
  out.exposure = exposure * lerp(1, 0.82, lamp * night);

  // the disc: white-gold by day, deepening to red as it sets, then the moon
  const warm = smoothstep(20, 0, el);
  out.disc[0] = 1;
  out.disc[1] = lerp(0.8, 0.52, warm);
  out.disc[2] = lerp(0.44, 0.26, warm);
  out.discSun = smoothstep(-2.5, 0.5, el);
  return out;
}

/* ---------------------------------------------------------------------- */
/* words                                                                   */
/* ---------------------------------------------------------------------- */

/** "18:40" for an hour (wrapped to the day). */
export function clockText(hour: number): string {
  const total = Math.round((((hour % 24) + 24) % 24) * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** What the light is doing at an hour ("Golden hour", "Blue hour", …). */
export function phaseAt(hour: number, elevation: number): string {
  const h = ((hour % 24) + 24) % 24;
  const evening = h >= SOLAR_NOON;
  if (elevation < -12) return "Night";
  if (elevation < -5) return evening ? "Blue hour" : "Before dawn";
  if (elevation < -0.6) return evening ? "Dusk" : "Dawn";
  if (elevation < 3) return evening ? "Sunset" : "Sunrise";
  if (elevation < 12) return "Golden hour";
  if (h < 11) return "Morning";
  if (h < 14.5) return "Midday";
  return "Afternoon";
}
