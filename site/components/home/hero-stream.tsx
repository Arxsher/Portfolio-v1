"use client";

// The home hero, in three beats, all while the page holds still, and all of
// them driven by the scroll position and nothing else: scroll and it moves,
// stop and it stops, scroll back and it runs back. No timers, no playback.
//
//   1. It opens on the short version, centred on the screen: the profile
//      and the first paragraph, with a pulsing dot where the text stops.
//   2. The first stretch of scroll (MOVE of a screen) carries it up to its
//      place under the header (where the hero always sat), nothing else
//      changing.
//   3. From there the scroll writes the rest of the intro after the first
//      paragraph, word by word, the way an assistant streams an answer: the
//      dot rides ahead, and each word comes up out of a blur over the next
//      TRAIL words' worth of scroll. A new paragraph waits a few words'
//      worth before it starts; the action row waits a little longer and
//      comes last.
//
// After the last word there is a short held beat (HOLD of a screen), and
// only then does the pin let go: the hero (and the header, held at the top
// meanwhile, see .header-dock in globals.css) scroll up together,
// uncovering the lab beneath. So the hero can't leave the first screen
// before it is all written and the buttons are there.
//
// Layout: a track as tall as the screen plus the pinned distance (--hero-pin
// in globals.css; what MOVE and HOLD leave of it writes the text), pulled
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

/** Scroll that carries the hero up to its place, in screen heights. */
const MOVE = 0.4;
/** The held beat after the last word, in screen heights. */
const HOLD = 0.15;
/** How many words' worth of scroll a word takes to come into focus. */
const TRAIL = 6;
/** Extra cost of the first unit of a paragraph (a breath) and of the action row. */
const PARAGRAPH_COST = 4;
const ACTIONS_COST = 6;
/** A word starts this blurred (px) and this far below its line (em). */
const BLUR = 12;
const RISE = 0.45;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
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
    const leadOf = paras.map((para) => para.querySelector<HTMLElement>("[data-w]"));
    const caret = content.querySelector<HTMLElement>(".stream-caret");
    const firstHidden = units.findIndex((unit) => unit.hasAttribute("data-hide"));
    const start = firstHidden < 0 ? units.length : firstHidden;
    // the text ends where the action row begins
    const actionsAt = units.findIndex((unit) => unit.hasAttribute("data-actions"));
    const textEnd = actionsAt < 0 ? units.length : actionsAt;

    // Where along the stream each unit starts to appear: a breath before a
    // paragraph, a longer one before the actions.
    const leads = new Set(leadOf);
    const at: number[] = [];
    let total = 0;
    for (let i = start; i < units.length; i++) {
      const unit = units[i];
      total += unit.hasAttribute("data-actions") ? ACTIONS_COST : leads.has(unit) ? PARAGRAPH_COST : 1;
      at.push(total - 1);
    }
    /** The stream's length: the last unit is in focus at the end of it. */
    const length = Math.max(1, total - 1 + TRAIL);
    /** Per streamed unit: 0 hidden, 1 coming into focus, 2 written. */
    const state = new Uint8Array(at.length);

    let visible = -1; // units shown, in reading order
    let forced = false; // written all at once (keyboard, reduced motion)
    let raf = 0;
    let V = 0;
    let pin = 1;
    let width = 0;
    let shortHeight = 0;
    let height = 0;
    let finalTop = 0;

    const clear = (unit: HTMLElement) => {
      unit.style.opacity = "";
      unit.style.filter = "";
      unit.style.transform = "";
    };

    /** Shows the stream written up to `w` (0 → length). True if the layout changed. */
    const write = (w: number) => {
      let count = start;
      for (let k = 0; k < at.length; k++) {
        const unit = units[start + k];
        const p = (w - at[k]) / TRAIL;
        const next = p <= 0 ? 0 : p >= 1 ? 2 : 1;
        if (next !== 0) count = start + k + 1;
        if (next === state[k] && next !== 1) continue;
        if (next === 0) {
          unit.setAttribute("data-hide", "");
          clear(unit);
        } else {
          if (state[k] === 0) unit.removeAttribute("data-hide");
          if (next === 2) clear(unit);
          else {
            const q = (1 - p) ** 2;
            unit.style.opacity = (1 - q).toFixed(3);
            unit.style.filter = `blur(${(BLUR * q).toFixed(2)}px)`;
            unit.style.transform = `translateY(${(RISE * q).toFixed(3)}em)`;
          }
        }
        state[k] = next;
      }
      if (count === visible) return false;
      visible = count;
      paras.forEach((para, i) => {
        const lead = leadOf[i];
        para.toggleAttribute("data-hide", !lead || lead.hasAttribute("data-hide"));
      });
      if (caret) {
        // the dot sits after the newest word, and goes once the text is done
        units[Math.min(visible, textEnd) - 1]?.after(caret);
        caret.toggleAttribute("data-gone", visible > textEnd);
      }
      return true;
    };

    if (reduced.matches) {
      write(length);
      return;
    }

    // Pull the track up under the header, so it starts at the top of the page;
    // where it would have started is where the hero sits once it's in place.
    const pull = () => {
      track.style.marginTop = "0px";
      finalTop = track.getBoundingClientRect().top + window.scrollY;
      track.style.marginTop = `${-finalTop}px`;
    };

    const measure = () => {
      V = box.clientHeight;
      pin = Math.max(1, track.offsetHeight - V);
      width = window.innerWidth;
      write(0);
      shortHeight = content.offsetHeight;
      height = shortHeight;
    };

    const frame = () => {
      raf = 0;
      const s = -track.getBoundingClientRect().top;
      const move = Math.min(pin * 0.5, V * MOVE);
      const hold = Math.min(pin * 0.2, V * HOLD);
      const feed = Math.max(1, pin - move - hold);

      // 3: the stream, as far as the scroll has written it
      const fed = forced ? 1 : clamp((s - move) / feed);
      if (write(fed * length)) height = content.offsetHeight;

      // 1–2: centred, then carried up to its place
      const b = forced ? 1 : clamp(s / move);
      const centred = (V - shortHeight) / 2;
      // rising past its place only to keep the newest words in view
      const top = Math.min(centred + (finalTop - centred) * ease(b), V - height - 28);
      content.style.top = `${top.toFixed(1)}px`;
      if (hint) hint.style.opacity = `${Math.max(0, 1 - b * 3)}`;
      // the scroll effect leaves it alone while it's pinned
      content.toggleAttribute("data-fx-hold", s < pin);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    pull();
    measure();
    content.setAttribute("data-placed", "");
    frame();

    const relayout = () => {
      pull();
      measure();
      schedule();
    };
    // a phone's toolbars sliding away resize the window, not the layout
    const onResize = () => {
      if (window.innerWidth !== width || box.clientHeight !== V) relayout();
      else schedule();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" && !forced) {
        forced = true;
        schedule();
      }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    document.fonts?.ready.then(relayout).catch(() => {});
    const onMotion = () => {
      if (!reduced.matches) return;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      write(length);
      track.style.marginTop = "";
      content.style.top = "";
      content.removeAttribute("data-placed");
      content.removeAttribute("data-fx-hold");
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
