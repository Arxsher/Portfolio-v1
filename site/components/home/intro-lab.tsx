"use client";

// Home, part 2: three lab pieces on one wide tile, live, stepped through by
// scrolling.
//
//   ┌────────────────────────────────────── [Show more in the lab ›] ┐
//   │                     (live piece)                                │
//   │ [Open in the lab ›]                                             │
//   └─────────────────────────────────────────────────────────────────┘
//   Last light                                 ━━━ ── ──   ‹  ›
//   From the lab · Scene
//
// - The block scrolls up into the middle of the screen and stays there
//   (a sticky, screen-tall box in a tall track) while the scroll moves
//   through the three pieces: each takes STEP of the screen's height, the
//   next one crossfading in over the last (the outgoing piece keeps its
//   last frame as it fades; at most two are mounted, WebGL contexts are
//   limited). The segments under the tile fill with the scroll.
// - After the third, the tile frosts over with a call to see the whole lab,
//   then the pin lets go and the block scrolls on up.
// - The arrows scroll the page to the previous or next piece.
// - A frosted "Show more in the lab" pill sits on the tile throughout.
// - Reduced motion: no pin; the arrows step through the pieces by hand with
//   a short fade.
// - Steps are announced through a polite live region.
//
// The tile is a link to the piece's page. Pieces mount (and load their
// code) only once the block comes near the viewport. Every piece also has a
// tile in the lab grid further down; this is the short, featured cut.

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRight } from "@/components/icons";
import { useInView, useLatest, usePageVisible, useReducedMotion } from "@/components/lab/hooks";
import { LoadPiece } from "@/components/lab/load-piece";
import { getPiece, pieces } from "@/components/lab/registry";
import { CATEGORY_SINGULAR, type PieceMeta } from "@/components/lab/types";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

/** The featured pieces, in order. They read well as one object on a wide tile. */
const ROTATION = ["dusk", "holo-cards", "tiny-planet"] as const;

/**
 * The same chunks load-piece.tsx loads (one literal import per piece, so the
 * bundler shares the module): fetching one ahead of time makes its mount
 * immediate when its turn comes.
 */
const PRELOAD: Record<(typeof ROTATION)[number], () => Promise<unknown>> = {
  dusk: () => import("@/components/lab/pieces/dusk/piece"),
  "holo-cards": () => import("@/components/lab/pieces/holo-cards/piece"),
  "tiny-planet": () => import("@/components/lab/pieces/tiny-planet/piece"),
};

/** Pin length, in steps of the screen's height: one per piece, then the frosted call. */
const STEPS = ROTATION.length + 0.6;
const FADE_MS = 520;
const FADE_MS_REDUCED = 160;

const slides: readonly PieceMeta[] = ROTATION.map((slug) => getPiece(slug)).filter(
  (piece): piece is PieceMeta => Boolean(piece),
);

const controlClass =
  "grid size-8 cursor-pointer place-items-center rounded-[10px] text-secondary transition-[background-color,color,scale] duration-150 ease-out hover:bg-wash hover:text-primary active:scale-[0.94] focus-ring disabled:pointer-events-none disabled:opacity-35";

