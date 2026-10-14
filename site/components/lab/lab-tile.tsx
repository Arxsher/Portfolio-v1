"use client";

// A lab piece as a niche in the arcade (home, lab index): a pointed arch
// with the piece running live in its window and a caption on the sill
// under it.
//
//        ✦            the keystone turns when the niche is hovered or focused
//      ╭───╮
//     │ art │         the poster (lab-art.tsx), then the live piece over it
//     │     │
//   ──┴─────┴──
//   01 Zellige        numeral · title (turns italic cobalt on hover)
//      GENERATIVE     category
//      Hand-cut …     the summary, one line
//
// The piece only loads once the niche comes near the viewport and only
// runs while it is on screen and the tab is visible; until then (and while
// a piece is still a stand-in) the code-drawn poster shows. The poster is
// rendered on the server and passed in, so its drawing never ships as JS.
//
// LabTile is the older rectangular card (paper, live piece inside), kept
// for any caller that wants a plain tile.

import Link from "next/link";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { ArchFrame } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";
import { useInView, usePageVisible } from "./hooks";
import { LoadPiece } from "./load-piece";
import { pieceNumber } from "./registry";
import { CATEGORY_SINGULAR, type PieceMeta } from "./types";

export function LabNiche({
  piece,
  poster,
  ground,
  number,
  live = true,
  className,
}: {
  piece: PieceMeta;
  /** The code-drawn poster (<PieceArt slug=… />), rendered by a server component. */
  poster?: ReactNode;
  /** The window's ground behind the poster (artGround(slug)). */
  ground?: string;
  /** Position shown as the numeral (defaults to the piece's place in the lab). */
  number?: number;
  /** False: keep the poster only (no live piece). */
  live?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const near = useInView(ref, { rootMargin: "320px 0px", once: true });
  const onScreen = useInView(ref);
  const visible = usePageVisible();
  const kind = CATEGORY_SINGULAR[piece.category];

  return (
    <Link
      ref={ref}
      href={`/lab/${piece.slug}/`}
      data-row=""
      aria-label={`${piece.title}, ${kind.toLowerCase()}: ${piece.summary}`}
      className={cn("group block rounded-[4px] text-primary focus-ring-far", className)}
    >
      <ArchFrame windowStyle={{ background: ground ?? "var(--band)" } as CSSProperties}>
        <div className="absolute inset-0 transition-[scale,translate] duration-700 ease-out group-hover:-translate-y-[2%] group-hover:scale-[1.06] group-focus-visible:-translate-y-[2%] group-focus-visible:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:translate-y-0 motion-reduce:group-focus-visible:scale-100">
          <LoadPiece
            slug={piece.slug}
            mode="tile"
            active={onScreen && visible}
            poster={poster ?? null}
            load={live && near}
          />
        </div>
        {/* a soft light from the top of the window, brighter on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_16%,rgb(255_255_255/0.26),transparent_70%)] opacity-50 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </ArchFrame>
      <span aria-hidden="true" className="mt-3.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 border-t border-line pt-2.5">
        <span className="numeral row-span-3 pt-[3px] text-[14px] leading-none">{pad(number ?? pieceNumber(piece.slug))}</span>
        <span className="font-display text-title-3 text-primary transition-colors duration-300 ease-out group-hover:turn group-focus-visible:turn max-sm:text-[18px]">
          {piece.title}
        </span>
        <span className="caps mt-1 text-muted">{kind}</span>
        <span className="mt-1.5 line-clamp-2 text-small text-pretty text-muted">{piece.summary}</span>
      </span>
    </Link>
  );
}

/** The plain rectangular tile: paper, the piece live inside, the title on hover. Fills its parent. */
export function LabTile({
  piece,
  size = "small",
  className,
}: {
  piece: PieceMeta;
  /** Kept for older callers; both sizes use 6px paper corners now. */
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
      data-size={size}
      className={cn(
        "group relative block size-full overflow-hidden rounded-paper bg-paper shadow-lift transition-[box-shadow] duration-300 ease-out [isolation:isolate] hover:shadow-lift-hover focus-ring",
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0">
        {near ? <LoadPiece slug={piece.slug} mode="tile" active={onScreen && visible} /> : null}
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute start-3 bottom-3 z-10 flex h-7 max-w-[calc(100%-24px)] translate-y-1 items-center rounded-pill bg-paper px-3 font-display text-[14px] text-primary opacity-0 shadow-lift transition-[translate,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span className="truncate">{piece.title}</span>
      </span>
    </Link>
  );
}
