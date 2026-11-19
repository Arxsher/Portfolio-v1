"use client";

// The interactive project rows (home "work" section and /projects/) and the
// preview card that floats beside them.
//
// LOOK
//   A small white (dark: raised grey) card, 296px wide, in the site's own
//   materials: bg-float, shadow-float, radius 18. On top, an inset panel with
//   a faint dot grid and a raised 64px tile in the middle: a slot window.
//   The project glyphs sit on an invisible drum behind that window, so the
//   current one shows solid inside the tile while its neighbours curve away
//   above and below it, faint and foreshortened. A rolling "04 / 10" counter
//   sits in the corner. Under the panel: category · date (or a live dot for
//   work in progress), one sentence, and up to three tags.
//
// MOTION MODEL (all springs from components/lab/hooks.ts, stepped with the
// real frame dt by one rAF loop that sleeps once everything settles)
//   x, y   position, stiffness 190 / damping 23 (zeta ~0.83): the card trails
//          the cursor with a soft lag and lands with a hint of overshoot. It
//          stays in the lane right of the rows' text: when the cursor is over
//          the text the card is held at the lane edge and only leans toward
//          the cursor (rubber band), so it never covers the hovered row's
//          words, even mid-glide. With no room for that lane (narrow
//          windows) it docks under (or over) the hovered row instead, on a
//          stiffer vertical spring (520 / 46) so it clears the next row fast.
//   tilt   the card swings from the side nearest the cursor, driven by its
//          own horizontal speed through an under-damped spring (zeta ~0.55),
//          so a quick move ends in a small pendulum settle.
//   show   presence, stiffness 520 / damping 34: scales up from 0.88 with a
//          blur-to-sharp, out of the cursor side; hides the same way. It is
//          a spring, so leaving and coming back mid-fade just turns around.
//   reel   the drum and the text, one spring on the row index (zeta ~0.93).
//          Moving down the list turns the drum: glyphs roll through the
//          window, the counter's digits roll, the text below cross-fades with
//          a 12px slide and a little blur, and the card's height glides
//          between the two texts. Fast scans spin through every project in
//          between, and the wheel does the same while you scroll the page
//          under a resting cursor.
//   press  mousedown sinks the card by 3%.
//   Everything is interruptible: each spring keeps its velocity when its
//   target moves. The "wow" second: sweep down the list and the drum spins
//   project by project while the card swings after the cursor.
//
// TOUCH: a tap expands the row inline (the details plus a "View project"
// link) and a second tap folds it; one row is open at a time.
// KEYBOARD: focusing a row with the keyboard shows the same details inline,
// with an Enter hint; Escape folds them. Reduced motion: the card docks
// beside the hovered row without lag, tilt, scale or blur and changes
// instantly; the inline rows open without the height animation.
// No sound: these are navigation rows on pages without a mute control.

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "@/components/icons";
import { Spring, clamp, lerp, smoothstep, useMediaQuery, useReducedMotion } from "@/components/lab/hooks";
import { ProjectIcon, ProjectTile } from "@/components/project-icons";
import { cn } from "@/lib/cn";

export type PreviewMeta = { text: string; live?: boolean; dateTime?: string };

/** One row plus its preview (built server-side in components/project-row.tsx). */
export type ProjectPreview = {
  slug: string;
  name: string;
  tagline: string;
  href: string;
  meta: PreviewMeta[];
  description: string;
  tags: string[];
};

type Open = { index: number; by: "touch" | "keyboard" } | null;

/* ---------------------------------------------------------------------- */
/* the list                                                                */
/* ---------------------------------------------------------------------- */

/** Rows that are not the hovered (or open) one fade back. The li carries the
    transition; the attributes are written by the card engine. */
const dimClasses =
  "[&[data-dim=hover]>li:not([data-hot])]:opacity-40 [&[data-dim=open]>li:not([data-hot])]:opacity-55";

