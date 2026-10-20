"use client";

// Home intro, part 3: a few featured lab pieces take turns on one wide
// tile, live, one at a time:
//
//   ┌────────────────────────────────────────────────────────┐
//   │                     (live piece)                        │
//   │ [Open in the lab ›]                                     │
//   └────────────────────────────────────────────────────────┘
//   Casablanca at dusk                         ━━━ ── ── ──   ‹  ‖  ›
//   From the lab · Generative
//
// - Each piece stays for DWELL_MS, then the next one crossfades in. The
//   segments under the tile show where we are; the current one is longer
//   and fills as the time runs.
// - Crossfade: every mounted piece is a layer with its own stable id, so
//   the outgoing piece is the same instance (and the same canvas, holding
//   its last frame) as it fades out on top of the incoming one. It stops
//   running as it starts to leave and unmounts when the fade ends; at
//   most two pieces are mounted at once (WebGL contexts are limited).
// - The next piece's code is fetched while the current one dwells, so the
//   crossfade blends piece into piece rather than into a loading sheen.
// - The rotation pauses while the tile is hovered, while keyboard focus is
//   inside, while it is off screen and while the tab is hidden. The pause
//   button stops the rotation and the piece until it is pressed again.
// - prefers-reduced-motion: no rotation and no pause button; the piece
//   shows its still frame and the arrows step through by hand with a
//   short fade.
// - Steps taken by hand are announced through a separate polite live
//   region; the automatic rotation is never announced.
//
// The tile is a link to the piece's page. Pieces mount (and load their
// code) only once the tile comes near the viewport. Every piece also has
// a tile in the lab grid further down; this is the short, featured cut.

import Link from "next/link";
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { ChevronRight, type IconProps } from "@/components/icons";
import { useInView, useLatest, usePageVisible, useReducedMotion } from "@/components/lab/hooks";
import { LoadPiece } from "@/components/lab/load-piece";
import { getPiece } from "@/components/lab/registry";
import { CATEGORY_SINGULAR, type PieceMeta } from "@/components/lab/types";
import { cn } from "@/lib/cn";

/** The featured pieces, in order. They read well as one object on a wide tile. */
const ROTATION = ["dusk", "split-flap", "turntable", "agent-run"] as const;

/**
 * The same chunks load-piece.tsx loads (one literal import per piece, so the
 * bundler shares the module): fetching one ahead of time makes its mount
 * immediate when its turn comes.
 */
const PRELOAD: Record<(typeof ROTATION)[number], () => Promise<unknown>> = {
  dusk: () => import("@/components/lab/pieces/dusk/piece"),
  "split-flap": () => import("@/components/lab/pieces/split-flap/piece"),
  turntable: () => import("@/components/lab/pieces/turntable/piece"),
  "agent-run": () => import("@/components/lab/pieces/agent-run/piece"),
};

const DWELL_MS = 6000;
const FADE_MS = 700;
const FADE_MS_REDUCED = 160;
/** The incoming piece gets this long to draw its first frame before the outgoing one starts to fade. */
const FADE_DELAY_MS = 200;

const slides: readonly PieceMeta[] = ROTATION.map((slug) => getPiece(slug)).filter(
  (piece): piece is PieceMeta => Boolean(piece),
);

/* ---------------------------------------------------------------------- */
/* small glyphs (16 grid, like components/icons.tsx)                       */
/* ---------------------------------------------------------------------- */

