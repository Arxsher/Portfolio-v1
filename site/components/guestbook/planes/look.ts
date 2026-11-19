// Colours for the paper planes. The sky band itself is plain CSS (tokens
// from globals.css); these are the things the canvas paints.
//
// Paper stays paper in every palette: soft tints of white by day; by night
// the same idea a step dimmer so a plane never glares, warmed to parchment
// on Red Dragon and kept neutral on AMOLED. Ink is always dark because it
// sits on paper. Everything that is not paper (focus ring, name tag, the
// dashed outline, trails) is read from the page's own tokens, so it follows
// whatever palette is on screen.

export type RGB = [number, number, number];

export type PlaneLook = {
  /** Paper tints; each plane picks one from its id. */
  papers: RGB[];
  /** How much darker the back of the sheet is (0…1). */
  backShade: number;
  /** Lighting: ambient floor and the share that follows the light. */
  ambient: number;
  diffuse: number;
  /** Soft light bounced onto faces turned away from the light. */
  backLight: number;
  /**
   * Paper never goes grey: shades below `knee` are eased into
   * [floor, knee], so the darkest face keeps ~88% of the paper's colour.
   */
  floor: number;
  knee: number;
  /** How much warmer (less blue) shaded faces get, 0…1. */
  warmth: number;
  /** Fold lines and the cut edge, as alpha of the ink. */
  crease: number;
  edge: number;
  /** Ink on paper (#rrggbb). */
  ink: string;
  inkSoft: string;
  inkMuted: string;
  shadow: string;
  /** The dashed "your plane here" outline in the empty sky. */
  ghost: string;
  /** Name tag that follows a hovered plane. */
  tagFill: string;
  tagText: string;
  tagRing: string;
  /** Focus ring (the site's ring colour). */
  focus: string;
  /** Dotted trail behind each plane. */
  trail: string;
};

const LIGHT_PAPERS: RGB[] = [
  [255, 255, 255],
  [255, 251, 242],
  [253, 243, 240],
  [240, 248, 243],
  [241, 245, 252],
  [246, 242, 252],
  [253, 248, 231],
];

const NEUTRAL_NIGHT_PAPERS: RGB[] = [
  [222, 222, 220],
  [222, 218, 207],
  [221, 210, 207],
  [206, 219, 211],
  [207, 215, 227],
  [215, 210, 226],
  [223, 216, 194],
];

const PARCHMENT_PAPERS: RGB[] = [
  [236, 226, 204],
  [232, 216, 188],
  [238, 230, 214],
  [230, 210, 196],
  [234, 220, 178],
  [224, 214, 198],
  [240, 224, 200],
];

const BASE: PlaneLook = {
  papers: LIGHT_PAPERS,
  backShade: 0.03,
  ambient: 0.82,
  diffuse: 0.2,
  backLight: 0.05,
  floor: 0.885,
  knee: 0.95,
  warmth: 0.35,
  crease: 0.1,
  edge: 0.16,
  ink: "#1d1d1f",
  inkSoft: "#3a3a3c",
  inkMuted: "#86868b",
  shadow: "rgba(30, 32, 40, 0.16)",
  ghost: "rgba(0, 0, 0, 0.3)",
  tagFill: "#ffffff",
  tagText: "#171717",
  tagRing: "rgba(0, 0, 0, 0.08)",
  focus: "#171717",
  trail: "rgba(0, 0, 0, 0.13)",
};

/** Page tokens the canvas needs, resolved to rgb() strings. */
export type PageTokens = { foreground: string; float: string; ring: string; edge: string };

let probe: HTMLSpanElement | null = null;

/** Resolve any CSS colour (var(), color-mix(), #hex …) to what the browser computes. */
function resolveColor(value: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  if (!probe || !probe.isConnected) {
    probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    document.body.appendChild(probe);
  }
  probe.style.color = fallback;
  probe.style.color = value;
  return getComputedStyle(probe).color || fallback;
}

export function readPageTokens(): PageTokens {
  return {
    foreground: resolveColor("var(--foreground)", "#171717"),
    float: resolveColor("var(--float)", "#ffffff"),
    ring: resolveColor("var(--ring, var(--foreground))", "#171717"),
    edge: resolveColor("var(--edge-firm)", "rgba(0,0,0,0.14)"),
  };
}

/** rgb()/rgba() string with a new alpha. */
function withAlpha(color: string, alpha: number): string {
  const parts = color.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return color;
  return `rgb(${parts[0]} ${parts[1]} ${parts[2]} / ${alpha})`;
}

/**
 * The look for the palette on screen ("light", "red-dragon", "amoled", or
 * any other dark one) and the page's tokens.
 */
export function planeLook(palette: string, tokens?: PageTokens): PlaneLook {
  const dark = palette !== "light";
  const look: PlaneLook = { ...BASE };
  if (dark) {
    const warm = palette === "red-dragon";
    look.papers = warm ? PARCHMENT_PAPERS : NEUTRAL_NIGHT_PAPERS;
    look.backShade = 0.04;
    look.ambient = 0.76;
    look.diffuse = 0.22;
    look.backLight = 0.05;
    look.floor = 0.86;
    look.knee = 0.91;
    look.warmth = warm ? 0.2 : 0.3;
    look.crease = 0.12;
    look.edge = 0.2;
    look.ink = warm ? "#24160f" : "#1c1c1e";
    look.inkSoft = warm ? "#3e2c22" : "#38383a";
    look.inkMuted = warm ? "#7d6a58" : "#76767a";
    look.shadow = "rgba(0, 0, 0, 0.62)";
  }
  if (tokens) {
    look.focus = tokens.ring;
    look.tagFill = tokens.float;
    look.tagText = tokens.foreground;
    look.tagRing = tokens.edge;
    look.ghost = withAlpha(tokens.foreground, dark ? 0.42 : 0.3);
    look.trail = withAlpha(tokens.foreground, dark ? 0.2 : 0.13);
  }
  return look;
}

/**
 * Which paper a note is folded from: picked from its words, so the plane
 * you fold is the same colour as the one that later flies in the sky.
 */
export function paperIndexFor(note: { name: string; message: string }, count: number): number {
  const text = `${note.name.trim().replace(/\s+/g, " ")}|${note.message.trim().replace(/\s+/g, " ")}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % Math.max(1, count);
}
