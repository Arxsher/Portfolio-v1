"use client";

// Pull to reload, on touch screens, after olek.si's pull to refresh. With
// the page resting at its very top, dragging down pulls the page with it (a
// rubber band), and with the pull, u (0 → THRESHOLD and on):
//
//   - the screen dims (up to 30%);
//   - an orb of spectrum (a disc inside a thick transparent border),
//     blurred far past recognition and brightened 5×, rises from the bottom
//     edge in a wide dark halo, shrinking and coming into focus: by the
//     threshold it has reached the top;
//   - a white glow gathers there, tighter as it goes, and a band of the
//     page's own colour grows down from the top edge;
//   - the hero's lines tip back (up to 45°, in perspective) and drop, as if
//     pulled.
//
// Past the threshold a haptic tick says it will reload. Let go there and
// it goes off: the glow bursts into a white ring that flies out, the
// spectrum falls away, the blocks on screen fall back into the distance in
// a blur, and the page reloads. Let go before and it all springs back.
//
// The gesture never traps the page:
//
//   - It only starts on one finger moving down, with the page at rest at
//     scrollY 0 (a touch that lands while the page is still arriving there
//     is left to the browser, so scrolling up hard can't set it off), and
//     not inside anything that handles touches itself (a lab stage, a
//     dialog, a form field, a scrolling panel, touch-action: none).
//   - Those moves get preventDefault, which keeps the browser's own pull to
//     refresh and rubber band out of it; but the same touch can go straight
//     on to scroll the page: push back up past where the pull began and the
//     page scrolls under the finger, and glides on when it lifts.
//   - A second finger, a cancelled touch or a hidden tab lets go. A new
//     touch takes over a pull that is still springing back.
//   - If the reload doesn't happen (offline, or the page is restored from
//     the back/forward cache), everything is put back.
//
// Every frame of the pull only moves and fades layers (transform, opacity);
// the blurs are fixed, so nothing is re-rendered while the finger moves.
// Not while the first-load intro plays. Reduced motion: none of it.

import { useEffect, useRef } from "react";
import { haptic } from "@/lib/haptics";

/** Pull progress at which letting go reloads. */
const THRESHOLD = 0.4;
/** Progress per screen height of finger travel (the threshold at about 0.42 of the screen). */
const RATE = 0.95;
/** Finger travel (px) before a touch is read as a pull, or as something else. */
const SLOP = 6;
/** The page must have been still this long (ms) for a touch to start a pull. */
const REST_MS = 220;
const SETTLE_MS = 380;
const BOOM_MS = 700;
/** The reload starts while the burst is still fading, so there is no dead time after it. */
const RELOAD_AT = 460;
/** If the page is still here this long after asking for a reload, put it back. */
const GIVE_UP_MS = 6000;
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

/**
 * idle     nothing shown
 * pull     a finger is pulling the page down
 * scroll   the same finger has gone back up past where it began: it scrolls the page
 * settle   let go early: springing back
 * boom     let go past the threshold: bursting, then reloading
 */
type Mode = "idle" | "pull" | "scroll" | "settle" | "boom";

