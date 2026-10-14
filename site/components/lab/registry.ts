// Every lab piece's meta, in home-grid order (three columns read across:
// 1-2-3 / 4-5-6 / 7-8-9). Importing this pulls in the metas only, never
// the piece code (that is load-piece.tsx's job), so server pages can use it.

import { meta as agentRun } from "./pieces/agent-run/meta";
import { meta as commitCity } from "./pieces/commit-city/meta";
import { meta as dusk } from "./pieces/dusk/meta";
import { meta as liquidGlass } from "./pieces/liquid-glass/meta";
import { meta as macropad } from "./pieces/macropad/meta";
import { meta as seal } from "./pieces/seal/meta";
import { meta as splitFlap } from "./pieces/split-flap/meta";
import { meta as turntable } from "./pieces/turntable/meta";
import { meta as zellige } from "./pieces/zellige/meta";
import { CATEGORY_LABELS, type Category, type PieceMeta } from "./types";

export const pieces: readonly PieceMeta[] = [
  zellige,
  splitFlap,
  seal,
  macropad,
  liquidGlass,
  agentRun,
  commitCity,
  turntable,
  dusk,
];

export type PieceSlug = (typeof pieces)[number]["slug"];

export const pieceSlugs: readonly string[] = pieces.map((piece) => piece.slug);

export function getPiece(slug: string): PieceMeta | undefined {
  return pieces.find((piece) => piece.slug === slug);
}

/** 1-based position in the lab ("01" … "09" in the list view). */
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

export type CategoryFilter = "all" | Category;

export type CategoryEntry = { id: CategoryFilter; label: string; count: number };

/** Filter tabs with counts: All, Components, Objects, Generative. */
export const categories: readonly CategoryEntry[] = [
  { id: "all", label: "All", count: pieces.length },
  ...(Object.keys(CATEGORY_LABELS) as Category[]).map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    count: pieces.filter((piece) => piece.category === id).length,
  })),
];

/** Whether a piece matches a search: title, summary, uses and category, all words. */
export function matchesSearch(piece: PieceMeta, query: string): boolean {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [piece.title, piece.summary, piece.category, ...piece.uses, piece.inspiredBy ?? ""]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** About as paragraphs. */
export function aboutParagraphs(piece: PieceMeta): readonly string[] {
  return typeof piece.about === "string" ? [piece.about] : piece.about;
}
