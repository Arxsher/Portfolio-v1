"use client";

// The zellige frieze: eight-pointed stars tip to tip with crosses cut from
// the gaps, full bleed. On first paint the tiles are set from the centre
// outward, like a maâlem laying a panel (CSS only, skipped under reduced
// motion); afterwards a glaze glint follows the pointer (only while it
// moves over the band).
//
// One per site, under the home hero (DESIGN.md). Decorative: aria-hidden.
//
//   <ZelligeBand />            three rows, 92px (72px on phones)
//   <ZelligeBand slim />       two rows, 56px
//   <ZelligeBand lay={false} /> no laying animation

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { friezeTiles } from "@/lib/zellige";

const PITCH = 32;
const COLS = 72; // 2304px of pattern: wider than any screen, centre-cropped
const FULL = friezeTiles(COLS, 3, PITCH);
const SLIM = friezeTiles(COLS, 2, PITCH);

export function ZelligeBand({
  slim = false,
  lay = true,
  className,
}: {
  slim?: boolean;
  lay?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tiles = slim ? SLIM : FULL;
  const rows = slim ? 2 : 3;
  const mid = COLS / 2;

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node || event.pointerType === "touch") return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--gx", `${Math.round(event.clientX - rect.left)}px`);
    node.style.setProperty("--gy", `${Math.round(event.clientY - rect.top)}px`);
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("zellige-band", slim && "zellige-band--slim", className)}
      data-lay={lay ? "" : undefined}
      onPointerMove={onMove}
    >
      <svg viewBox={`0 0 ${COLS * PITCH} ${rows * PITCH}`} focusable="false">
        {tiles.map((tile, index) => {
          // centre-out, with a little hand-laid jitter
          const distance = Math.abs(tile.col - mid);
          const delay = Math.round(
            distance * 26 + tile.row * 60 + ((index * 37) % 7) * 18 + (tile.kind === "cross" ? 120 : 0),
          );
          return (
            <polygon
              key={index}
              points={tile.points}
              className={`z-tile z-tile--${tile.tone}`}
              style={lay ? ({ "--d": delay } as CSSProperties) : undefined}
            />
          );
        })}
      </svg>
      <div className="zellige-band__sheen" />
      <div className="zellige-band__glint" />
    </div>
  );
}