export function ProjectRows({
  items,
  total = items.length,
  className,
}: {
  items: ProjectPreview[];
  /** All projects, for the card's "04 / 10" (the home page shows a few of them). */
  total?: number;
  className?: string;
}) {
  const listRef = useRef<HTMLUListElement | null>(null);
  // State, not a ref: the card mounts in a portal after the list, and the
  // engine effect has to run again once it exists.
  const [card, setCard] = useState<HTMLDivElement | null>(null);
  const engineRef = useRef<CardEngine | null>(null);
  const pointerRef = useRef({ type: "", at: 0 });
  const [open, setOpen] = useState<Open>(null);
  const reduced = useReducedMotion();
  const canHover = useMediaQuery("(any-hover: hover)", false);
  const touchUi = useMediaQuery("(hover: none)", false);

  // The floating card only exists where a mouse or trackpad can hover.
  useEffect(() => {
    const list = listRef.current;
    if (!canHover || !list || !card) return;
    const engine = new CardEngine(list, card);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [canHover, card, items.length]);

  // `card` and `canHover` are listed so a freshly made engine gets both.
  useEffect(() => {
    engineRef.current?.setReduced(reduced);
  }, [reduced, canHover, card, items.length]);

  useEffect(() => {
    engineRef.current?.setOpen(open ? open.index : -1);
  }, [open, canHover, card, items.length]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || canHover) return;
    // Without a card engine the dimming is written here.
    writeHot(list, open ? open.index : -1, open ? "open" : "");
  }, [open, canHover]);

  // A row opened by touch near the bottom of the screen: the page follows
  // the details down while they grow (one frame at a time, so it is never
  // clamped by the old page height), until they clear the floating dock. A
  // finger or wheel on the page takes over at once.
  useEffect(() => {
    if (!open || open.by !== "touch") return;
    const row = listRef.current?.children[open.index] as HTMLElement | undefined;
    const details = row?.lastElementChild as HTMLElement | null | undefined;
    if (!row || !details) return;
    let frame = 0;
    let stopped = false;
    const start = performance.now();
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
    const follow = () => {
      if (stopped) return;
      const limit = window.innerHeight - 112;
      const overflow = details.getBoundingClientRect().bottom - limit;
      const room = row.getBoundingClientRect().top - 88;
      const delta = Math.min(overflow, room);
      if (delta > 0.5) window.scrollBy({ top: delta, behavior: "instant" });
      if (performance.now() - start < (reduced ? 50 : 700)) frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    return () => {
      stop();
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
    };
  }, [open, reduced]);

  return (
    <>
      <ul
        ref={listRef}
        data-project-list=""
        className={cn(dimClasses, className)}
        onPointerDown={(event) => {
          pointerRef.current = { type: event.pointerType, at: performance.now() };
        }}
      >
        {items.map((item, index) => {
          const isOpen = open?.index === index;
          const detailsId = `project-details-${item.slug}`;
          return (
            <li key={item.slug} data-index={index} className="transition-opacity duration-300 ease-out">
              <Link
                href={item.href}
                aria-expanded={touchUi ? isOpen : undefined}
                aria-controls={touchUi ? detailsId : undefined}
                className="group flex items-center gap-4 rounded-[14px] py-3 focus-ring-far"
                onClick={(event) => {
                  const pointer = pointerRef.current;
                  const tapped =
                    (pointer.type === "touch" || pointer.type === "pen") && performance.now() - pointer.at < 1500;
                  if (!tapped) {
                    engineRef.current?.hideNow();
                    return;
                  }
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  setOpen((current) => (current?.index === index ? null : { index, by: "touch" }));
                }}
                onFocus={(event) => {
                  if (!event.currentTarget.matches(":focus-visible")) return;
                  setOpen((current) => (current?.by === "touch" && current.index === index ? current : { index, by: "keyboard" }));
                }}
                onBlur={(event) => {
                  const row = event.currentTarget.parentElement;
                  if (row && event.relatedTarget instanceof Node && row.contains(event.relatedTarget)) return;
                  setOpen((current) => (current?.by === "keyboard" && current.index === index ? null : current));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && isOpen) {
                    event.preventDefault();
                    setOpen(null);
                  }
                }}
              >
                <ProjectTile slug={item.slug} />
                <span className="min-w-0 flex-1 leading-[1.4]">
                  <span
                    data-row-text=""
                    className="hover-underline block font-medium text-primary group-hover:decoration-current"
                  >
                    {item.name}
                  </span>
                  <span data-row-text="" className="block text-[15px] text-secondary">
                    {item.tagline}
                  </span>
                </span>
                <ChevronRight
                  size={14}
                  className={cn(
                    "shrink-0 transition-[color,rotate,translate] duration-300 ease-out motion-reduce:transition-[color]",
                    isOpen ? "rotate-90 text-primary" : "text-tertiary group-hover:translate-x-0.5 group-hover:text-primary",
                  )}
                />
              </Link>
              <Details id={detailsId} item={item} open={isOpen} by={isOpen ? open.by : null} />
            </li>
          );
        })}
      </ul>
      {/* canHover is false on the server and during hydration, so the
          portal is only ever created in the browser. */}
      {canHover ? createPortal(<PreviewCard items={items} total={total} cardRef={setCard} />, document.body) : null}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* shared bits                                                             */
/* ---------------------------------------------------------------------- */

function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex size-1.5 shrink-0 text-secondary">
      {/* The ping only runs where it can be seen: inside an open row or a
          shown card (both carry data-live). */}
      <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-50 [animation-duration:1.8s] [animation-play-state:paused] in-data-live:[animation-play-state:running] motion-reduce:hidden" />
      <span className="relative size-1.5 rounded-full bg-current" />
    </span>
  );
}

