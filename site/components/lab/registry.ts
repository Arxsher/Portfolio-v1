// Every lab piece's meta, in lab order: the /lab/ grid and list, the piece
// pages' previous / next and the command palette all follow `pieces`.
// Newer pieces come first, with the categories mixed so the grid reads
// well. Importing this pulls in the metas only, never the piece code (that
// is load-piece.tsx's job), so server pages can use it.
//
// To add a piece: make pieces/<slug>/meta.ts and piece.tsx, import the meta
// here and put it in `pieces`, and add its line to PIECES in load-piece.tsx.
// To show it on the home page, put its slug in FEATURED below.

import { meta as agentRun } from "./pieces/agent-run/meta";
import { meta as commitCity } from "./pieces/commit-city/meta";
import { meta as daylight } from "./pieces/daylight/meta";
import { meta as disintegrate } from "./pieces/disintegrate/meta";
import { meta as dusk } from "./pieces/dusk/meta";
import { meta as elasticScrubber } from "./pieces/elastic-scrubber/meta";
import { meta as goldenRoom } from "./pieces/golden-room/meta";
import { meta as holoCards } from "./pieces/holo-cards/meta";
import { meta as island } from "./pieces/island/meta";
import { meta as liquidGlass } from "./pieces/liquid-glass/meta";
import { meta as liquidTabs } from "./pieces/liquid-tabs/meta";
import { meta as macropad } from "./pieces/macropad/meta";
import { meta as magneticDock } from "./pieces/magnetic-dock/meta";
import { meta as pullCord } from "./pieces/pull-cord/meta";
import { meta as seal } from "./pieces/seal/meta";
import { meta as splitFlap } from "./pieces/split-flap/meta";
import { meta as textMorph } from "./pieces/text-morph/meta";
import { meta as turntable } from "./pieces/turntable/meta";
import { meta as yearRings } from "./pieces/year-rings/meta";
import { CATEGORY_LABELS, type Category, type PieceMeta } from "./types";

export const pieces: readonly PieceMeta[] = [
  // new this round
  daylight,
  goldenRoom,
  holoCards,
  pullCord,
  yearRings,
  liquidTabs,
  island,
  magneticDock,
  textMorph,
  disintegrate,
  elasticScrubber,
  // the first nine (less one)
  commitCity,
  macropad,
  liquidGlass,
  turntable,
  dusk,
  splitFlap,
  seal,
  agentRun,
];

export type PieceSlug = (typeof pieces)[number]["slug"];

export const pieceSlugs: readonly string[] = pieces.map((piece) => piece.slug);

export function getPiece(slug: string): PieceMeta | undefined {
  return pieces.find((piece) => piece.slug === slug);
}

/** 1-based position in the lab ("01" … "19" in the list view). */
export function pieceNumber(slug: string): number {
  return pieces.findIndex((piece) => piece.slug === slug) + 1;
}

/** The pieces before and after this one, wrapping around the ends. */
export function getNeighbours(slug: string): { previous: PieceMeta; next: PieceMeta } | undefined {
  const index = pieces.findIndex((piece) => piece.slug === slug);
  if (index < 0) return undefined;
  const count = pieces.length;
  return { previous: pieces[(index - 1 + count) % count], next: pieces[(index + 1) % count] };
}

/* ---------------------------------------------------------------------- */
/* featured on the home page                                               */
/* ---------------------------------------------------------------------- */

/**
 * The nine pieces in the home page's lab section, in reading order (three
 * columns read across: 1-2-3 / 4-5-6 / 7-8-9; the masonry levels the
 * column ends whatever the tile shapes). A curated mix of interactions,
 * objects, data and a scene. Commit city is left out on purpose: the
 * GitHub section right below already shows it. Slugs that aren't in
 * `pieces` are skipped, so a removed piece can't break the home page.
 */
const FEATURED: readonly string[] = [
  "daylight",
  "holo-cards",
  "golden-room",
  "pull-cord",
  "year-rings",
  "liquid-glass",
  "macropad",
  "island",
  "turntable",
];

export const featured: readonly PieceMeta[] = FEATURED.map((slug) => getPiece(slug)).filter(
  (piece): piece is PieceMeta => Boolean(piece),
);

export function isFeatured(slug: string): boolean {
  return FEATURED.includes(slug);
}

/* ---------------------------------------------------------------------- */
/* categories and search                                                   */
/* ---------------------------------------------------------------------- */

export type CategoryFilter = "all" | Category;

export type CategoryEntry = { id: CategoryFilter; label: string; count: number };

/**
 * Filter tabs with counts: All, then every category in CATEGORY_LABELS
 * order (Interactions, Objects, Data, Scenes). A category no piece uses
 * yet is left out rather than shown with a zero.
 */
export const categories: readonly CategoryEntry[] = [
  { id: "all", label: "All", count: pieces.length },
  ...(Object.keys(CATEGORY_LABELS) as Category[])
    .map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      count: pieces.filter((piece) => piece.category === id).length,
    }))
    .filter((entry) => entry.count > 0),
];

/** Whether a piece matches a search: title, summary, uses and category, all words. */
export function matchesSearch(piece: PieceMeta, query: string): boolean {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [
    piece.title,
    piece.slug.replace(/-/g, " "),
    piece.summary,
    piece.category,
    CATEGORY_LABELS[piece.category],
    ...piece.uses,
    piece.inspiredBy ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** About as paragraphs. */
export function aboutParagraphs(piece: PieceMeta): readonly string[] {
  return typeof piece.about === "string" ? [piece.about] : piece.about;
}
