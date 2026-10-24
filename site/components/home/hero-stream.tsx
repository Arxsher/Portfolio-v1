"use client";

// The home hero, in three beats, all while the page holds still:
//
//   1. It opens on the short version, centred on the screen: the profile
//      and the first paragraph, with a pulsing dot where the text stops.
//   2. The first scroll carries it up to its place under the header (where
//      the hero always sat), nothing else changing.
//   3. Once it's there, the rest of the intro is written in after the first
//      paragraph, word by word, the way an assistant streams an answer: each
//      word rises out of a blur as it lands, the dot riding ahead, with a
//      breath between paragraphs, and the action row last. Scrolling feeds
//      the stream, but it never runs faster than RATE, so it stays readable
//      however hard you scroll; if you scroll on before it's done, it
//      finishes as the hero moves away.
//
// Then the pin lets go and the hero (and the header, held at the top
// meanwhile, see .header-dock in globals.css) scroll up together,
// uncovering the lab beneath.
//
// Layout: a track as tall as the screen plus the pinned distance, pulled
// up under the header so it starts at the top of the page; in it a sticky,
// screen-tall box (it ignores the pointer, so the header stays clickable)
// holding the content, which the script positions with `top`.
//
// The units are the `data-w` elements of components/home/intro.tsx in
// reading order; those not yet written have `data-hide` (display: none,
// see globals.css). Paragraphs show with their first unit. Tabbing into
// the page writes it all at once (hidden links can't take focus). Opening
// the page already scrolled past the hero shows it whole.
// Reduced motion (and no JavaScript): the whole intro, no pin.

import { useEffect, useRef, type ReactNode } from "react";

