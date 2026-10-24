"use client";

// The scroll feel, everywhere: blocks of the page tilt back about the
// screen's middle line, blur and fade as they leave at the top or arrive at
// the bottom, and are sharp and flat while they cover the middle (the deck of
// sections on olek.si, on a page that scrolls normally).
//
// For each block, with T and B its top and bottom on screen, V the screen
// height and R a quarter of it:
//   arriving  e = min(B - V, T - (V - R)) / R   (its top in the bottom quarter)
//   leaving   e = min(-T, R - B) / R            (its bottom in the top quarter)
// (each clamped to 0…1.4), so a block entirely on screen, or one covering the
// middle, is untouched, and a block at the very top of the page isn't
// touched until it actually starts to leave. Then
//   rotateX(−6° · e)  about the screen's middle line, in perspective
//   blur(9px · e^1.6) opacity(1 − 0.55 · e^1.2)
//
// The blocks: the header, the page's own blocks (main's children, looking
// through single wrappers) and the footer. A block that pins its content
// (the home hero and lab) marks the part that moves with `data-fx-target`,
// and that part is used instead. `data-fx="off"` opts a block out.
//
// Blur is the costly part: if frames run slower than 45 fps for a while
// it is dropped (the tilt and fade stay). Reduced motion: nothing at all.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TILT = 6;
const BLUR = 9;
const FADE = 0.55;
/** Frames slower than this (ms, smoothed) for SLOW_FOR seconds: no more blur. */
const SLOW_MS = 1000 / 45;
const SLOW_FOR = 1.2;

const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);
const content = (el: Element) => Array.from(el.children).filter((child) => !SKIP.has(child.tagName));

/** The page's blocks: main's children, through the single wrappers around them. */
function blocks(): HTMLElement[] {
  const out: HTMLElement[] = [];
  const header = document.querySelector<HTMLElement>(".site-column > header");
  if (header) out.push(header);
  const main = document.getElementById("main");
  if (main) {
    let box: Element = main;
    for (let depth = 0; depth < 3; depth++) {
      const kids = content(box);
      if (kids.length !== 1) break;
      box = kids[0];
    }
    for (const child of content(box)) {
      if (!(child instanceof HTMLElement)) continue;
      const target = child.matches("[data-fx-target]") ? child : child.querySelector<HTMLElement>("[data-fx-target]");
      out.push(target ?? child);
    }
  }
  const footer = document.querySelector<HTMLElement>(".site-column > footer");
  if (footer) out.push(footer);
  return out.filter((el) => el.dataset.fx !== "off" && !el.closest("[data-fx='off']"));
}

export function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    let targets: HTMLElement[] = [];
    let raf = 0;
    let lastFrame = 0;
    let avg = 1000 / 60;
    let slowFor = 0;
    let blurOff = false;
    const touched = new Set<HTMLElement>();

    const collect = () => {
      const next = blocks();
      for (const el of targets) if (!next.includes(el)) reset(el);
      targets = next;
    };

    const reset = (el: HTMLElement) => {
      if (!touched.has(el)) return;
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.filter = "";
      el.style.opacity = "";
      el.style.willChange = "";
      touched.delete(el);
    };

    const render = (now: number) => {
      raf = 0;
      // frame pacing, for the blur cut-off
      if (lastFrame) {
        const dt = now - lastFrame;
        if (dt < 200) {
          avg += (dt - avg) * 0.1;
          slowFor = avg > SLOW_MS ? slowFor + dt / 1000 : 0;
          if (slowFor > SLOW_FOR) blurOff = true;
        }
      }
      lastFrame = now;

      const V = window.innerHeight;
      const R = V / 4;
      // read everything, then write
      const boxes = targets.map((el) => el.getBoundingClientRect());
      targets.forEach((el, i) => {
        const { top: T, bottom: B, height } = boxes[i];
        if (height === 0) return reset(el);
        const arriving = Math.min(B - V, T - (V - R)) / R;
        const leaving = Math.min(-T, R - B) / R;
        let e = 0;
        if (arriving > 0) e = Math.min(1.4, arriving);
        else if (leaving > 0) e = -Math.min(1.4, leaving);
        if (Math.abs(e) < 0.002) return reset(el);
        const a = Math.abs(e);
        touched.add(el);
        el.style.transformOrigin = `50% ${(V / 2 - T).toFixed(1)}px`;
        el.style.transform = `perspective(1200px) rotateX(${(-TILT * e).toFixed(3)}deg)`;
        const blur = blurOff ? 0 : BLUR * a ** 1.6;
        el.style.filter = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : "";
        el.style.opacity = (1 - FADE * Math.min(1, a) ** 1.2).toFixed(3);
        el.style.willChange = "transform, opacity, filter";
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onScroll = () => schedule();
    const onResize = () => {
      collect();
      schedule();
    };

    // the page renders its blocks a moment after navigation
    const settle = requestAnimationFrame(() => {
      collect();
      schedule();
    });
    const later = window.setTimeout(onResize, 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const onMotion = () => {
      if (reduced.matches) {
        targets.forEach(reset);
        targets = [];
      }
    };
    reduced.addEventListener("change", onMotion);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(settle);
      window.clearTimeout(later);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      reduced.removeEventListener("change", onMotion);
      targets.forEach(reset);
    };
  }, [pathname]);

  return null;
}