function PauseGlyph({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className}>
      <rect x="4.25" y="3.5" width="2.5" height="9" rx="0.9" fill="currentColor" />
      <rect x="9.25" y="3.5" width="2.5" height="9" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function PlayGlyph({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M5.25 4.1c0-.78.85-1.26 1.52-.86l6.02 3.9c.6.39.6 1.33 0 1.72l-6.02 3.9c-.67.4-1.52-.08-1.52-.86z"
        fill="currentColor"
      />
    </svg>
  );
}

const controlClass =
  "grid size-8 cursor-pointer place-items-center rounded-[10px] text-secondary transition-[background-color,color,scale] duration-150 ease-out hover:bg-wash hover:text-primary active:scale-[0.94] focus-ring";

/* ---------------------------------------------------------------------- */
/* one layer of the crossfade                                              */
/* ---------------------------------------------------------------------- */

type LayerEntry = { slug: string; id: number };

function Layer({
  slug,
  active,
  leaving,
  fadeMs,
  onGone,
}: {
  slug: string;
  active: boolean;
  leaving: boolean;
  fadeMs: number;
  onGone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const gone = useLatest(onGone);

  useEffect(() => {
    const element = ref.current;
    if (!leaving || !element) return;
    const fade = element.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: fadeMs,
      delay: fadeMs > FADE_MS_REDUCED ? FADE_DELAY_MS : 0,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards",
    });
    fade.onfinish = () => gone.current();
    return () => fade.cancel();
  }, [leaving, fadeMs, gone]);

  // The leaving layer sits on top and fades out over the incoming one.
  return (
    <div ref={ref} className={cn("absolute inset-0", leaving && "pointer-events-none z-10")}>
      <LoadPiece slug={slug} mode="tile" active={active} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* showcase                                                                */
/* ---------------------------------------------------------------------- */

export function IntroLab() {
  const rootRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const near = useInView(rootRef, { rootMargin: "240px 0px", once: true });
  const onScreen = useInView(rootRef);
  const visible = usePageVisible();
  const reduced = useReducedMotion();

  const [index, setIndex] = useState(0);
  // The mounted pieces, oldest first: the last one is current, any before it is fading out.
  const [layers, setLayers] = useState<LayerEntry[]>(() => (slides[0] ? [{ slug: slides[0].slug, id: 0 }] : []));
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const count = slides.length;
  const piece = slides[index];
  // The pause button only exists with motion on, so reduced motion ignores it.
  const running = onScreen && visible && (reduced || !stopped);
  const advancing = !reduced && running && !hovered && !focused && count > 1;
  const fadeMs = reduced ? FADE_MS_REDUCED : FADE_MS;

  const turns = useRef(0);
  const go = (next: number, byHand: boolean) => {
    const target = (next + count) % count;
    if (target === index) return;
    turns.current += 1;
    const id = turns.current;
    setIndex(target);
    // The current piece becomes the leaving one (same id, so the same
    // instance); one that was still fading out from a quick earlier step
    // is dropped, which keeps at most two pieces mounted.
    setLayers((list) => [...list.slice(-1), { slug: slides[target].slug, id }]);
    if (byHand) setAnnouncement(`${slides[target].title}, ${target + 1} of ${count}`);
  };
  const goRef = useLatest(go);

  // Fetch the next piece's code while this one dwells.
  useEffect(() => {
    if (!near || count < 2) return;
    const slug = slides[(index + 1) % count].slug as (typeof ROTATION)[number];
    PRELOAD[slug]?.().catch(() => {});
  }, [near, index, count]);

  // The dwell timer is the fill animation of the current segment: it pauses
  // with the rotation and moves on when it finishes.
  const fillRef = useRef<Animation | null>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (reduced || !bar || count < 2) return;
    const fill = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: DWELL_MS,
      easing: "linear",
      fill: "forwards",
    });
    fill.pause();
    fill.onfinish = () => goRef.current(index + 1, false);
    fillRef.current = fill;
    return () => {
      fill.cancel();
      fillRef.current = null;
    };
  }, [index, reduced, count, goRef]);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    if (advancing) fill.play();
    else fill.pause();
  }, [advancing, index, reduced]);

  if (!piece) return null;

  // Only keyboard focus pauses the rotation (a clicked arrow keeps focus,
  // and the rotation should not stop for that).
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.matches(":focus-visible")) setFocused(true);
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1, true);
    }
  };

  const category = CATEGORY_SINGULAR[piece.category];
  const last = layers.length - 1;

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="From the lab"
      className="mt-10 sm:mt-12"
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <Link
        href={`/lab/${piece.slug}/`}
        aria-label={`Open ${piece.title} in the lab`}
        className="group relative block h-[236px] overflow-hidden rounded-[24px] bg-tile outline-none transition-[background-color,scale] duration-200 ease-out [isolation:isolate] hover:bg-tile-hover active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-[296px]"
      >
        <div aria-hidden="true" className="absolute inset-0">
          {near
            ? layers.map((layer, i) => (
                <Layer
                  key={layer.id}
                  slug={layer.slug}
                  active={i === last && running}
                  leaving={i !== last}
                  fadeMs={fadeMs}
                  onGone={() => setLayers((list) => list.filter((entry) => entry.id !== layer.id))}
                />
              ))
            : null}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute start-3 bottom-3 z-20 flex h-6 items-center gap-1 rounded-[8px] bg-float px-2 text-[12px] text-primary opacity-0 shadow-lift transition-[translate,opacity] duration-200 ease-out translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100"
        >
          Open in the lab
          <ChevronRight size={10} className="text-tertiary" />
        </span>
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p key={piece.slug} className="truncate text-[14px]/[20px] text-primary motion-safe:animate-blur-in">
            {piece.title}
            <span className="sr-only">
              , {index + 1} of {count}
            </span>
          </p>
          <p className="truncate text-[13px]/[18px] text-tertiary">
            From the lab
            <span aria-hidden="true" className="mx-1.5 opacity-60">
              ·
            </span>
            <span className="sr-only">, </span>
            {category}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3" onKeyDown={onKeyDown}>
          {/* Below 360px the title needs the room more than the segments do. */}
          <span aria-hidden="true" className="hidden items-center gap-1 min-[360px]:flex">
            {slides.map((slide, i) => {
              const current = i === index;
              return (
                <span
                  key={slide.slug}
                  className={cn(
                    "relative h-[2px] overflow-hidden rounded-full motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out",
                    current ? "w-5 sm:w-6" : "w-2.5 sm:w-3",
                    i < index || (reduced && current)
                      ? "bg-[color-mix(in_oklab,var(--foreground)_65%,transparent)]"
                      : "bg-[color-mix(in_oklab,var(--foreground)_16%,transparent)]",
                  )}
                >
                  {current && !reduced ? (
                    <span
                      ref={barRef}
                      style={{ transform: "scaleX(0)" }}
                      className="absolute inset-0 origin-left bg-[color-mix(in_oklab,var(--foreground)_65%,transparent)] rtl:origin-right"
                    />
                  ) : null}
                </span>
              );
            })}
          </span>

          <span className="-me-1.5 flex items-center">
            <button type="button" aria-label="Previous piece" className={controlClass} onClick={() => go(index - 1, true)}>
              <ChevronRight size={14} className="rotate-180 rtl:rotate-0" />
            </button>
            {reduced ? null : (
              <button
                type="button"
                aria-label={stopped ? "Play the rotation" : "Pause the rotation"}
                className={controlClass}
                onClick={() => setStopped((value) => !value)}
              >
                <span className="icon-swap">
                  <span data-hidden={stopped}>
                    <PauseGlyph size={14} />
                  </span>
                  <span data-hidden={!stopped}>
                    <PlayGlyph size={14} />
                  </span>
                </span>
              </button>
            )}
            <button type="button" aria-label="Next piece" className={controlClass} onClick={() => go(index + 1, true)}>
              <ChevronRight size={14} className="rtl:rotate-180" />
            </button>
          </span>
        </div>
      </div>

      {/* Steps taken by hand, read out once; the rotation itself stays quiet. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </section>
  );
}
