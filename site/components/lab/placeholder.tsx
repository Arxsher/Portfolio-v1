// Stand-in drawn by a piece that hasn't been built yet: its title and
// category on a soft dotted tile, with "In the works" under it. Stub pieces
// (pieces/<slug>/piece.tsx) render this until they are replaced; delete
// this file once no piece imports it.

import { CATEGORY_SINGULAR, type Category, type PieceMode } from "./types";

export function PiecePlaceholder({
  title,
  mode,
  category,
}: {
  title: string;
  mode: PieceMode;
  category?: Category;
  /** Accepted for the stub signature; the placeholder is still either way. */
  reducedMotion?: boolean;
}) {
  const stage = mode === "stage";
  return (
    <div
      className="absolute inset-0 grid place-items-center bg-tile bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--foreground)_9%,transparent)_1px,transparent_1.5px)] [background-size:16px_16px]"
      style={{ backgroundPosition: "center" }}
    >
      <div className="rounded-[12px] bg-tile px-3 py-2 text-center">
        {stage && category ? <p className="mb-1 text-[12px] text-tertiary">{CATEGORY_SINGULAR[category]}</p> : null}
        <p className={stage ? "text-[15px] font-medium text-primary" : "text-[13px] text-secondary"}>{title}</p>
        <p className="mt-0.5 text-[12px] text-tertiary">In the works</p>
      </div>
    </div>
  );
}
