"use client";

// Night train: a stand-in until the piece is built. Replace this file with
// the real piece (default export taking PieceProps, see ../../types.ts);
// the registry, loader and tiles already know the slug.

import { PiecePlaceholder } from "../../placeholder";
import type { PieceProps } from "../../types";
import { meta } from "./meta";

export default function Piece({ mode, reducedMotion }: PieceProps) {
  return <PiecePlaceholder title={meta.title} category={meta.category} mode={mode} reducedMotion={reducedMotion} />;
}
