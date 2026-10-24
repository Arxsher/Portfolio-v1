"use client";

// The scroll feel, everywhere, after olek.si's deck of sections: every block
// of the page is sharp at the middle of the screen and, as it moves away,
// tilts back about the screen's middle line, blurs and fades, with his
// numbers. For a block, h is its distance from the middle of the screen in
// screen heights (0 while it covers the middle, from its nearest edge
// otherwise), and then
//
//   opacity    1 − |h| / 1.1
//   blur       48 · max(0, |h| − 0.15)²   (at most 56px)
//   transform  perspective(512px) rotateX(−5° · h), about the middle line
//
// A block that can never reach the middle (the header, near the top of the
// page; the footer at the bottom) is measured from the closest it can get,
// so it's sharp at rest and the effect starts once it moves away. A block
// that pins its content (the home hero and lab) marks the part that moves
// with `data-fx-target`; that part is used instead, as it is, and is left
// alone while it carries `data-fx-hold`. `data-fx="off"` opts out.
//
// Blur is the costly part: if frames run slower than 45 fps for a while it
// is dropped (the tilt and the fade stay), like olek's battery saver.
// Reduced motion: nothing at all.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PERSPECTIVE = 512;
const TILT = 5;
const SLOW_MS = 1000 / 45;
const SLOW_FOR = 1.2;

const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);
const content = (el: Element) => Array.from(el.children).filter((child) => !SKIP.has(child.tagName));

type Target = { el: HTMLElement; pinned: boolean; header: boolean };

function collectTargets(): Target[] {
  const out: Target[] = [];
  const header = document.querySelector<HTMLElement>(".site-column header");
  if (header) out.push({ el: header, pinned: false, header: true });
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
      const pinned = child.matches("[data-fx-target]") ? child : child.querySelector<HTMLElement>("[data-fx-target]");
      out.push({ el: pinned ?? child, pinned: !!pinned, header: false });
    }
  }
  const footer = document.querySelector<HTMLElement>(".site-column > footer");
  if (footer) out.push({ el: footer, pinned: false, header: false });
  return out.filter(({ el }) => el.dataset.fx !== "off" && !el.closest("[data-fx='off']"));
}

/** Distance (screen heights) of [top, bottom] from the middle of a V-tall screen; 0 while it covers it. */
const distance = (top: number, bottom: number, V: number) =>
  (Math.min(Math.max(V / 2, top), bottom) - V / 2) / V;

export function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    let targets: Target[] = [];
    let raf = 0;
    let lastFrame = 0;
    let avg = 1000 / 60;
    let slowFor = 0;
    let blurOff = false;
    /** The header's top with the page at rest (it may be held in place by a pinned hero). */
    let headerRest = 0;
    const touched = new Set<HTMLElement>();

    const reset = (el: HTMLElement) => {
      if (!touched.has(el)) return;
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.filter = "";
      el.style.opacity = "";
      el.style.willChange = "";
      touched.delete(el);
    };

    const collect = () => {
      const next = collectTargets();
      for (const t of targets) if (!next.some((n) => n.el === t.el)) reset(t.el);
      targets = next;
      // the header rests at the top of the column, under its padding
      const column = document.querySelector<HTMLElement>(".site-column");
      if (column) {
        headerRest = column.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(column).paddingTop || "0");
      }
    };

    const render = (now: number) => {
      raf = 0;
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
      const s = window.scrollY;
      const sMax = Math.max(0, (document.scrollingElement?.scrollHeight ?? 0) - V);
      // read everything, then write
      const boxes = targets.map((t) => t.el.getBoundingClientRect());
      targets.forEach((t, i) => {
        const { top: T, bottom: B, height } = boxes[i];
        if (height === 0 || t.el.hasAttribute("data-fx-hold")) return reset(t.el);
        let h: number;
        if (t.header) {
          // only once it moves up from where it rests (the home hero holds it a while)
          h = Math.min(0, (T - headerRest) / V);
        } else {
          const now = distance(T, B, V);
          if (t.pinned) h = now;
          else {
            // the closest to the middle this block can ever get
            const top0 = T + s;
            const bottom0 = B + s;
            const atTop = distance(top0, bottom0, V);
            const atEnd = distance(top0 - sMax, bottom0 - sMax, V);
            const best = Math.min(Math.max(0, atEnd), atTop);
            h = now - best;
          }
        }
        const a = Math.abs(h);
        if (a < 0.001) return reset(t.el);
        touched.add(t.el);
        t.el.style.transformOrigin = `50% ${(V / 2 - T).toFixed(1)}px`;
        t.el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${(-TILT * h).toFixed(3)}deg)`;
        const blur = blurOff ? 0 : Math.min(56, 48 * Math.max(0, a - 0.15) ** 2);
        t.el.style.filter = blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : "";
        t.el.style.opacity = Math.max(0, 1 - a / 1.1).toFixed(3);
        t.el.style.willChange = "transform, opacity, filter";
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onResize = () => {
      collect();
      schedule();
    };

    // the page renders its blocks a moment after navigation
    const settle = requestAnimationFrame(onResize);
    const later = window.setTimeout(onResize, 500);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    const onMotion = () => {
      if (!reduced.matches) return;
      targets.forEach((t) => reset(t.el));
      targets = [];
    };
    reduced.addEventListener("change", onMotion);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(settle);
      window.clearTimeout(later);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      reduced.removeEventListener("change", onMotion);
      targets.forEach((t) => reset(t.el));
    };
  }, [pathname]);

  return null;
}
