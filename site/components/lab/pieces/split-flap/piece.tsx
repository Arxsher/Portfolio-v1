"use client";

// Placeholder until this piece is built: its title on a soft tile.

import { PiecePlaceholder } from "../../placeholder";
import type { PieceProps } from "../../types";
import { meta } from "./meta";

export default function Piece({ mode }: PieceProps) {
  return <PiecePlaceholder title={meta.title} mode={mode} />;
}
