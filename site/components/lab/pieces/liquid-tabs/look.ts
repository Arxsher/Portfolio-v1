// Colours for the two rooms and what each liquid is called. The channel is
// a groove in the stage's own tile colour, a shade darker; labels are the
// site's secondary text; ink is the site's ink (black by day, white enamel
// at night) with the opposite tone for the label under it.

import type { MaterialId } from "./engine";
import type { Vec3 } from "./renderer";

export const MATERIALS: ReadonlyArray<{ value: MaterialId; label: string }> = [
  { value: "ink", label: "Ink" },
  { value: "mercury", label: "Mercury" },
  { value: "water", label: "Water" },
];

export const MATERIAL_INDEX: Record<MaterialId, number> = { ink: 0, mercury: 1, water: 2 };

/** How visible the wet film is per liquid (mercury never wets). */
export const WET_K: Record<MaterialId, number> = { ink: 0.95, mercury: 0, water: 0.8 };

export type Room = { floor: Vec3; label: Vec3; fg: Vec3; onInk: Vec3 };

const hex = (h: string): Vec3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

export const LIGHT: Room = { floor: hex("#e6e6e6"), label: hex("#6e6e6e"), fg: hex("#171717"), onInk: hex("#fbfbfb") };
export const DARK: Room = { floor: hex("#1a1a1a"), label: hex("#9a9a9a"), fg: hex("#f2f2f2"), onInk: hex("#1a1a1a") };

/** Room at `t` (0 day … 1 night) written into `out`. */
export function mixRoom(out: Room, t: number) {
  const keys = ["floor", "label", "fg", "onInk"] as const;
  for (const k of keys) {
    const a = LIGHT[k];
    const b = DARK[k];
    const o = out[k];
    o[0] = a[0] + (b[0] - a[0]) * t;
    o[1] = a[1] + (b[1] - a[1]) * t;
    o[2] = a[2] + (b[2] - a[2]) * t;
  }
}

export const newRoom = (): Room => ({ floor: [0, 0, 0], label: [0, 0, 0], fg: [0, 0, 0], onInk: [0, 0, 0] });

export const css = (c: Vec3, a = 1) => `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)} / ${a})`;
