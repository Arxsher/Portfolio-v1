// Shared types for the lab: every piece exports a `meta` (pieces/<slug>/meta.ts)
// and a default `Piece` component (pieces/<slug>/piece.tsx) that takes
// `PieceProps`. See registry.ts for the ordered list and load-piece.tsx for
// how the components are loaded.

/**
 * What kind of piece it is (the filters on /lab/ and the "Category" row):
 * - interactions: small UI moments (a switch, a tab bar, a slider, a seal)
 * - objects: things you handle (a macropad, a turntable, cards)
 * - data: real data drawn as something (GitHub contributions)
 * - scenes: places with light and time of day
 */
export type Category = "interactions" | "objects" | "data" | "scenes";

/** Where a piece is mounted: a small self-running tile, or the full stage. */
export type PieceMode = "tile" | "stage";

export type PieceTheme = "light" | "dark";

export type PieceProps = {
  /**
   * "tile": the home / index preview, about 204px wide on desktop and 170px
   * on phones. Self-running, low DPR, no audio, no focusable controls (the
   * whole tile is a link); a cheap hover reaction is fine.
   * "stage": the full interactive piece on /lab/<slug>/. Fills its container
   * (render `position: absolute; inset: 0` inside it) and draws its own
   * floating controls with the kit in components/lab/ui.tsx. To tell when
   * the stage is full screen, see the contract at the top of piece-page.tsx.
   */
  mode: PieceMode;
  /** False while offscreen or the tab is hidden: stop every rAF loop and sound. */
  active: boolean;
  /** prefers-reduced-motion: show a considered still frame, no ambient motion. */
  reducedMotion: boolean;
  /** The site theme, live (follows html.dark). */
  theme: PieceTheme;
};

export type PieceMeta = {
  slug: string;
  title: string;
  /** One sentence: tile chip, command palette, meta description. */
  summary: string;
  /** Two or three sentences shown under the title on the piece page. */
  description: string;
  /** How it is made: one paragraph, or several. */
  about: string | readonly string[];
  /** Tech chips ("Canvas 2D", "Web Audio" …). The first ones lead "Built with". */
  uses: readonly string[];
  category: Category;
  /** The craft or object it draws from, e.g. "Solari split-flap boards". */
  inspiredBy?: string;
  /** Home / index tile shape: width / height (at the 204px desktop tile). */
  tile: { aspect: number };
  /**
   * The stage is 575px tall from the md breakpoint up. On phones it is
   * sized by `aspect` (width / height, default 4/5) and never shorter than
   * `minHeight` (default 360px).
   */
  stage?: { aspect?: number; minHeight?: number };
  /** Short plain-language controls line ("Drag to turn · 1–9 to press"). */
  controlsHint?: string;
  /** Makes sound in stage mode (shows the mute control hint on the page). */
  sound?: boolean;
};

/** Filter order on /lab/ follows this object's key order. */
export const CATEGORY_LABELS: Record<Category, string> = {
  interactions: "Interactions",
  objects: "Objects",
  data: "Data",
  scenes: "Scenes",
};

/** Singular label for one piece ("Interaction", "Object", "Data", "Scene"). */
export const CATEGORY_SINGULAR: Record<Category, string> = {
  interactions: "Interaction",
  objects: "Object",
  data: "Data",
  scenes: "Scene",
};
