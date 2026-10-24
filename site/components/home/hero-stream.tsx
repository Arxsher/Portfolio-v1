"use client";

// The home hero, streamed in by scrolling.
//
// The page opens on a short version in the middle of the screen: the
// profile and the first paragraph, with a pulsing dot where the text stops.
// Scrolling doesn't move it; it writes the rest of the intro in, word by
// word, the way an assistant streams an answer (each unit fades up out of a
// blur as it lands, the dot riding ahead of it), until the whole intro and
// the action row are there. Then the pin lets go and the section scrolls up
// into its place, uncovering the lab beneath.
//
// Layout: a track as tall as the screen plus the streaming distance,
// pulled up under the header so it starts at the top of the page; in it a
// sticky, screen-tall box (it ignores the pointer, so the header stays
// clickable) holding the content. The content sits where the short version
// is centred, and only rises if the text grows past the bottom of the
// screen, keeping the newest words in view.
//
// The units are the `data-w` elements of components/home/intro.tsx in
// reading order; those past the frontier have `data-hide` (display: none,
// see globals.css). Paragraphs and the action row show once their first
// unit does. Keyboard focus moving into the page completes the stream.
// Reduced motion (and no JavaScript): the whole intro, no pin.

import { useEffect, useRef, type ReactNode } from "react";

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
    /** Units shown from the start (the first paragraph). */
    const first = units.findIndex((unit) => unit.hasAttribute("data-hide"));
    const start = first < 0 ? units.length : first;
    let shown = start;
    let done = false;
    let raf = 0;
    /** Height of the short version, for centring it. */
    let shortHeight = 0;

    const setShown = (count: number, animate: boolean) => {
      count = Math.max(start, Math.min(units.length, count));
      if (count === shown) return;
      if (count > shown) {
        for (let i = shown; i < count; i++) {
          const unit = units[i];
          unit.removeAttribute("data-hide");
          if (animate) {
            unit.removeAttribute("data-in");
            // restart the arrival for a unit shown again
            void unit.offsetWidth;
            unit.setAttribute("data-in", "");
          }
        }
      } else {
        for (let i = count; i < shown; i++) units[i].setAttribute("data-hide", "");
      }
      shown = count;
      // a paragraph shows once its first unit does
      for (const para of paras) {
        const lead = para.querySelector("[data-w]");
        if (lead && !lead.hasAttribute("data-hide")) para.removeAttribute("data-hide");
        else para.setAttribute("data-hide", "");
      }
      // the dot rides after the last word shown, inside the text
      const last = units[shown - 1];
      done = shown >= units.length;
      if (caret) {
        if (!done && last && !last.hasAttribute("data-actions")) last.after(caret);
        caret.toggleAttribute("data-gone", done);
      }
    };

    const reveal = () => setShown(units.length, false);

    if (reduced.matches) {
      reveal();
      return;
    }

    // Pull the track up under the header, so it starts at the top of the page.
    const pull = () => {
      track.style.marginTop = "0px";
      const top = track.getBoundingClientRect().top + window.scrollY;
      track.style.marginTop = `${-top}px`;
    };

    const measure = () => {
      // the short version's height, read with everything past it hidden
      const keep = shown;
      setShown(start, false);
      shortHeight = content.offsetHeight;
      setShown(keep, false);
    };

    const render = () => {
      raf = 0;
      const V = box.clientHeight;
      const streamLength = Math.max(1, track.offsetHeight - V);
      const p = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / streamLength));
      setShown(start + Math.round(p * (units.length - start)), true);
      // centred while short; rising only to keep the newest words in view
      const h = content.offsetHeight;
      const centred = (V - shortHeight) / 2;
      const top = Math.min(centred, V - h - 28);
      content.style.top = `${top.toFixed(1)}px`;
      if (hint) hint.style.opacity = `${Math.max(0, 1 - p * 6)}`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    // take over from the CSS centring, in place
    pull();
    measure();
    content.setAttribute("data-placed", "");
    render();

    const onResize = () => {
      pull();
      measure();
      schedule();
    };
    // Tabbing into the page: show it all (hidden links can't take focus).
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" && !done) reveal();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    const fonts = document.fonts;
    fonts?.ready.then(onResize).catch(() => {});
    const onMotion = () => {
      if (!reduced.matches) return;
      reveal();
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