function MetaLine({ meta, className }: { meta: PreviewMeta[]; className?: string }) {
  if (!meta.length) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 text-[12px]/[1.5] text-tertiary tabular-nums", className)}>
      {meta.map((item, i) => (
        <Fragment key={item.text}>
          {i > 0 ? (
            <span aria-hidden="true" className="opacity-60">
              ·
            </span>
          ) : null}
          {item.live ? <LiveDot /> : null}
          {item.dateTime ? <time dateTime={item.dateTime}>{item.text}</time> : <span>{item.text}</span>}
        </Fragment>
      ))}
    </p>
  );
}

function Tags({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <ul aria-label="Tags" className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <li key={tag} className="rounded-[7px] bg-well px-1.5 text-[11.5px]/[1.6] text-secondary">
          {tag}
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------------- */
/* inline details (touch tap, keyboard focus)                              */
/* ---------------------------------------------------------------------- */

/** Each line of the details rises out of a soft blur, one after another. */
function Reveal({ open, step, className, children }: { open: boolean; step: number; className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "transition-[opacity,translate,filter] duration-[360ms] ease-out motion-reduce:transition-opacity motion-reduce:duration-150",
        open ? "translate-y-0 opacity-100 blur-none" : "-translate-y-1 opacity-0 blur-[3px] motion-reduce:translate-y-0 motion-reduce:blur-none",
        className,
      )}
      style={{ transitionDelay: open ? `${70 + step * 50}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function Details({ id, item, open, by }: { id: string; item: ProjectPreview; open: boolean; by: "touch" | "keyboard" | null }) {
  return (
    <div
      id={id}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows] duration-[460ms] ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div data-details-inner="" data-live={open || undefined} className="ps-15 pe-2 pt-2 pb-5 sm:pe-12">
          <Reveal open={open} step={0}>
            <MetaLine meta={item.meta} />
          </Reveal>
          <Reveal open={open} step={1} className="mt-1.5">
            <p className="text-[15px]/[1.5] text-pretty">{item.description}</p>
          </Reveal>
          {item.tags.length ? (
            <Reveal open={open} step={2} className="mt-3">
              <Tags tags={item.tags} />
            </Reveal>
          ) : null}
          <Reveal open={open} step={3} className="mt-4">
            {by === "keyboard" ? (
              <p className="flex items-center gap-1.5 text-[12px] text-tertiary">
                <kbd className="kbd">Enter</kbd> to open
              </p>
            ) : (
              <Link
                href={item.href}
                className="btn btn-soft -ms-0.5 h-9 gap-1 ps-3.5 pe-2.5 text-[13px] focus-ring"
              >
                View project
                <ChevronRight size={13} className="text-tertiary" />
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* floating card                                                           */
/* ---------------------------------------------------------------------- */

const CARD_W = 296;
const CARD_MIN_W = 236;
/** Kept clear between the rows' text and the card's lane. */
const TEXT_GAP = 30;
/** How far the card may lean into that gap toward a cursor over the text. */
const LEAN = 16;
const EDGE = 12;
/** Pointer dwell before the card appears, so a pass over the list on the
    way elsewhere does not flash it. */
const INTENT_MS = 70;
/** Card top sits this fraction of its height above the cursor. */
const HANG = 0.3;

/** Drum: one project per STEP radians on a cylinder of radius R px. */
const STEP = 0.7;
const R = 70;
/** Counter digit line height (px). */
const DIGIT_H = 14;

const DOTS: CSSProperties = {
  backgroundImage: "radial-gradient(circle, var(--line-dash) 0.85px, transparent 1.25px)",
  backgroundSize: "11px 11px",
  backgroundPosition: "center",
  maskImage: "radial-gradient(ellipse 62% 78% at 50% 50%, #000 15%, transparent 78%)",
  WebkitMaskImage: "radial-gradient(ellipse 62% 78% at 50% 50%, #000 15%, transparent 78%)",
};
/** A soft pool of light behind the tile, so the panel has some depth. */
const GLOW: CSSProperties = {
  backgroundImage:
    "radial-gradient(closest-side, color-mix(in oklab, var(--float) 85%, transparent), transparent)",
  backgroundSize: "190px 150px",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};
const HIDDEN: CSSProperties = { visibility: "hidden" };

function DigitColumn({ part, digits }: { part: "units" | "tens"; digits: number }) {
  return (
    <span className="inline-block overflow-hidden" style={{ height: DIGIT_H }}>
      <span data-digits={part} className="block will-change-transform">
        {Array.from({ length: digits }, (_, d) => (
          <span key={d} className="block text-center" style={{ height: DIGIT_H, lineHeight: `${DIGIT_H}px` }}>
            {d % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

function PreviewCard({ items, total, cardRef }: { items: ProjectPreview[]; total: number; cardRef: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      data-project-preview=""
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-30 rounded-[18px] bg-float shadow-float select-none"
      style={{ width: CARD_W, visibility: "hidden", opacity: 0, willChange: "transform, opacity" }}
    >
      <div className="relative m-1.5 h-[132px] overflow-hidden rounded-[13px] bg-tile dark:bg-background">
        <div className="absolute inset-0" style={DOTS} />
        <div className="absolute inset-0" style={GLOW} />
        <p className="absolute top-2 left-2.5 flex items-center text-[11px] text-tertiary tabular-nums">
          <DigitColumn part="tens" digits={10} />
          <DigitColumn part="units" digits={11} />
          <span className="ms-1 opacity-60">/ {String(total).padStart(2, "0")}</span>
        </p>
        <div className="absolute inset-0">
          {items.map((item) => (
            <span
              key={item.slug}
              data-faint=""
              className="absolute top-1/2 left-1/2 -mt-[15px] -ml-[15px] size-[30px] text-tertiary"
              style={HIDDEN}
            >
              <ProjectIcon slug={item.slug} className="size-full" />
            </span>
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -mt-8 -ml-8 size-16 overflow-hidden rounded-[19px] bg-float shadow-lift dark:shadow-[0_0_0_1px_var(--edge-firm),0_10px_24px_-10px_rgb(0_0_0/0.7)]">
          {items.map((item) => (
            <span
              key={item.slug}
              data-solid=""
              className="absolute top-1/2 left-1/2 -mt-[15px] -ml-[15px] size-[30px] text-primary brightness-[.82] dark:brightness-100"
              style={HIDDEN}
            >
              <ProjectIcon slug={item.slug} className="size-full" />
            </span>
          ))}
        </div>
      </div>
      <div data-textbox="" className="relative overflow-hidden">
        {items.map((item) => (
          <div key={item.slug} data-block="" className="absolute inset-x-0 top-0 px-4 pt-2 pb-4" style={HIDDEN}>
            <MetaLine meta={item.meta} />
            <p className="mt-1 line-clamp-3 text-[13px]/[1.5] text-pretty text-body">{item.description}</p>
            <Tags tags={item.tags} className="mt-2.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* card engine                                                             */
/* ---------------------------------------------------------------------- */

function writeHot(list: HTMLElement, hot: number, mode: "" | "hover" | "open") {
  if (mode && hot >= 0) list.dataset.dim = mode;
  else delete list.dataset.dim;
  const rows = list.children;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as HTMLElement;
    if (i === hot && mode) row.dataset.hot = "";
    else delete row.dataset.hot;
  }
}

/** Soft limit: grows like d at first and never past `max`. */
const rubber = (d: number, max: number) => max * (1 - Math.exp(-d / (max * 5)));

const POSITION = { stiffness: 190, damping: 23 };
const DOCKED = { stiffness: 520, damping: 46 };

class CardEngine {
  private readonly x = new Spring(0, POSITION);
  private readonly y = new Spring(0, POSITION);
  private readonly tilt = new Spring(0, { stiffness: 260, damping: 18 });
  private readonly show = new Spring(0, { stiffness: 520, damping: 34, precision: 0.002 });
  private readonly press = new Spring(0, { stiffness: 700, damping: 42 });
  private readonly reel = new Spring(0, { stiffness: 240, damping: 29, precision: 0.0005 });

  private readonly rows: HTMLElement[];
  private readonly textBox: HTMLElement;
  private readonly blocks: HTMLElement[];
  private readonly solid: HTMLElement[];
  private readonly faint: HTMLElement[];
  private readonly units: HTMLElement | null;
  private readonly tens: HTMLElement | null;
  private readonly observer: ResizeObserver;

  private raf = 0;
  private last = -1;
  private px = 0;
  private py = 0;
  private inside = false;
  private enterAt = 0;
  private hover = -1;
  private open = -1;
  private want = false;
  private reduced = false;

  private heights: number[] = [];
  private chrome = 0;
  private textRight = 0;
  private width = CARD_W;
  private side = true;
  private tx = 0;
  private ty = 0;
  private drawnReel = Number.NaN;
  private drawnHeight = -1;
  private drawnOrigin = "";
  private hidden = true;

  constructor(
    private readonly list: HTMLElement,
    private readonly card: HTMLElement,
  ) {
    this.rows = Array.from(list.children) as HTMLElement[];
    this.textBox = card.querySelector<HTMLElement>("[data-textbox]")!;
    this.blocks = Array.from(card.querySelectorAll<HTMLElement>("[data-block]"));
    this.solid = Array.from(card.querySelectorAll<HTMLElement>("[data-solid]"));
    this.faint = Array.from(card.querySelectorAll<HTMLElement>("[data-faint]"));
    this.units = card.querySelector<HTMLElement>('[data-digits="units"]');
    this.tens = card.querySelector<HTMLElement>('[data-digits="tens"]');

    this.observer = new ResizeObserver(() => this.measure());
    this.blocks.forEach((block) => this.observer.observe(block));
    this.observer.observe(list);

    list.addEventListener("pointermove", this.onMove);
    list.addEventListener("pointerleave", this.onLeave);
    list.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize);
    this.measure();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.observer.disconnect();
    this.list.removeEventListener("pointermove", this.onMove);
    this.list.removeEventListener("pointerleave", this.onLeave);
    this.list.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
    writeHot(this.list, -1, "");
  }

  setReduced(value: boolean) {
    this.reduced = value;
    this.retarget();
    this.wake();
  }

  /** The row opened inline (touch / keyboard), dimmed around when nothing is hovered. */
  setOpen(index: number) {
    this.open = index;
    this.applyHot();
  }

  /** Gone at once (a click is about to navigate away). */
  hideNow() {
    this.inside = false;
    this.want = false;
    this.show.set(0);
    this.applyHot();
    this.write();
  }

  /* ---- input ---- */

  private onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    if (!this.inside) {
      this.inside = true;
      this.enterAt = performance.now();
    }
    this.px = event.clientX;
    this.py = event.clientY;
    const row = (event.target as Element | null)?.closest?.("li[data-index]");
    this.setHover(row && this.list.contains(row) ? this.rows.indexOf(row as HTMLElement) : -1);
    this.retarget();
    this.wake();
  };

  private onLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    this.inside = false;
    this.press.to(0);
    this.wake();
  };

  private onDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    this.press.to(1);
    this.wake();
  };

  private onUp = () => {
    if (this.press.target === 0) return;
    this.press.to(0);
    this.wake();
  };

  /** The page moved under a resting cursor: find the row now under it. */
  private onScroll = () => {
    if (!this.inside) return;
    const under = document.elementFromPoint(this.px, this.py);
    const row = under?.closest("li[data-index]");
    if (!row || !this.list.contains(row)) {
      this.inside = false;
    } else {
      this.setHover(this.rows.indexOf(row as HTMLElement));
      this.retarget();
    }
    this.wake();
  };

  private onResize = () => {
    this.measure();
    this.retarget();
    this.wake();
  };

  private setHover(index: number) {
    if (index === this.hover) return;
    this.hover = index;
    if (index < 0) return;
    // A card that is (nearly) gone starts fresh on the new row; a visible
    // one turns its drum there.
    if (this.show.value < 0.02 || this.reduced) this.reel.set(index);
    else this.reel.to(index);
    if (this.want) this.applyHot();
  }

  private applyHot() {
    if (this.want && this.hover >= 0) writeHot(this.list, this.hover, "hover");
    else writeHot(this.list, this.open, this.open >= 0 ? "open" : "");
  }

  /* ---- layout ---- */

  private measure() {
    this.heights = this.blocks.map((block) => block.offsetHeight);
    this.chrome = this.card.offsetHeight - this.textBox.offsetHeight;
    const listLeft = this.list.getBoundingClientRect().left;
    const range = document.createRange();
    let right = 0;
    this.list.querySelectorAll("[data-row-text]").forEach((node) => {
      range.selectNodeContents(node);
      right = Math.max(right, range.getBoundingClientRect().right - listLeft);
    });
    range.detach();
    this.textRight = right;
    this.drawnHeight = -1;
  }

  private cardHeight(index: number) {
    return this.chrome + (this.heights[index] ?? 0);
  }

  /** Where the card wants to be for the current cursor and row. */
  private retarget() {
    const row = this.rows[this.hover];
    if (!row) return;
    const listRect = this.list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const height = this.cardHeight(this.hover);
    const laneLeft = listRect.left + this.textRight + TEXT_GAP;
    const room = vw - EDGE - laneLeft;

    this.side = room >= CARD_MIN_W;
    const width = this.side ? Math.min(CARD_W, room) : Math.min(CARD_W, listRect.width);
    if (Math.abs(width - this.width) > 0.5) {
      this.width = width;
      this.card.style.width = `${width}px`;
    }

    if (this.side) {
      const wanted = this.px + 22;
      let x = wanted < laneLeft ? laneLeft - rubber(laneLeft - wanted, LEAN) : wanted;
      x = Math.min(x, vw - EDGE - width);
      const anchorY = this.reduced ? rowRect.top + rowRect.height / 2 : this.py;
      this.tx = this.reduced ? laneLeft : x;
      this.ty = clamp(anchorY - height * HANG, EDGE, Math.max(EDGE, vh - EDGE - height));
    } else {
      this.tx = clamp(this.px - width * 0.25, listRect.left, listRect.right - width);
      const below = rowRect.bottom + 8;
      this.ty = below + height > vh - EDGE ? rowRect.top - 8 - height : below;
    }
  }

  /* ---- frame loop ---- */

  private wake() {
    if (this.raf) return;
    this.last = -1;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    const dt = this.last < 0 ? 1 / 60 : Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    const intent = this.inside && this.hover >= 0;
    const want = intent && (now - this.enterAt >= INTENT_MS || this.show.value > 0.05);
    if (want !== this.want) {
      if (want && this.show.value < 0.02) this.spawn();
      this.want = want;
      this.applyHot();
    }
    this.show.to(want ? 1 : 0);

    if (this.reduced) {
      this.x.set(this.tx);
      this.y.set(this.ty);
      this.tilt.set(0);
      this.press.set(0);
      this.reel.set(this.reel.target);
      this.show.configure({ stiffness: 900, damping: 60 });
    } else {
      this.show.configure({ stiffness: 520, damping: 34 });
      // Docked under a row, the card has to clear the next row quickly when
      // the cursor moves onto it, so its vertical spring is stiffer there.
      this.y.configure(this.side ? POSITION : DOCKED);
      this.x.to(this.tx);
      this.y.to(this.ty);
      this.x.step(dt);
      this.y.step(dt);
      // Swing with the card's own sideways speed; the spring adds the settle.
      this.tilt.to(clamp(this.x.velocity * 0.0042, -4.5, 4.5));
      this.tilt.step(dt);
      this.press.step(dt);
      this.reel.step(dt);
    }
    this.show.step(dt);
    this.write();

    const moving =
      !this.show.settled ||
      !this.reel.settled ||
      (this.show.value > 0 && (!this.x.settled || !this.y.settled || !this.tilt.settled || !this.press.settled));
    // While waiting out the hover intent, keep ticking.
    if (moving || (intent && !want)) this.raf = requestAnimationFrame(this.frame);
  };

  /** Appear at the cursor rather than fly in from wherever it last was. */
  private spawn() {
    this.retarget();
    this.reel.set(this.hover);
    this.x.set(this.side && !this.reduced ? this.tx - 14 : this.tx);
    this.y.set(this.ty);
    this.x.to(this.tx);
    this.tilt.set(0);
    this.drawnReel = Number.NaN;
  }

  private write() {
    const card = this.card;
    const s = this.show.value;
    if (s <= 0.002 && this.show.target === 0) {
      if (!this.hidden) {
        this.hidden = true;
        delete card.dataset.live;
        card.style.visibility = "hidden";
        card.style.opacity = "0";
        card.style.filter = "none";
      }
      return;
    }
    if (this.hidden) {
      this.hidden = false;
      card.dataset.live = "";
      card.style.visibility = "visible";
    }

    const reel = this.reel.value;
    const index = clamp(Math.round(reel), 0, this.heights.length - 1);
    const height = this.cardHeight(index);
    const origin = this.side
      ? `0px ${Math.round(height * HANG)}px`
      : `${Math.round(clamp(this.px - this.x.value, 0, this.width))}px 0px`;
    if (origin !== this.drawnOrigin) {
      this.drawnOrigin = origin;
      card.style.transformOrigin = origin;
    }

    const presence = clamp(s, 0, 1.2);
    const scale = this.reduced ? 1 : (0.88 + 0.12 * presence) * (1 - 0.03 * this.press.value);
    const blur = this.reduced ? 0 : (1 - clamp(s)) * 8;
    card.style.transform = `translate3d(${this.x.value.toFixed(2)}px, ${this.y.value.toFixed(2)}px, 0) rotate(${this.tilt.value.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    card.style.opacity = clamp(s * 1.15).toFixed(3);
    card.style.filter = blur > 0.08 ? `blur(${blur.toFixed(2)}px)` : "none";

    if (reel !== this.drawnReel) {
      this.drawnReel = reel;
      this.writeReel(reel);
    }
  }

  /** Drum glyphs, counter digits, text cross-fade and the text box height. */
  private writeReel(reel: number) {
    for (let i = 0; i < this.solid.length; i++) {
      const angle = (i - reel) * STEP;
      const solid = this.solid[i];
      const faint = this.faint[i];
      if (Math.abs(angle) > 1.7) {
        solid.style.visibility = "hidden";
        faint.style.visibility = "hidden";
        continue;
      }
      const c = Math.cos(angle);
      const y = R * Math.sin(angle);
      const size = 0.6 + 0.4 * c;
      const transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${size.toFixed(4)}, ${(size * c).toFixed(4)})`;
      solid.style.visibility = "visible";
      solid.style.transform = transform;
      faint.style.visibility = "visible";
      faint.style.transform = transform;
      faint.style.opacity = (0.6 * c * c).toFixed(3);
    }

    // Odometer: 1-based, the units column carries into the tens one.
    const value = reel + 1;
    const units = value - 10 * Math.floor(value / 10);
    const tens = Math.floor(value / 10) + smoothstep(9, 10, units);
    if (this.units) this.units.style.transform = `translate3d(0, ${(-units * DIGIT_H).toFixed(2)}px, 0)`;
    if (this.tens) this.tens.style.transform = `translate3d(0, ${(-(tens % 10) * DIGIT_H).toFixed(2)}px, 0)`;

    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      const d = i - reel;
      const distance = Math.abs(d);
      if (distance >= 0.999) {
        block.style.visibility = "hidden";
        continue;
      }
      block.style.visibility = "visible";
      // Hand over around the midpoint, so the text never dips to nothing.
      block.style.opacity = (1 - smoothstep(0.25, 0.75, distance)).toFixed(3);
      block.style.transform = `translate3d(0, ${(d * 12).toFixed(2)}px, 0)`;
      block.style.filter = distance > 0.1 ? `blur(${((distance - 0.1) * 5).toFixed(2)}px)` : "none";
    }

    const low = clamp(Math.floor(reel), 0, this.heights.length - 1);
    const high = clamp(low + 1, 0, this.heights.length - 1);
    const height = lerp(this.heights[low] ?? 0, this.heights[high] ?? 0, clamp(reel - low));
    if (Math.abs(height - this.drawnHeight) > 0.05) {
      this.drawnHeight = height;
      this.textBox.style.height = `${height.toFixed(2)}px`;
    }
  }
}
