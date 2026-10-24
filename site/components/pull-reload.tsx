"use client";

// Pull to reload, on touch screens: at the very top of a page, dragging down
// pulls the page with it. The screen dims, a glow gathers at the top and a
// blurred ring of spectrum rises from the bottom edge, shrinking and coming
// into focus as you pull, while the hero tilts back under your finger.
// Past THRESHOLD a haptic tick says it will reload; let go there and the
// ring bursts in a flash, the page's blocks fall back into the distance in
// a blur, and the page reloads. Let go before it and everything springs
// back. (After the pull to refresh on olek.si.)
//
// The gesture only starts at scrollY 0, on a single finger moving down, and
// not inside anything that handles touches itself (a lab stage, a dialog, a
// form field, anything with touch-action: none); it calls preventDefault on
// those moves, which also keeps the browser's own pull to refresh and
// rubber band out of it. Not while the first-load intro plays.

import { useEffect, useRef } from "react";
import { haptic } from "@/lib/haptics";

/** Pull (0…1, past the knee) at which letting go reloads. */
const THRESHOLD = 0.42;
const BOOM_MS = 760;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Elements that handle touches themselves. */
function ownsTouch(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  if (el?.closest("input, textarea, select, [role='dialog'], dialog, [data-no-pull], canvas")) return true;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if (style.touchAction === "none") return true;
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 2) return true;
    el = el.parentElement;
  }
  return false;
}

export function PullReload() {
  const layerRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) return;
    const layer = layerRef.current;
    const shade = shadeRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!layer || !shade || !ring || !glow) return;
    const root = document.documentElement;
    const column = () => document.querySelector<HTMLElement>(".site-column");
    const tilted = () => Array.from(document.querySelectorAll<HTMLElement>("[data-stream]"));

    let startY: number | null = null;
    let pulling = false;
    let amount = 0;
    let armed = false;
    let busy = false;
    let raf = 0;

    const render = () => {
      raf = 0;
      const u = clamp(amount, 0, 1.15);
      const k = clamp(u);
      layer.style.display = u > 0 ? "block" : "none";
      shade.style.opacity = `${Math.min(0.32, Math.max(0, k - 0.1) * 0.45)}`;
      const vh = window.innerHeight;
      ring.style.opacity = `${Math.min(1, k * 1.4)}`;
      ring.style.transform = `translate(-50%, -50%) translateY(${(-vh * 0.42 * k).toFixed(1)}px) scale(${(1.25 - 0.5 * k).toFixed(3)})`;
      ring.style.filter = `blur(${(48 - 40 * k).toFixed(1)}px) saturate(1.35)`;
      glow.style.opacity = `${k}`;
      glow.style.transform = `scaleY(${(0.25 + 0.75 * k).toFixed(3)})`;
      const col = column();
      if (col) col.style.transform = u > 0 ? `translateY(${(u * 64).toFixed(1)}px)` : "";
      for (const el of tilted()) {
        el.style.transformOrigin = "50% 100%";
        el.style.rotate = u > 0 ? `x ${(-32 * k).toFixed(2)}deg` : "";
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const settle = () => {
      // spring back from where it is
      const from = amount;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = clamp((now - t0) / 320);
        const ease = 1 - (1 - t) ** 3;
        amount = from * (1 - ease);
        render();
        if (t < 1) requestAnimationFrame(tick);
        else {
          amount = 0;
          render();
          const col = column();
          if (col) col.style.transform = "";
        }
      };
      requestAnimationFrame(tick);
    };

    const boom = () => {
      busy = true;
      const easing = "cubic-bezier(0.4, 0, 0, 1)";
      ring.animate(
        [
          { opacity: 1, filter: "blur(8px) saturate(1.35) brightness(1)" },
          { opacity: 0, transform: `${ring.style.transform} scale(2.6)`, filter: "blur(64px) saturate(1.6) brightness(3)" },
        ],
        { duration: BOOM_MS, easing, fill: "forwards" },
      );
      glow.animate([{ opacity: 1 }, { opacity: 0, transform: "scaleY(1.6)" }], { duration: BOOM_MS, easing, fill: "forwards" });
      shade.animate([{}, { opacity: 0.45 }], { duration: BOOM_MS, easing, fill: "forwards" });
      // the page falls back into the distance, block by block
      const main = document.getElementById("main");
      const blocks = [
        document.querySelector(".site-column > header"),
        ...(main ? Array.from(main.querySelectorAll(":scope > * > *, :scope > *")).slice(0, 12) : []),
      ].filter((el): el is Element => !!el);
      blocks.forEach((el, i) => {
        el.animate([{ opacity: 0, transform: "perspective(900px) rotateX(45deg) translateY(-16px)", filter: "blur(24px)" }], {
          duration: BOOM_MS,
          delay: i * 35,
          easing: "cubic-bezier(0, 0.2, 0, 1)",
          fill: "forwards",
        });
      });
      window.setTimeout(() => location.reload(), BOOM_MS - 120);
    };

    const onStart = (event: TouchEvent) => {
      startY = null;
      pulling = false;
      if (busy || event.touches.length !== 1 || window.scrollY > 0) return;
      if (root.hasAttribute("data-star-intro") || root.hasAttribute("data-intro-veil")) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (ownsTouch(event.target)) return;
      startY = event.touches[0].clientY;
      armed = false;
    };

    const onMove = (event: TouchEvent) => {
      if (startY === null || busy) return;
      const dy = event.touches[0].clientY - startY;
      if (!pulling) {
        if (dy > 6 && window.scrollY <= 0) pulling = true;
        else if (dy < -6) {
          startY = null;
          return;
        } else return;
      }
      if (event.cancelable) event.preventDefault();
      // a soft knee: the pull gets heavier the further it goes
      const x = Math.max(0, dy - 6) / (window.innerHeight * 0.34);
      amount = 1.15 * (1 - Math.exp(-x / 1.15));
      const past = amount >= THRESHOLD;
      if (past !== armed) {
        armed = past;
        if (past) haptic();
      }
      schedule();
    };

    const onEnd = () => {
      if (startY === null) return;
      startY = null;
      if (!pulling) return;
      pulling = false;
      if (amount >= THRESHOLD) boom();
      else settle();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] hidden overflow-hidden">
      <div ref={shadeRef} className="absolute inset-0 bg-black opacity-0" />
      <div
        ref={glowRef}
        className="absolute inset-x-0 top-0 h-32 origin-top opacity-0 [background:linear-gradient(color-mix(in_oklab,var(--foreground)_22%,transparent),transparent)]"
      />
      <div
        ref={ringRef}
        className="absolute top-full left-1/2 aspect-square w-[130vw] rounded-full opacity-0 [background:conic-gradient(from_200deg,#ff3b3b,#ff8a1f,#ffd23f,#3ddc84,#3aa0ff,#b65cff,#ff3b3b)] [mask:radial-gradient(closest-side,transparent_62%,#000_67%,#000_82%,transparent_87%)] [-webkit-mask:radial-gradient(closest-side,transparent_62%,#000_67%,#000_82%,transparent_87%)]"
      />
    </div>
  );
}
