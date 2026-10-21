// Colours for the room the bar sits in, read from the site's own palette
// (light, Red Dragon or AMOLED: app/globals.css), and what each liquid is
// called.
//
// - floor: the channel, a groove cut into the stage. By day a shade under
//   the tile; at night a shade over the darkest surface, so the cut reads.
// - label: the site's secondary text, printed on the channel floor.
// - ink: the site's ink, so the default liquid is the palette's own:
//   glossy black by day, cherry red in Red Dragon, white enamel on AMOLED.
// - onInk: the label where the liquid covers it (the palette's on-ink).
// - fg: the main text colour (labels seen through water, warm light).
// - lip: the light caught by the groove's lower edge.

import { rgb } from "../../gl";
import type { MaterialId } from "./engine";
import type { Vec3 } from "./renderer";

export const MATERIALS: ReadonlyArray<{ value: MaterialId; label: string }> = [
  { value: "ink", label: "Ink" },
  { value: "mercury", label: "Mercury" },
  { value: "water", label: "Water" },
];

export const MATERIAL_INDEX: Record<MaterialId, number> = { ink: 0, mercury: 1, water: 2 };

/** How visible the wet film is per liquid (mercury never wets). */
export const WET_K: Record<MaterialId, number> = { ink: 0.8, mercury: 0, water: 0.75 };

export type Room = { floor: Vec3; label: Vec3; fg: Vec3; ink: Vec3; onInk: Vec3; lip: Vec3; dark: number };

export const newRoom = (): Room => ({ floor: [0, 0, 0], label: [0, 0, 0], fg: [0, 0, 0], ink: [0, 0, 0], onInk: [0, 0, 0], lip: [0, 0, 0], dark: 0 });

const LIGHT: Room = {
  floor: rgb("#e7e7e7"),
  label: rgb("#626262"),
  fg: rgb("#171717"),
  ink: rgb("#151515"),
  onInk: rgb("#fbfbfb"),
  lip: [1, 1, 1],
  dark: 0,
};

const lum = (c: Vec3) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/**
 * The room for the palette on <html> right now (from its CSS variables),
 * written into `out`. Falls back to the light room if they can't be read.
 */
export function readRoom(out: Room, dark: boolean): Room {
  copyRoom(out, LIGHT);
  let style: CSSStyleDeclaration;
  try {
    style = getComputedStyle(document.documentElement);
  } catch {
    return out;
  }
  const v = (name: string) => style.getPropertyValue(name).trim();
  const tile = v("--tile");
  if (!tile) return out;
  const pick = (s: string, f: Vec3): Vec3 => (s ? rgb(s) : f);
  const t = rgb(tile);
  const bg = pick(v("--background"), t);
  const fg = pick(v("--foreground"), LIGHT.fg);
  let ink = pick(v("--ink"), LIGHT.ink);
  const room: Room = { ...LIGHT, fg, ink, onInk: pick(v("--on-ink"), LIGHT.onInk), dark: dark ? 1 : 0 };
  if (!dark) {
    // a shade under the tile, and the label a touch darker than the
    // site's secondary grey so it still reads on the deeper floor
    room.floor = [t[0] * 0.955, t[1] * 0.955, t[2] * 0.955];
    const label = pick(v("--secondary"), LIGHT.label);
    room.label = [label[0] * 0.92, label[1] * 0.92, label[2] * 0.92];
    // a black ink, slightly lifted so the studio light can model it
    if (lum(ink) < 0.03) ink = [0.082, 0.082, 0.082];
    room.ink = ink;
    room.lip = [1, 1, 1];
  } else {
    // just over the darkest surface, so the cut shows as a well
    const base = lum(t) >= lum(bg) ? t : bg;
    room.floor = [Math.min(1, base[0] + 0.022), Math.min(1, base[1] + 0.02), Math.min(1, base[2] + 0.02)];
    room.label = pick(v("--secondary"), [0.6, 0.6, 0.6]);
    room.lip = [fg[0] * 0.5, fg[1] * 0.5, fg[2] * 0.5];
  }
  copyRoom(out, room);
  return out;
}

const KEYS = ["floor", "label", "fg", "ink", "onInk", "lip"] as const;

/** `out` = `a`, written in place (the renderer's frame keeps references to `out`'s arrays). */
export function copyRoom(out: Room, a: Room) {
  for (const k of KEYS) {
    const o = out[k];
    const x = a[k];
    o[0] = x[0];
    o[1] = x[1];
    o[2] = x[2];
  }
  out.dark = a.dark;
}

export const css = (c: Vec3, a = 1) => `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)} / ${a})`;
