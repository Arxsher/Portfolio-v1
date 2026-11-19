// Materials and light for the deck, per theme, and the record pressings.
// Colours are linear (the shader works in linear light and converts to
// sRGB at the end).
//
// Day: a pearl lacquered plinth under a soft studio key from the upper
// left and a big softbox overhead, so the machined aluminium reads as
// metal from what it reflects. Night: a graphite plinth, the same key
// dimmed and warmer, a cool rim on the far edges to keep the slab off the
// dark tile, and the lamp and LEDs doing more of the work.

export type Vec3 = [number, number, number];

const lin = (hex: string): Vec3 => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Vec3;
};

export type Look = {
  /** Key light position in deck millimetres (x right, y down, z up). */
  light: Vec3;
  key: Vec3;
  ambTop: Vec3;
  ambLow: Vec3;
  envHigh: Vec3;
  envLow: Vec3;
  box: Vec3;
  ground: number;
  plinth: Vec3;
  ink: Vec3;
  metal: Vec3;
  dark: Vec3;
  glow: Vec3;
  /** The cartridge body (black anodised) and its stylus guard (the accent). */
  cart: Vec3;
  guard: Vec3;
  exposure: number;
  rim: number;
  /** How bright the sheen is on this theme (multiplies the pressing's). */
  sheen: number;
  /**
   * How the strobe shows the dots the lamp freezes: 0 lights them up (a dim
   * room, where the lamp is most of the light), 1 shades them by contrast,
   * lit orange and darker than the bright rim (a bright room, where added
   * glow would wash out against the polished metal).
   */
  strobe: number;
  /** Start / stop cap tone (multiplies the metal). */
  cap: number;
};

export const LOOKS: Record<"light" | "dark", Look> = {
  light: {
    light: [-160, -260, 1500],
    key: [0.86, 0.85, 0.83],
    ambTop: [0.4, 0.405, 0.42],
    ambLow: [0.2, 0.2, 0.21],
    envHigh: [0.3, 0.305, 0.32],
    envLow: [0.09, 0.09, 0.095],
    box: [2.3, 2.3, 2.25],
    ground: 0.62,
    plinth: lin("#dedbd5"),
    ink: lin("#4a4845"),
    metal: [0.8, 0.805, 0.81],
    dark: [0.03, 0.03, 0.034],
    glow: [1.0, 0.22, 0.05],
    cart: [0.016, 0.016, 0.019],
    guard: lin("#cf4a2c"),
    exposure: 1,
    rim: 0,
    sheen: 1,
    strobe: 1,
    cap: 1,
  },
  dark: {
    light: [-160, -260, 1500],
    key: [0.62, 0.6, 0.57],
    ambTop: [0.075, 0.078, 0.088],
    ambLow: [0.03, 0.031, 0.036],
    // the room is dim, so the machined metal reads satin, not chrome
    envHigh: [0.072, 0.075, 0.084],
    envLow: [0.012, 0.012, 0.015],
    box: [1.12, 1.13, 1.17],
    ground: 0.75,
    plinth: lin("#2c2c2f"),
    ink: lin("#c2c0bb"),
    metal: [0.56, 0.57, 0.585],
    dark: [0.022, 0.022, 0.026],
    glow: [1.0, 0.24, 0.06],
    cart: [0.014, 0.014, 0.017],
    guard: lin("#c4442a"),
    exposure: 1,
    rim: 0.12,
    sheen: 0.85,
    strobe: 0,
    // a darker cap, like the 33 / 45 buttons beside it
    cap: 0.7,
  },
};

export type LabelStyle = {
  /** Paper colour (sRGB, for Canvas 2D). */
  paper: string;
  /** Print colour. */
  ink: string;
  /** The single accent: the ring and the side letter. */
  accent: string;
};

export type Pressing = {
  id: PressingId;
  label: string;
  /** Tray swatch (CSS background). */
  swatch: string;
  vinyl: Vec3;
  sheen: Vec3;
  /** How much light a coloured pressing lets through and back out. */
  trans: number;
  paper: LabelStyle;
};

export type PressingId = "black" | "smoke" | "oxblood" | "marine";

export const PRESSINGS: readonly Pressing[] = [
  {
    id: "black",
    label: "Black vinyl",
    swatch: "radial-gradient(circle at 50% 50%, #e8e2d4 0 22%, #161616 23% 100%)",
    vinyl: [0.0075, 0.0075, 0.0082],
    sheen: [0.3, 0.3, 0.31],
    trans: 0,
    paper: { paper: "#ece6d8", ink: "#1b1a18", accent: "#d2462a" },
  },
  {
    id: "smoke",
    label: "Smoke",
    swatch: "radial-gradient(circle at 50% 50%, #1d1d1d 0 22%, #6d6a66 23% 100%)",
    vinyl: lin("#2e2c2a"),
    sheen: [0.28, 0.28, 0.29],
    trans: 0.55,
    paper: { paper: "#1e1d1c", ink: "#ece8df", accent: "#e8b04a" },
  },
  {
    id: "oxblood",
    label: "Oxblood",
    swatch: "radial-gradient(circle at 50% 50%, #efe9dd 0 22%, #6e1a1d 23% 100%)",
    vinyl: lin("#43090e"),
    sheen: [0.3, 0.28, 0.28],
    trans: 0.6,
    paper: { paper: "#efe9dd", ink: "#2a1214", accent: "#6e1a1d" },
  },
  {
    id: "marine",
    label: "Marine",
    swatch: "radial-gradient(circle at 50% 50%, #f1ede4 0 22%, #173a66 23% 100%)",
    vinyl: lin("#0b2650"),
    sheen: [0.28, 0.29, 0.31],
    trans: 0.6,
    paper: { paper: "#f1ede4", ink: "#0f2340", accent: "#2b62b0" },
  },
];

export const pressingById = (id: PressingId) => PRESSINGS.find((p) => p.id === id) ?? PRESSINGS[0];