/** The pinned distance is split: carrying the hero up, then the stream. */
const MOVE_SHARE = 0.28;
/** Of the stream's distance, the part that feeds it (the rest is a held beat). */
const FEED_SHARE = 0.78;
/** The fastest the text is written, in units (words, links, chips) per second. */
const RATE = 11;
/** Extra cost of the first unit of a paragraph (a breath) and of the action row. */
const PARAGRAPH_COST = 4;
const ACTIONS_COST = 6;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function HeroStream({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const box = boxRef.current;
    const content = contentRef.current;
    const hint = hintRef.current;
    if (!track || !box || !content) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    const units = Array.from(content.querySelectorAll<HTMLElement>("[data-w]"));
    const paras = Array.from(content.querySelectorAll<HTMLElement>("[data-para]"));
    const caret = content.querySelector<HTMLElement>(".stream-caret");
    const firstHidden = units.findIndex((unit) => unit.hasAttribute("data-hide"));
    const start = firstHidden < 0 ? units.length : firstHidden;

    // what each unit costs to write: a breath before a paragraph, a longer one before the actions
    const leads = new Set(paras.map((para) => para.querySelector("[data-w]")));
    const cumulative: number[] = [];
    let total = 0;
    for (let i = start; i < units.length; i++) {
      const unit = units[i];
      total += unit.hasAttribute("data-actions") ? ACTIONS_COST : leads.has(unit) ? PARAGRAPH_COST : 1;
      cumulative.push(total);
    }

    let shown = start;
    let written = 0; // cost written so far
    let started = false;
    let raf = 0;
    let last = 0;
    let shortHeight = 0;
    let finalTop = 0;

    const setShown = (count: number, animate: boolean) => {
      count = Math.max(start, Math.min(units.length, count));
      if (count === shown) return;
      if (count > shown) {
        for (let i = shown; i < count; i++) {
          const unit = units[i];
          unit.removeAttribute("data-hide");
          if (animate) unit.setAttribute("data-in", "");
        }
      } else {
        for (let i = count; i < shown; i++) {
          units[i].setAttribute("data-hide", "");
          units[i].removeAttribute("data-in");
        }
      }
      shown = count;
      for (const para of paras) {
        const lead = para.querySelector("[data-w]");
        if (lead && !lead.hasAttribute("data-hide")) para.removeAttribute("data-hide");
        else para.setAttribute("data-hide", "");
      }
      const lastUnit = units[shown - 1];
      const done = shown >= units.length;
      if (caret) {
        if (!done && lastUnit && !lastUnit.hasAttribute("data-actions")) lastUnit.after(caret);
        caret.toggleAttribute("data-gone", done);
      }
    };

    const writeAll = () => {
      started = true;
      written = total;
      setShown(units.length, false);
    };

    if (reduced.matches) {
      writeAll();
      return;
    }

    /** The pinned distances (px): carrying it up, then the stream. */
    const distances = () => {
      const pin = Math.max(1, track.offsetHeight - box.clientHeight);
      const move = pin * MOVE_SHARE;
      return { pin, move, feed: (pin - move) * FEED_SHARE };
    };

    // Pull the track up under the header, so it starts at the top of the page;
    // where it would have started is where the hero sits once it's in place.
    const pull = () => {
      track.style.marginTop = "0px";
      finalTop = track.getBoundingClientRect().top + window.scrollY;
      track.style.marginTop = `${-finalTop}px`;
    };

    const measure = () => {
      const keep = shown;
      setShown(start, false);
      shortHeight = content.offsetHeight;
      setShown(keep, false);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const V = box.clientHeight;
      const { pin, move, feed } = distances();
      const s = -track.getBoundingClientRect().top;

      // 1–2: centred, then carried up to its place
      const centred = (V - shortHeight) / 2;
      let top: number;
      if (!started) {
        const b = Math.min(1, Math.max(0, s / move));
        top = centred + (finalTop - centred) * ease(b);
        if (b >= 1) started = true;
        if (hint) hint.style.opacity = `${Math.max(0, 1 - b * 3)}`;
      } else {
        top = finalTop;
        if (hint) hint.style.opacity = "0";
      }

      // 3: the stream, fed by the scroll, never faster than RATE
      let streaming = false;
      if (started) {
        const fed = Math.min(1, Math.max(0, (s - move) / feed));
        const goal = s >= pin ? total : fed * total;
        if (goal > written) {
          written = Math.min(goal, written + RATE * dt);
          streaming = written < goal;
        }
        let count = start;
        while (count - start < cumulative.length && cumulative[count - start] <= written + 1e-6) count++;
        setShown(count, true);
      }

      // rise only to keep the newest words in view
      const h = content.offsetHeight;
      top = Math.min(top, V - h - 28);
      content.style.top = `${top.toFixed(1)}px`;
      // the scroll effect leaves it alone while it's pinned
      content.toggleAttribute("data-fx-hold", s < pin);

      if (streaming) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    pull();
    measure();
    // opened already past the hero (a reload, a link to #work): show it whole
    if (window.scrollY > distances().move) writeAll();
    content.setAttribute("data-placed", "");
    frame(performance.now());

    const onResize = () => {
      pull();
      measure();
      schedule();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" && shown < units.length) {
        writeAll();
        schedule();
      }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    document.fonts?.ready.then(onResize).catch(() => {});
    const onMotion = () => {
      if (!reduced.matches) return;
      writeAll();
      track.style.marginTop = "";
      content.style.top = "";
      content.removeAttribute("data-placed");
    };
    reduced.addEventListener("change", onMotion);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      reduced.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <div ref={trackRef} className="hero-track relative">
      <div ref={boxRef} className="hero-box pointer-events-none sticky top-0 h-[100svh]">
        <div ref={contentRef} data-fx-target="" data-stream="" className="hero-content pointer-events-auto absolute inset-x-0">
          {children}
        </div>
        <div
          ref={hintRef}
          aria-hidden="true"
          className="hero-hint absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 text-[12px] text-tertiary"
        >
          <span>Scroll</span>
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none" className="motion-safe:animate-[hint-bob_1.6s_ease-in-out_infinite]">
            <path d="M1 1.5 11 8.5 21 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
