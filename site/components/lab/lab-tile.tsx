"use client";

// A lab tile (home grid, lab index, list preview): a rounded card in the
// tile colour with the piece running live inside it, linking to the
// piece's page. The piece only loads once the tile comes near the viewport
// and only runs while it is on screen and the tab is visible. Hovering (or
// focusing) slides up a small title chip, as on the reference home grid.
//
// The tile fills its parent (the masonry cell sets the size).

import Link from "next/link";
import { useRef } from "react";
import { ChevronRight } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useInView, usePageVisible } from "./hooks";
import { LoadPiece } from "./load-piece";
import type { PieceMeta } from "./types";

export function LabTile({
  piece,
  size = "small",
  className,
}: {
  piece: PieceMeta;
  /** "small": home grid (20px corners); "large": lab index (24px corners). */
  size?: "small" | "large";
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const near = useInView(ref, { rootMargin: "320px 0px", once: true });
  const onScreen = useInView(ref);
  const visible = usePageVisible();

  return (
    <Link
      ref={ref}
      href={`/lab/${piece.slug}/`}
      aria-label={`${piece.title}: ${piece.summary}`}
      className={cn(
        "group relative block size-full overflow-hidden bg-tile outline-none transition-[background-color,scale] duration-200 ease-out [isolation:isolate] hover:bg-tile-hover active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        size === "small" ? "rounded-[20px]" : "rounded-[24px]",
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0">
        {near ? <LoadPiece slug={piece.slug} mode="tile" active={onScreen && visible} /> : null}
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute start-3 bottom-3 z-10 flex h-6 max-w-[calc(100%-24px)] translate-y-1 items-center gap-1 rounded-[8px] bg-float px-2 text-[12px] text-primary opacity-0 shadow-lift transition-[translate,opacity] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span className="truncate">{piece.title}</span>
        <ChevronRight size={10} className="text-tertiary" />
      </span>
    </Link>
  );
}
