// Palettes, the picture's geometry constants (shared with the shaders) and
// the names of the times of day. Nothing here touches the DOM.

/* ---------------------------------------------------------------------- */
/* the picture                                                             */
/* ---------------------------------------------------------------------- */

/** Where the sea meets the sky, as a share of the picture's height from the bottom. */
export const HORIZON = 0.36;
/** The camera's focal length in picture heights (the sun's height is tan(elevation) × FOCAL). */
export const FOCAL = 1;

/** The scene clock of the reduced-motion still (the gulls are placed for it). */
export const STILL_TIME = 31.4;

/** The sun's lowest and highest elevation (degrees) the pointer can reach. */
export const ELEV_MIN = -13;
export const ELEV_MAX = 27;

/** Elevation (degrees) for a height across the picture (0 bottom … 1 top). */
export function elevationAt(v: number): number {
  return (Math.atan((v - HORIZON) / FOCAL) * 180) / Math.PI;
}

/** Height across the picture (0 bottom … 1 top) where the sun sits at this elevation. */
export function heightOf(elevation: number): number {
  return HORIZON + Math.tan((elevation * Math.PI) / 180) * FOCAL;
}

/* ---------------------------------------------------------------------- */
/* palettes                                                                */
/* ---------------------------------------------------------------------- */

export type PaletteId = "ink" | "sunset" | "tide" | "mono";

/** A tone curve applied before the dither: black point, white point, gamma, S-shape (0..1). */
export type Levels = readonly [number, number, number, number];

export type Palette = {
  id: PaletteId;
  label: string;
  /** Darkest to lightest; the dither steps between neighbours. */
  colors: readonly string[];
  /**
   * With several inks the dither steps between neighbours and the scene's
   * tones stay as they are. One ink on paper needs its own curve: the sky's
   * mid tones would otherwise all land on an even 50% checkerboard.
   */
  levels: Levels;
};

const AS_IS: Levels = [0, 1, 1, 0];

export const PALETTES: readonly Palette[] = [
  // one ink on warm paper, like a risograph pass
  // (the sky leans toward the ink; paper is kept for the light)
  { id: "ink", label: "Ink", colors: ["#1d2747", "#efe7d6"], levels: [0.1, 0.97, 1.6, 0] },
  // aubergine, garnet, tangerine, apricot
  { id: "sunset", label: "Sunset", colors: ["#26122d", "#8a2a4c", "#e8663a", "#ffd590"], levels: AS_IS },
  // deep water, teal, sea foam
  { id: "tide", label: "Tide", colors: ["#0c2433", "#2d7686", "#d6ece2"], levels: AS_IS },
  // one bit, a little harder than the ink
  { id: "mono", label: "Mono", colors: ["#121212", "#f2f1ee"], levels: [0.14, 0.97, 1.8, 0] },
];

export function paletteById(id: PaletteId): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** The swatch: two colours split on the diagonal, or bands from sky to sea. */
export function swatchFor(p: Palette): string {
  const c = p.colors;
  if (c.length <= 2) return `linear-gradient(135deg, ${c[c.length - 1]} 0 50%, ${c[0]} 50% 100%)`;
  const bands = [...c].reverse();
  const step = 100 / bands.length;
  return `linear-gradient(180deg, ${bands.map((color, i) => `${color} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
}

/** "#rrggbb" → [r, g, b] in 0..1 (sRGB, as the canvas shows it). */
export function rgb01(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

/* ---------------------------------------------------------------------- */
/* time of day                                                             */
/* ---------------------------------------------------------------------- */

/** A name for the light at this sun elevation (degrees). */
export function phaseFor(elevation: number): string {
  if (elevation >= 9) return "Afternoon";
  if (elevation >= 0.8) return "Golden hour";
  if (elevation >= -0.8) return "Sunset";
  if (elevation >= -4.5) return "Dusk";
  if (elevation >= -8) return "Blue hour";
  return "Nightfall";
}

/** "4°", "−3°" (a real minus sign). */
export function formatElevation(elevation: number): string {
  const n = Math.round(elevation);
  return `${n < 0 ? "−" : ""}${Math.abs(n)}°`;
}
