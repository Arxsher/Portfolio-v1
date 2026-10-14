// Geometry for the site's ornament, drawn in code (no assets):
//
//   starPoints(cx, cy, r)       the eight-pointed star (khatam): two squares
//                               laid over each other, as polygon points
//   crossPoints(x, y, pitch)    the cross-shaped tile cut from the gap
//                               between four stars
//   friezeTiles(cols, rows, p)  a star-and-cross zellige frieze, tile by tile
//   archPath(offset)            the pointed horseshoe arch (100 x 125 box)
//   ARCH_MASK                   that arch as a CSS mask image value
//   hash01(a, b)                stable 0..1 noise for colour rhythm
//
// Pure functions, safe on the server. Components that use them live in
// components/ornament.tsx and components/zellige-band.tsx.

/** Inner radius of a two-square star, as a share of its outer radius. */
export const STAR_INNER = 0.7654;

/** Polygon points of an eight-pointed star centred on (cx, cy), one point straight up. */
export function starPoints(cx: number, cy: number, radius: number, inner = STAR_INNER, rotation = 0): string {
  const points: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? radius : radius * inner;
    const angle = rotation + (i * Math.PI) / 8 - Math.PI / 2;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(" ");
}

/** Cross between four stars, for the lattice cell whose top-left star sits at (x, y). */
export function crossPoints(x: number, y: number, pitch: number): string {
  const p = pitch;
  const h = p / (2 * Math.SQRT2);
  const k = h * (Math.SQRT2 - 1);
  const pts: Array<[number, number]> = [
    [p / 2, 0], [p - h, k], [p - h, h], [p - k, h],
    [p, p / 2], [p - k, p - h], [p - h, p - h], [p - h, p - k],
    [p / 2, p], [h, p - k], [h, p - h], [k, p - h],
    [0, p / 2], [k, h], [h, h], [h, k],
  ];
  return pts.map(([px, py]) => `${(x + px).toFixed(2)},${(y + py).toFixed(2)}`).join(" ");
}

/** Cheap stable hash, 0..1, for tile colour rhythm. */
export function hash01(a: number, b: number): number {
  let h = (Math.imul(a + 7, 374761393) + Math.imul(b + 13, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export type ZelligeTone = "blue" | "deep" | "green" | "ochre" | "terra" | "cream";

export type ZelligeTile = {
  kind: "star" | "cross";
  points: string;
  /** Position in lattice cells (crosses sit on the half). */
  col: number;
  row: number;
  tone: ZelligeTone;
};

/**
 * Tiles for a frieze `cols` lattice cells wide and `rows` tall. Stars sit on
 * every lattice point (the half stars along the edges are cut by the frame);
 * crosses fill the gaps. Mostly cobalt, a slow diagonal run of green and
 * deep blue, the odd ochre; crosses alternate cream and terracotta.
 */
export function friezeTiles(cols: number, rows: number, pitch: number): ZelligeTile[] {
  const tiles: ZelligeTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tone: ZelligeTone = (col + row) % 2 === 0 ? "cream" : "terra";
      tiles.push({ kind: "cross", points: crossPoints(col * pitch, row * pitch, pitch), col: col + 0.5, row: row + 0.5, tone });
    }
  }
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const band = (col + row * 2) % 6;
      const tone: ZelligeTone =
        band === 0 ? "green" : band === 3 ? "deep" : hash01(col, row) > 0.93 ? "ochre" : "blue";
      tiles.push({ kind: "star", points: starPoints(col * pitch, row * pitch, pitch / 2), col, row, tone });
    }
  }
  return tiles;
}

/* ---------------------------------------------------------------------- */
/* the arch                                                                */
/* ---------------------------------------------------------------------- */

// A pointed horseshoe arch in a 100 x 125 box: two arcs from centres either
// side of the middle meet in a point at the top and swell past the jambs
// before coming down, the way Moroccan arches do. The opening spans x 14..86
// at offset 0; `offset` grows it outward for the carved double moulding.
export const ARCH_BOX = { width: 100, height: 125 } as const;
const RADIUS = 44;
const SPREAD = 6;
const CENTRE_Y = 52;
const JAMB = 14;

export function archPath(offset = 0): string {
  const r = RADIUS + offset;
  const jamb = JAMB - offset;
  const cx = ARCH_BOX.width / 2 + SPREAD;
  const jambY = CENTRE_Y + Math.sqrt(r * r - (cx - jamb) ** 2);
  const apexY = CENTRE_Y - Math.sqrt(r * r - SPREAD * SPREAD);
  const f = (n: number) => n.toFixed(2);
  return `M${f(jamb)} ${ARCH_BOX.height}V${f(jambY)}A${r} ${r} 0 0 1 50 ${f(apexY)}A${r} ${r} 0 0 1 ${f(ARCH_BOX.width - jamb)} ${f(jambY)}V${ARCH_BOX.height}`;
}

/**
 * The arch opening as a CSS mask image (the same value as the `--arch-mask`
 * token in globals.css). Apply it to a box with aspect-ratio 100 / 125.
 */
export const ARCH_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ARCH_BOX.width} ${ARCH_BOX.height}" preserveAspectRatio="none"><path d="${archPath(0)}Z" fill="#000"/></svg>`,
)}")`;
