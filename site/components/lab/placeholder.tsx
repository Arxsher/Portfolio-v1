// Stand-in drawn by a piece that hasn't been built yet: its title, centred
// on a soft tile. Delete this file once no piece imports it.

import type { PieceMode } from "./types";

export function PiecePlaceholder({ title, mode }: { title: string; mode: PieceMode }) {
  const stage = mode === "stage";
  return (
    <div
      className="absolute inset-0 grid place-items-center bg-tile bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--foreground)_9%,transparent)_1px,transparent_1.5px)] [background-size:16px_16px]"
      style={{ backgroundPosition: "center" }}
    >
      <div className="rounded-[12px] bg-tile px-3 py-2 text-center">
        <p className={stage ? "text-[15px] font-medium text-primary" : "text-[13px] text-secondary"}>{title}</p>
        <p className="mt-0.5 text-[12px] text-tertiary">In the works</p>
      </div>
    </div>
  );
}
