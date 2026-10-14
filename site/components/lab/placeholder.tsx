// Stand-in drawn by a piece that hasn't been built yet. Delete this file
// once no piece imports it.
//
// Where the host gives LoadPiece a poster (the arcade niches, the stage),
// LoadPiece sees the data-lab-placeholder mark, keeps the code-drawn
// poster on show and hides this layer; the stage then adds a small "in the
// works" note. Where there is no poster (the home hero window) this is what
// shows: the piece's name set on the band. It draws no <canvas> or <svg>
// on purpose, so hosts that wait for a drawn piece keep their own poster.

import type { PieceMode } from "./types";

export function PiecePlaceholder({ title, mode }: { title: string; mode: PieceMode }) {
  const stage = mode === "stage";
  return (
    <div
      data-lab-placeholder={mode}
      className="absolute inset-0 grid place-items-center bg-band p-4 text-center"
    >
      <div>
        <p className={stage ? "font-display text-title-2 text-primary" : "font-display text-title-3 text-primary"}>
          {title}
        </p>
        <p className="mt-1.5 serif-italic text-small text-muted">in the works</p>
      </div>
    </div>
  );
}
