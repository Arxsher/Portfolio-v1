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
import { meta as splitFlap } from "./pieces/split-flap/meta";
import { meta as textMorph } from "./pieces/text-morph/meta";
import { meta as turntable } from "./pieces/turntable/meta";
import { meta as yearRings } from "./pieces/year-rings/meta";
import { meta as snowGlobe } from "./pieces/snow-globe/meta";
import { meta as tinyPlanet } from "./pieces/tiny-planet/meta";
import { meta as nightTrain } from "./pieces/night-train/meta";
import { meta as rainWindow } from "./pieces/rain-window/meta";
import { CATEGORY_LABELS, type Category, type PieceMeta } from "./types";

const published: readonly PieceMeta[] = [
  snowGlobe,
  tinyPlanet,
  dusk,
  goldenRoom,
  holoCards,
  rainWindow,
  macropad,
  yearRings,
  commitCity,
  liquidGlass,
  turntable,
  liquidTabs,
  splitFlap,
  agentRun,
];

/**
 * Pieces that are still being built. They keep their folders, metas and
 * loader entries but stay out of the lab, the home page and the palette
 * until they are finished: move one into `pieces` to publish it.
 */
export const drafts: readonly PieceMeta[] = [
  nightTrain,
  pullCord,
  island,
  magneticDock,
  textMorph,
  disintegrate,
  elasticScrubber,
];

/**
 * The pieces the site shows. Production builds (the deployed site) show
 * only finished pieces; the dev server also shows drafts so they can be
 * built and checked at /lab/<slug>/.
 */
export const pieces: readonly PieceMeta[] =
  process.env.NODE_ENV === "production" ? published : [...published, ...drafts];

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
 * objects, data and scenes. Slugs that aren't in
 * `pieces` are skipped, so a removed piece can't break the home page.
 */
const FEATURED: readonly string[] = [
  "snow-globe",
  "tiny-planet",
  "holo-cards",
  "golden-room",
  "rain-window",
  "macropad",
  "year-rings",
  "liquid-glass",
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
