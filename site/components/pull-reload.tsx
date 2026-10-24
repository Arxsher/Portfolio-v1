"use client";

// Pull to reload, on touch screens, after olek.si's pull to refresh. At the
// very top of a page, dragging down pulls the page with it (a rubber band),
// and with the pull, u (0 → THRESHOLD and on):
//
//   - the screen dims (up to 30%);
//   - an orb of spectrum (a disc inside a thick transparent border),
//     blurred far past recognition and brightened 5×, rises from the bottom
//     edge in a wide dark halo, shrinking and coming into focus: by the
//     threshold it has reached the top;
//   - a white glow gathers there, brighter and tighter, and a band of the
//     page's own colour grows down from the top edge;
//   - the hero's lines tip back (up to 45°, in perspective) and drop, as if
//     pulled.
//
// Past the threshold a haptic tick says it will reload. Let go there and
// it goes off: the glow bursts into a white ring that flies out, the
// spectrum falls away, the page's blocks fall back into the distance in a
// blur, and the page reloads. Let go before and it all springs back.
//
// The gesture only starts at scrollY 0, on one finger moving down, and not
// inside anything that handles touches itself (a lab stage, a dialog, a form
// field, a scrolling panel, anything with touch-action: none); it calls
// preventDefault on those moves, which keeps the browser's own pull to
// refresh and rubber band out of it. Not while the first-load intro plays.

import { useEffect, useRef } from "react";
import { haptic } from "@/lib/haptics";

