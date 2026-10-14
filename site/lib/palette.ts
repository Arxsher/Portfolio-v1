// The Casablanca palette as plain values, for code that paints (Canvas 2D,
// WebGL, SVG built in script) and cannot read CSS custom properties. The
// same values are the tokens in app/globals.css; keep the two in step.
//
//   import { palette } from "@/lib/palette";
//   const p = palette[theme];          // theme: "light" | "dark"
//   ctx.fillStyle = p.ink;
//
// "light" is sand paper by day, "dark" is indigo-ink night. The footer and
// any `.night` block always use `palette.dark` (with `night.deep` as the
// ground in dark mode).

export type PaletteTheme = "light" | "dark";

export type Palette = {
  /** Page ground (sand by day, indigo night). */
  ground: string;
  /** A shade deeper than the ground: bands, wells, hover fills. */
  band: string;
  /** Raised paper: postcards, sheets, boards. */
  paper: string;
  /** Headings, names, strong text. */
  ink: string;
  /** Running text. */
  body: string;
  /** Labels, metadata, captions (AA on ground, band and paper). */
  muted: string;
  /** Zellige cobalt: links on hover, italic turns, focus ring. */
  cobalt: string;
  /** Terracotta for text (AA). */
  terra: string;
  /** Terracotta for shapes (stars, stamps, highlights). Not for small text. */
  terraFill: string;
  /** Glazed green: availability, "now". */
  green: string;
  /** Ochre for shapes. */
  ochre: string;
  /** Zellige tile glazes. */
  tile: { blue: string; deep: string; green: string; ochre: string; terra: string; cream: string; grout: string };
};

export const palette: Record<PaletteTheme, Palette> = {
  light: {
    ground: "#f3ecdf",
    band: "#ece3d2",
    paper: "#fbf7ef",
    ink: "#1a1d3a",
    body: "#3d3f5a",
    muted: "#625c70",
    cobalt: "#1f45a0",
    terra: "#a0441f",
    terraFill: "#c4643b",
    green: "#1b6a4e",
    ochre: "#c8902e",
    tile: {
      blue: "#1f45a0",
      deep: "#172f72",
      green: "#1b6a4e",
      ochre: "#d39a35",
      terra: "#c4643b",
      cream: "#fbf3e2",
      grout: "#f6efe2",
    },
  },
  dark: {
    ground: "#0e1127",
    band: "#13173a",
    paper: "#181d42",
    ink: "#f2e9d8",
    body: "#cec6b6",
    muted: "#a29cb4",
    cobalt: "#8eacf5",
    terra: "#ec9670",
    terraFill: "#d9784b",
    green: "#5cc79a",
    ochre: "#e6b65a",
    tile: {
      blue: "#3a64c8",
      deep: "#22377e",
      green: "#23805f",
      ochre: "#c99236",
      terra: "#b85a35",
      cream: "#1d2350",
      grout: "#0e1127",
    },
  },
};

/** The always-night surfaces (footer). `deep` is their ground in dark mode. */
export const night = { ground: "#0e1127", deep: "#090b1d" } as const;