/** Frosted glass over the live piece. */
const frost =
  "bg-[color-mix(in_oklab,var(--background)_55%,transparent)] backdrop-blur-xl backdrop-saturate-150 shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_10%,transparent),0_8px_24px_-12px_rgb(0_0_0/0.35)]";

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
    // the outgoing piece blurs as it fades, so the change reads as one move
    const fade = element.animate(
      [
        { opacity: 1, filter: "blur(0px)" },
        { opacity: 0, filter: fadeMs > FADE_MS_REDUCED ? "blur(14px)" : "blur(0px)" },
      ],
      { duration: fadeMs, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
    );
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
/* the pinned block                                                        */
/* ---------------------------------------------------------------------- */

export function IntroLab() {
  const trackRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const fillRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const frostRef = useRef<HTMLDivElement>(null);
  const near = useInView(blockRef, { rootMargin: "320px 0px", once: true });
  const onScreen = useInView(blockRef);
  const visible = usePageVisible();
  const reduced = useReducedMotion();

  const [index, setIndex] = useState(0);
  // The mounted pieces, oldest first: the last one is current, any before it is fading out.
  const [layers, setLayers] = useState<LayerEntry[]>(() => (slides[0] ? [{ slug: slides[0].slug, id: 0 }] : []));
  const [frosted, setFrosted] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const count = slides.length;
  const piece = slides[index];
  const running = onScreen && visible && !frosted;
  const fadeMs = reduced ? FADE_MS_REDUCED : FADE_MS;

  const turns = useRef(0);
  const go = (next: number) => {
    const target = Math.max(0, Math.min(count - 1, next));
    if (target === index) return;
    turns.current += 1;
    const id = turns.current;
    setIndex(target);
    // The current piece becomes the leaving one (same id, so the same
    // instance); one still fading from a quick earlier step is dropped,
    // which keeps at most two pieces mounted.
    setLayers((list) => [...list.slice(-1), { slug: slides[target].slug, id }]);
    setAnnouncement(`${slides[target].title}, ${target + 1} of ${count}`);
  };
  const goRef = useLatest(go);
  const frostedRef = useLatest(frosted);

  // Fetch the next piece's code while this one shows.
  useEffect(() => {
    if (!near || index + 1 >= count) return;
    const slug = slides[index + 1].slug as (typeof ROTATION)[number];
    PRELOAD[slug]?.().catch(() => {});
  }, [near, index, count]);

  // The scroll drives the pieces, the segments and the frost.
  useEffect(() => {
    const track = trackRef.current;
    if (reduced || !track) return;
    let raf = 0;
    const render = () => {
      raf = 0;
      const box = track.firstElementChild as HTMLElement | null;
      const V = box?.clientHeight ?? window.innerHeight;
      const step = Math.max(1, (track.offsetHeight - V) / STEPS);
      const q = Math.max(0, Math.min(STEPS, -track.getBoundingClientRect().top / step));
      const target = Math.min(count - 1, Math.floor(q));
      goRef.current(target);
      fillRefs.current.forEach((fill, i) => {
        if (!fill) return;
        const amount = i < target ? 1 : i > target ? 0 : Math.min(1, q - i);
        fill.style.transform = `scaleX(${amount.toFixed(3)})`;
      });
      const frostAmount = Math.max(0, Math.min(1, (q - count) / 0.45));
      const layer = frostRef.current;
      if (layer) {
        layer.style.opacity = frostAmount.toFixed(3);
        layer.style.setProperty("--frost", `${(frostAmount * 22).toFixed(1)}px`);
      }
      const on = frostAmount > 0.5;
      if (on !== frostedRef.current) setFrosted(on);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reduced, count, goRef, frostedRef]);

  if (!piece) return null;

  /** The arrows: by hand with reduced motion, otherwise scroll to that piece's step. */
  const step = (delta: number) => {
    haptic();
    const track = trackRef.current;
    if (reduced || !track) {
      go(index + delta);
      return;
    }
    const box = track.firstElementChild as HTMLElement | null;
    const V = box?.clientHeight ?? window.innerHeight;
    const size = (track.offsetHeight - V) / STEPS;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const to = delta > 0 && index === count - 1 ? count + 0.3 : Math.max(0, index + delta) + 0.15;
    window.scrollTo({ top: top + to * size, behavior: "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const category = CATEGORY_SINGULAR[piece.category];
  const last = layers.length - 1;
  const total = pieces.length;

  return (
    <div ref={trackRef} className="lab-track relative">
      <div className="lab-box pointer-events-none sticky top-0 flex h-[100svh] items-center">
        <section
          ref={blockRef}
          data-fx-target=""
          aria-roledescription="carousel"
          aria-label="From the lab"
          className="lab-block pointer-events-auto w-full"
        >
          <div className="relative">
            <Link
              href={`/lab/${piece.slug}/`}
              aria-label={`Open ${piece.title} in the lab`}
              tabIndex={frosted ? -1 : undefined}
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

            {/* Always there: the way to everything else in the lab. */}
            <Link
              href="/lab/"
              className={cn(
                "absolute end-3 top-3 z-30 flex h-7 items-center gap-1 rounded-full ps-3 pe-2 text-[12px] text-primary transition-[scale,opacity] duration-200 ease-out active:scale-[0.96] focus-ring",
                frost,
                frosted && "pointer-events-none opacity-0",
              )}
              tabIndex={frosted ? -1 : undefined}
            >
              Show more in the lab
              <ChevronRight size={10} className="text-tertiary" />
            </Link>

            {/* After the third piece the tile frosts over with the call to see them all. */}
            {reduced ? null : (
              <div
                ref={frostRef}
                aria-hidden={!frosted}
                style={{ opacity: 0 }}
                className={cn(
                  "absolute inset-0 z-40 grid place-items-center overflow-hidden rounded-[24px] [backdrop-filter:blur(var(--frost,0px))_saturate(140%)] [-webkit-backdrop-filter:blur(var(--frost,0px))_saturate(140%)] bg-[color-mix(in_oklab,var(--background)_35%,transparent)]",
                  frosted ? "pointer-events-auto" : "pointer-events-none",
                )}
              >
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <p className="text-[15px] text-primary">
                    {total} pieces in the lab
                    <span className="block text-[13px] text-secondary">shaders, physics and small interactive things</span>
                  </p>
                  <Link
                    href="/lab/"
                    tabIndex={frosted ? undefined : -1}
                    className="btn btn-solid"
                  >
                    Explore the lab
                    <ChevronRight size={11} />
                  </Link>
                </div>
              </div>
            )}
          </div>

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
              <span aria-hidden="true" className="flex items-center gap-1">
                {slides.map((slide, i) => {
                  const current = i === index;
                  return (
                    <span
                      key={slide.slug}
                      className={cn(
                        "relative h-[2px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_16%,transparent)] motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out",
                        current ? "w-5 sm:w-6" : "w-2.5 sm:w-3",
                      )}
                    >
                      <span
                        ref={(el) => {
                          fillRefs.current[i] = el;
                        }}
                        style={{ transform: `scaleX(${reduced ? (i <= index ? 1 : 0) : i < index ? 1 : 0})` }}
                        className="absolute inset-0 origin-left bg-[color-mix(in_oklab,var(--foreground)_65%,transparent)] rtl:origin-right"
                      />
                    </span>
                  );
                })}
              </span>

              <span className="-me-1.5 flex items-center">
                <button
                  type="button"
                  aria-label="Previous piece"
                  className={controlClass}
                  disabled={index === 0}
                  onClick={() => step(-1)}
                >
                  <ChevronRight size={14} className="rotate-180 rtl:rotate-0" />
                </button>
                <button
                  type="button"
                  aria-label="Next piece"
                  className={controlClass}
                  disabled={reduced && index === count - 1}
                  onClick={() => step(1)}
                >
                  <ChevronRight size={14} className="rtl:rotate-180" />
                </button>
              </span>
            </div>
          </div>

          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </span>
        </section>
      </div>
    </div>
  );
}