/** Pull progress at which letting go reloads. */
const THRESHOLD = 0.4;
/** Progress per screen height of finger travel (the threshold at about 0.42 of the screen). */
const RATE = 0.95;
const BOOM_MS = 800;
const GLOW = 384;
const SPECTRUM =
  "radial-gradient(150% 100% at 50% 0%, color(display-p3 1 0.2 0.2), color(display-p3 1 0.2 0.2), color(display-p3 1 0.45 0.1), color(display-p3 1 0.8 0.2), color(display-p3 0.2 0.9 0.4), color(display-p3 0.2 0.6 1), color(display-p3 0.8 0.3 0.9), color(display-p3 0.8 0.3 0.9))";

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
  const ringShadowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const glowShadowRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) return;
    const layer = layerRef.current;
    const shade = shadeRef.current;
    const ringShadow = ringShadowRef.current;
    const ring = ringRef.current;
    const spectrum = spectrumRef.current;
    const glowShadow = glowShadowRef.current;
    const glow = glowRef.current;
    const band = bandRef.current;
    if (!layer || !shade || !ringShadow || !ring || !spectrum || !glowShadow || !glow || !band) return;
    const root = document.documentElement;
    const column = () => document.querySelector<HTMLElement>(".site-column");
    /** The hero's lines: the profile, each paragraph, the action row. */
    const lines = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-stream] > section:first-child, [data-stream] [data-para], [data-stream] [data-actions]",
        ),
      );

    let startY: number | null = null;
    let pulling = false;
    let progress = 0;
    let drag = 0;
    let armed = false;
    let busy = false;
    let raf = 0;
    let metrics = { size: 0, maxBlur: 0, rise: 0, border: 0 };

    const size = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // the spectrum's centre reaches the top edge right at the threshold
      metrics = { size: w * 1.2, maxBlur: h * 0.1, rise: h / THRESHOLD, border: h * 0.15 };
      for (const el of [ring, ringShadow]) {
        el.style.width = el.style.height = `${metrics.size}px`;
      }
      // the spectrum fills only the inside of the ring's border: a compact orb
      ring.style.borderWidth = `${metrics.border}px`;
    };

    const render = () => {
      raf = 0;
      const u = clamp(progress, 0, 1);
      const on = progress > 0;
      layer.style.display = on ? "block" : "none";
      const { size: S, maxBlur } = metrics;
      const minSize = window.innerWidth * 0.7;
      const scale = 1 - (1 - minSize / S) * u;
      const blur = maxBlur - (maxBlur - 20) * u;
      const rise = -metrics.rise * clamp(u, 0, 1.2);
      const light = Math.min(1, u * 1.6);
      ringShadow.style.transform = `translate(-50%, calc(-50% + ${rise.toFixed(1)}px)) scale(${(scale * 1.5).toFixed(3)})`;
      ringShadow.style.opacity = `${Math.min(1, light * 1.5)}`;
      ring.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      ring.style.opacity = `${light}`;
      spectrum.style.filter = `blur(${blur.toFixed(1)}px) brightness(5)`;
      spectrum.style.transform = `translateY(${rise.toFixed(1)}px)`;
      glowShadow.style.transform = `translate(-50%, -50%) scale(${(1 - u).toFixed(3)})`;
      glowShadow.style.opacity = `${Math.min(1, u * 1.2)}`;
      glow.style.transform = `translate(-50%, -50%) scale(${(1 - u).toFixed(3)})`;
      glow.style.filter = `blur(64px) brightness(${(1 + u * 4).toFixed(2)})`;
      glow.style.opacity = `${Math.min(1, u * 3)}`;
      shade.style.opacity = `${Math.min(0.3, Math.max(0, u - 0.2) / 2)}`;
      band.style.transform = `scaleY(${((32 + u * 96) / 128).toFixed(3)})`;
      band.style.opacity = `${Math.min(1, u * 4)}`;
      // the page comes down with the finger, damped like a rubber band
      const col = column();
      if (col) {
        const x = drag / window.innerHeight;
        const pull = window.innerHeight * 0.5 * (1 - 1 / (x + 1));
        col.style.transform = on ? `translateY(${pull.toFixed(1)}px)` : "";
      }
      // the hero's lines tip back and drop
      for (const el of lines()) {
        const tip = clamp(u / 0.7);
        el.style.transform = on
          ? `perspective(600px) rotateX(${(-45 * tip).toFixed(2)}deg) translateY(${(32 * tip).toFixed(1)}px)`
          : "";
        el.style.transformOrigin = "50% 100%";
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const settle = () => {
      const fromP = progress;
      const fromD = drag;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = clamp((now - t0) / 380);
        const k = 1 - (1 - t) ** 3;
        progress = fromP * (1 - k);
        drag = fromD * (1 - k);
        render();
        if (t < 1) requestAnimationFrame(tick);
        else {
          progress = 0;
          drag = 0;
          render();
        }
      };
      requestAnimationFrame(tick);
    };

    const boom = () => {
      busy = true;
      const easing = "cubic-bezier(0.4, 0, 0, 1)";
      const options = { duration: BOOM_MS, easing, fill: "forwards" as const };
      // the glow becomes a white ring and flies out
      glow.style.background = "transparent";
      glow.style.boxShadow = "inset 0 0 0 32px white";
      glowShadow.style.background = "transparent";
      glowShadow.style.boxShadow = "inset 0 0 0 96px black";
      glow.animate(
        [
          { opacity: 1, filter: "blur(64px) brightness(10)" },
          { opacity: 0, transform: "translate(-50%, -50%) scale(3)", filter: "blur(96px) brightness(1)" },
        ],
        options,
      );
      glowShadow.animate([{}, { opacity: 0, transform: "translate(-50%, -50%) scale(3)" }], options);
      ring.animate([{}, { opacity: 0, transform: "translate(-50%, 50%) scale(1.5, 1)" }], options);
      ringShadow.animate([{}, { opacity: 0, transform: "translate(-50%, -75%) scale(1, 0.5)" }], options);
      shade.animate([{}, { opacity: 0 }], options);
      band.animate([{}, { opacity: 0 }], options);
      // the page falls back into the distance, block by block
      const blocks = [
        document.querySelector(".site-column header"),
        ...lines(),
        ...Array.from(document.querySelectorAll("#main > * > *")),
      ].filter((el): el is Element => !!el);
      blocks.forEach((el, i) => {
        window.setTimeout(
          () =>
            el.animate([{ opacity: 0, transform: "perspective(600px) rotateX(45deg) translateY(-16px)", filter: "blur(24px)" }], {
              duration: BOOM_MS,
              easing: "cubic-bezier(0, 0.2, 0, 1)",
              fill: "forwards",
            }),
          Math.min(200, i * 30),
        );
      });
      window.setTimeout(() => location.reload(), BOOM_MS);
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
      size();
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
      drag = Math.max(0, dy - 6);
      progress = (drag / window.innerHeight) * RATE;
      const past = progress >= THRESHOLD;
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
      if (progress >= THRESHOLD) boom();
      else settle();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("resize", size);
    };
  }, []);

  const disc = "absolute left-1/2 rounded-full pointer-events-none opacity-0";
  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] hidden overflow-hidden [contain:paint]">
      <div ref={shadeRef} className="absolute inset-0 bg-black opacity-0" />
      {/* the spectrum, rising from the bottom edge, and its shadow */}
      <div ref={ringShadowRef} className={`${disc} top-full bg-black [filter:blur(128px)]`} />
      <div ref={ringRef} className={`${disc} top-full box-border border-solid border-transparent`}>
        <div ref={spectrumRef} className="absolute inset-0 rounded-full" style={{ background: SPECTRUM }} />
      </div>
      {/* the glow at the top, and the band of page colour along the edge */}
      <div
        ref={glowShadowRef}
        className={`${disc} top-0 bg-black [filter:blur(64px)]`}
        style={{ width: GLOW, height: GLOW }}
      />
      <div ref={glowRef} className={`${disc} top-0 bg-white`} style={{ width: GLOW, height: GLOW }} />
      <div
        ref={bandRef}
        className="absolute inset-x-0 top-0 h-32 origin-top opacity-0 [background:linear-gradient(var(--background)_0%,color-mix(in_srgb,var(--background)_70%,transparent)_25%,color-mix(in_srgb,var(--background)_25%,transparent)_65%,transparent_100%)]"
      />
    </div>
  );
}