export function PullReload() {
  const layerRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const ringShadowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const softRef = useRef<HTMLDivElement>(null);
  const sharpRef = useRef<HTMLDivElement>(null);
  const glowShadowRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) return;
    const layer = layerRef.current;
    const shade = shadeRef.current;
    const ringShadow = ringShadowRef.current;
    const ring = ringRef.current;
    const soft = softRef.current;
    const sharp = sharpRef.current;
    const glowShadow = glowShadowRef.current;
    const glow = glowRef.current;
    const band = bandRef.current;
    if (!layer || !shade || !ringShadow || !ring || !soft || !sharp || !glowShadow || !glow || !band) return;
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    let mode: Mode = "idle";
    /** A touch that may still turn into a pull. */
    let candidate: { id: number; x: number; y: number } | null = null;
    /** The finger that is pulling, and the height at which its pull is zero. */
    let touchId = -1;
    let originY = 0;
    /** Where the finger has just been, for the glide when it lifts. */
    let trail: Array<{ t: number; y: number }> = [];
    let progress = 0;
    let drag = 0;
    let armed = false;
    let lastScroll = -Infinity;
    let raf = 0;
    let settleRaf = 0;
    let glideRaf = 0;
    let timers: number[] = [];
    let burst: Animation[] = [];
    let V = 0;
    let W = 0;
    let size = 0;
    let rise = 0;
    /** What the pull moves on the page: the column, and the hero's lines. */
    let adopted = false;
    let column: HTMLElement | null = null;
    let lines: HTMLElement[] = [];

    const measure = () => {
      V = window.innerHeight;
      W = window.innerWidth;
      size = W * 1.2;
      // the halo's centre reaches the top edge right at the threshold
      rise = V / THRESHOLD;
      for (const el of [ring, ringShadow]) el.style.width = el.style.height = `${size}px`;
      // the spectrum fills only the inside of the ring's border: a compact orb
      ring.style.borderWidth = `${V * 0.15}px`;
      soft.style.filter = `blur(${(V * 0.1).toFixed(1)}px) brightness(5)`;
    };

    /** The page's side of it: what moves, found once per pull. */
    const adopt = () => {
      adopted = true;
      column = document.querySelector<HTMLElement>(".site-column");
      lines = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-stream] > section:first-child, [data-stream] [data-para], [data-stream] [data-actions]",
        ),
      );
      if (column) column.style.willChange = "transform";
      for (const el of lines) el.style.transformOrigin = "50% 100%";
    };
    const disown = () => {
      adopted = false;
      if (column) {
        column.style.transform = "";
        column.style.willChange = "";
      }
      for (const el of lines) {
        el.style.transform = "";
        el.style.transformOrigin = "";
      }
      column = null;
      lines = [];
    };

    const render = () => {
      raf = 0;
      const u = clamp(progress);
      if (progress <= 0) {
        layer.style.display = "none";
        disown();
        return;
      }
      layer.style.display = "block";
      if (!adopted) adopt();
      const scale = 1 - (1 - (W * 0.7) / size) * u;
      const lift = -rise * u;
      const light = Math.min(1, u * 1.6);
      ringShadow.style.transform = `translate(-50%, calc(-50% + ${lift.toFixed(1)}px)) scale(${(scale * 1.5).toFixed(3)})`;
      ringShadow.style.opacity = `${Math.min(1, light * 1.5)}`;
      ring.style.transform = `translate(-50%, calc(-50% + ${(lift * scale).toFixed(1)}px)) scale(${scale.toFixed(3)})`;
      ring.style.opacity = `${light}`;
      // coming into focus: the sharper copy fades in over the soft one
      soft.style.opacity = `${(1 - 0.8 * u).toFixed(3)}`;
      sharp.style.opacity = `${u.toFixed(3)}`;
      const tight = `translate(-50%, -50%) scale(${(1 - u).toFixed(3)})`;
      glowShadow.style.transform = tight;
      glowShadow.style.opacity = `${Math.min(1, u * 1.2)}`;
      glow.style.transform = tight;
      glow.style.opacity = `${Math.min(1, u * 3)}`;
      shade.style.opacity = `${Math.min(0.3, Math.max(0, u - 0.2) / 2)}`;
      band.style.transform = `scaleY(${((32 + u * 96) / 128).toFixed(3)})`;
      band.style.opacity = `${Math.min(1, u * 4)}`;
      // the page comes down with the finger, damped like a rubber band
      if (column) column.style.transform = `translateY(${(V * 0.5 * (1 - 1 / (drag / V + 1))).toFixed(1)}px)`;
      // the hero's lines tip back and drop
      const tip = clamp(u / 0.7);
      const tipped = `perspective(600px) rotateX(${(-45 * tip).toFixed(2)}deg) translateY(${(32 * tip).toFixed(1)}px)`;
      for (const el of lines) el.style.transform = tipped;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const setPull = (distance: number) => {
      drag = Math.max(0, distance);
      progress = (drag / V) * RATE;
      const past = progress >= THRESHOLD;
      if (past !== armed) {
        armed = past;
        if (past) haptic();
      }
      schedule();
    };

    const stopSettle = () => {
      cancelAnimationFrame(settleRaf);
      settleRaf = 0;
    };
    const stopGlide = () => {
      cancelAnimationFrame(glideRaf);
      glideRaf = 0;
    };

    /** Springs the pull back to nothing. */
    const settle = () => {
      stopSettle();
      touchId = -1;
      armed = false;
      if (progress <= 0) {
        mode = "idle";
        schedule();
        return;
      }
      mode = "settle";
      const fromDrag = drag;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = clamp((now - t0) / SETTLE_MS);
        drag = fromDrag * (1 - t) ** 3;
        progress = (drag / V) * RATE;
        if (t >= 1) {
          settleRaf = 0;
          drag = 0;
          progress = 0;
          mode = "idle";
        } else settleRaf = requestAnimationFrame(tick);
        render();
      };
      settleRaf = requestAnimationFrame(tick);
    };

    /** Carries the page on after the finger that was scrolling it lifts (px per ms). */
    const glide = (velocity: number) => {
      stopGlide();
      if (Math.abs(velocity) < 0.15) return;
      let at = window.scrollY;
      let last = performance.now();
      const step = (now: number) => {
        const dt = Math.min(40, now - last);
        last = now;
        at += velocity * dt;
        velocity *= 0.998 ** dt;
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, at);
        glideRaf = Math.abs(velocity) < 0.03 || at <= 0 || at >= limit ? 0 : requestAnimationFrame(step);
      };
      glideRaf = requestAnimationFrame(step);
    };

    /** Puts everything back after a burst that didn't end in a reload. */
    const restore = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
      burst.forEach((animation) => animation.cancel());
      burst = [];
      for (const el of [glow, glowShadow]) {
        el.style.background = "";
        el.style.boxShadow = "";
      }
      stopSettle();
      touchId = -1;
      candidate = null;
      armed = false;
      drag = 0;
      progress = 0;
      mode = "idle";
      render();
    };

    const boom = () => {
      mode = "boom";
      touchId = -1;
      const options = { duration: BOOM_MS, easing: "cubic-bezier(0.4, 0, 0, 1)", fill: "forwards" as const };
      // the glow becomes a white ring and flies out
      glow.style.background = "transparent";
      glow.style.boxShadow = "inset 0 0 0 32px white";
      glowShadow.style.background = "transparent";
      glowShadow.style.boxShadow = "inset 0 0 0 96px black";
      burst.push(
        glow.animate([{ opacity: 1 }, { opacity: 0, transform: "translate(-50%, -50%) scale(3)" }], options),
        glowShadow.animate([{}, { opacity: 0, transform: "translate(-50%, -50%) scale(3)" }], options),
        ring.animate([{}, { opacity: 0, transform: "translate(-50%, 50%) scale(1.5, 1)" }], options),
        ringShadow.animate([{}, { opacity: 0, transform: "translate(-50%, -75%) scale(1, 0.5)" }], options),
        shade.animate([{}, { opacity: 0 }], options),
        band.animate([{}, { opacity: 0 }], options),
      );
      // what is on screen falls back into the distance, block by block
      const blocks = [
        document.querySelector(".site-column header"),
        ...lines,
        document.querySelector(".hero-hint"),
        ...Array.from(document.querySelectorAll("#main > * > *")).filter((el) => !el.querySelector("[data-stream]")),
      ].filter((el): el is Element => {
        if (!el) return false;
        const box = el.getBoundingClientRect();
        return box.height > 0 && box.bottom > 0 && box.top < V;
      });
      blocks.forEach((el, i) => {
        timers.push(
          window.setTimeout(
            () =>
              burst.push(
                el.animate([{ opacity: 0, transform: "perspective(600px) rotateX(45deg) translateY(-16px)", filter: "blur(24px)" }], {
                  duration: BOOM_MS,
                  easing: "cubic-bezier(0, 0.2, 0, 1)",
                  fill: "forwards",
                }),
              ),
            Math.min(200, i * 30),
          ),
        );
      });
      timers.push(
        window.setTimeout(() => location.reload(), RELOAD_AT),
        window.setTimeout(restore, GIVE_UP_MS),
      );
    };

    const find = (touches: TouchList, id: number) => {
      for (let i = 0; i < touches.length; i++) if (touches[i].identifier === id) return touches[i];
      return null;
    };

    const onStart = (event: TouchEvent) => {
      stopGlide();
      candidate = null;
      if (mode === "boom") return;
      if (event.touches.length !== 1) {
        // a second finger: let go
        if (mode === "pull" || mode === "scroll") settle();
        return;
      }
      if (mode === "pull" || mode === "scroll") return;
      if (window.scrollY > 0 || performance.now() - lastScroll < REST_MS) return;
      if (root.hasAttribute("data-star-intro") || root.hasAttribute("data-intro-veil")) return;
      if (reduced.matches || ownsTouch(event.target)) return;
      const touch = event.touches[0];
      candidate = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    };

    const onMove = (event: TouchEvent) => {
      if (mode === "boom") return;
      if (mode !== "pull" && mode !== "scroll") {
        if (!candidate) return;
        const touch = find(event.touches, candidate.id);
        if (!touch) return;
        const dx = touch.clientX - candidate.x;
        const dy = touch.clientY - candidate.y;
        // up, or sideways: not a pull, and the browser's to handle
        if (dy < -SLOP || (Math.abs(dx) > SLOP && Math.abs(dx) >= Math.abs(dy))) {
          candidate = null;
          return;
        }
        if (dy <= SLOP) return;
        // the browser already took this touch (it is scrolling): leave it
        if (!event.cancelable || window.scrollY > 0) {
          candidate = null;
          return;
        }
        // a pull, taken up from where the page is now (a spring-back in progress carries on)
        stopSettle();
        measure();
        touchId = candidate.id;
        originY = touch.clientY - drag;
        trail = [];
        candidate = null;
        mode = "pull";
      }
      const touch = find(event.touches, touchId);
      if (!touch) return;
      if (event.cancelable) event.preventDefault();
      const now = performance.now();
      trail.push({ t: now, y: touch.clientY });
      while (trail.length > 2 && now - trail[0].t > 120) trail.shift();
      const offset = touch.clientY - originY;
      if (offset >= 0) {
        if (mode === "scroll") window.scrollTo(0, 0);
        mode = "pull";
        setPull(offset);
      } else {
        // back up past where it began: the same finger scrolls the page
        mode = "scroll";
        if (progress > 0) setPull(0);
        window.scrollTo(0, -offset);
      }
    };

    const onEnd = (event: TouchEvent) => {
      if (candidate && find(event.changedTouches, candidate.id)) candidate = null;
      if ((mode !== "pull" && mode !== "scroll") || !find(event.changedTouches, touchId)) return;
      if (event.type === "touchcancel") return settle();
      if (mode === "pull") return progress >= THRESHOLD ? boom() : settle();
      // it was scrolling: carry on at the speed the finger left with
      const first = trail[0];
      const last = trail[trail.length - 1];
      const fresh = last && performance.now() - last.t < 80 && last.t > first.t;
      const velocity = fresh ? -(last.y - first.y) / (last.t - first.t) : 0;
      settle();
      glide(velocity);
    };

    const onScroll = () => {
      lastScroll = performance.now();
    };
    const onHide = () => {
      if (document.hidden && (mode === "pull" || mode === "scroll")) settle();
    };
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) restore();
    };
    const onResize = () => {
      measure();
      if (progress > 0) schedule();
    };

    measure();
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", stopGlide, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelAnimationFrame(raf);
      stopSettle();
      stopGlide();
      timers.forEach((timer) => window.clearTimeout(timer));
      burst.forEach((animation) => animation.cancel());
      disown();
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", stopGlide);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  // each on a layer of its own, with a fixed blur: the pull only moves and fades them
  const disc = "absolute left-1/2 rounded-full pointer-events-none opacity-0 will-change-[transform,opacity]";
  const spectrum = "absolute inset-0 rounded-full will-change-[opacity]";
  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] hidden overflow-hidden [contain:paint]">
      <div ref={shadeRef} className="absolute inset-0 bg-black opacity-0 will-change-[opacity]" />
      {/* the spectrum, rising from the bottom edge, and its shadow */}
      <div ref={ringShadowRef} className={`${disc} top-full bg-black [filter:blur(128px)]`} />
      <div ref={ringRef} className={`${disc} top-full box-border border-solid border-transparent`}>
        <div ref={softRef} className={spectrum} style={{ background: SPECTRUM }} />
        <div ref={sharpRef} className={`${spectrum} opacity-0 [filter:blur(20px)_brightness(5)]`} style={{ background: SPECTRUM }} />
      </div>
      {/* the glow at the top, and the band of page colour along the edge */}
      <div
        ref={glowShadowRef}
        className={`${disc} top-0 bg-black [filter:blur(64px)]`}
        style={{ width: GLOW, height: GLOW }}
      />
      <div ref={glowRef} className={`${disc} top-0 bg-white [filter:blur(64px)]`} style={{ width: GLOW, height: GLOW }} />
      <div
        ref={bandRef}
        className="absolute inset-x-0 top-0 h-32 origin-top opacity-0 will-change-[transform,opacity] [background:linear-gradient(var(--background)_0%,color-mix(in_srgb,var(--background)_70%,transparent)_25%,color-mix(in_srgb,var(--background)_25%,transparent)_65%,transparent_100%)]"
      />
    </div>
  );
}
