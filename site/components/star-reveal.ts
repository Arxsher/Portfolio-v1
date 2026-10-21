// The page veil and the reveal that lifts it.
//
// While the first-load intro plays (components/star-intro.tsx), everything
// on the page but the star is hidden: while <html> has VEIL_ATTR, CSS gives
// <body>'s children `visibility: hidden` (out of the focus order and the
// accessibility tree) and `opacity: 0` (so nothing inside that sets its own
// visibility can show through). Only paint changes, never layout: the
// header mark the star flies to is laid out exactly where it will be,
// nothing moves when the veil goes, and the content stays in the DOM.
// <main> is aria-busy meanwhile.
//
// The reveal (`liftVeil`), as the star touches down on the mark:
//   circle   every top-level layer (the page column, the dock, …) is
//            clipped to one circle that grows from the mark past the
//            farthest corner of the screen (CIRCLE_MS: a steady spread
//            out of the impact that eases off towards the far corner);
//   cascade  each block on screen (the header, the page's sections, the
//            footer, the dock; a tall block is split into its parts, so a
//            list cascades row by row) fades in and rises RISE px as the
//            circle's edge reaches it: the header first, then the
//            profile, the intro and on down the screen. Whatever is below
//            the fold is simply there.
// Every block starts fading just as the edge meets it, so where the edge
// crosses content, that content is still nearly transparent: the hard
// clip reads as a soft wave.
// Transform, opacity and clip-path only, with the Web Animations API
// (nothing is written to the elements' own styles, and everything is gone
// when it ends). All of it starts in one task, so the first frame already
// has every block at its start. The header only fades (it holds the mark
// the star is landing on, which must not move), and so does any block with
// a transform of its own.
//
// The circle is a clip-path, which browsers animate on the main thread: a
// stall would freeze it half-way with content cut off. So it is only drawn
// when the caller has seen the page run smoothly (`circle`); without it the
// cascade alone (on the compositor) still spreads out from the mark.
// Without an origin (the mark is off-screen) the layers simply fade in;
// with reduced motion the veil just goes.

import { FAILSAFE_S, VEIL_ATTR } from "@/components/star-path";

/** Where the reveal grows from: the header mark's centre and size (px). */
export type RevealOrigin = { x: number; y: number; size: number };

type Bezier = [number, number, number, number];

/** The circle's growth. */
const CIRCLE_MS = 900;
const CIRCLE_EASE: Bezier = [0.4, 0.3, 0.3, 1];
/** Each block's fade: it starts gently, so content the edge is crossing is
    still faint. */
const FADE_IN_MS = 560;
const FADE_IN_EASE = "cubic-bezier(0.35, 0, 0.25, 1)";
/** …and its rise, slower and with the site's quint-style ease-out, so it
    is still settling as the block comes into view. */
const RISE = 10;
const RISE_MS = 760;
const RISE_EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
/** A block starts when the edge is this far across it (from its nearest
    to its farthest point on screen), a beat early (LEAD_MS), and never
    waits longer than MAX_DELAY_MS. */
const ACROSS = 0.3;
const LEAD_MS = 60;
const MAX_DELAY_MS = 440;
/** A block taller than this with a few parts cascades part by part (up to
    SPLIT_DEPTH levels down). */
const SPLIT_HEIGHT = 140;
const SPLIT_PARTS = 16;
const SPLIT_DEPTH = 3;
/** The plain fade, when there is no origin. */
const FADE_MS = 320;

const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const ease = ([x1, y1, x2, y2]: Bezier) => `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;

/** The fraction of the duration at which a cubic-bezier ease reaches
    `progress` (0…1; the curve's y must be monotone). */
function timeAt([x1, y1, x2, y2]: Bezier, progress: number) {
  const axis = (a: number, b: number, u: number) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (axis(y1, y2, mid) < progress) lo = mid;
    else hi = mid;
  }
  return axis(x1, x2, (lo + hi) / 2);
}

const content = (el: Element) => Array.from(el.children).filter((child) => !SKIP.has(child.tagName));

/** <body>'s children that the veil hides (the star's overlay aside). */
function layers(): HTMLElement[] {
  return content(document.body).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && !el.classList.contains("star-intro"),
  );
}

/** The page's own blocks: <main>'s children, looking through the single
    wrappers around them (the route template's div, an <article> …). */
function pageBlocks(main: Element): Element[] {
  let box = main;
  for (let depth = 0; depth < 3; depth++) {
    const kids = content(box);
    if (kids.length !== 1) break;
    box = kids[0];
  }
  const kids = content(box);
  return kids.length > 0 ? kids : [box];
}

/** The blocks of a layer that cascade in: the layer itself, or, for the
    one holding <main>, its parts (header, the page's blocks, footer). */
function blocksOf(layer: Element, main: Element | null): Element[] {
  if (!main || !layer.contains(main)) return [layer];
  const blocks: Element[] = [];
  for (const child of content(layer)) {
    if (child === main) blocks.push(...pageBlocks(main));
    else if (child.contains(main)) blocks.push(...blocksOf(child, main));
    else blocks.push(child);
  }
  return blocks;
}

const clear = (color: string) => color === "transparent" || /(?:,\s*0|\/\s*0)\)$/.test(color);

/** Whether an element draws anything itself (a fill, a border, a shadow):
    then it fades as one, or its parts would fade in over it. */
function paints(style: CSSStyleDeclaration) {
  const border = ["top", "right", "bottom", "left"].some(
    (side) => parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0,
  );
  return border || style.backgroundImage !== "none" || !clear(style.backgroundColor) || style.boxShadow !== "none";
}

/** A block, or its parts when it is a tall wrapper that draws nothing
    itself (or has no box of its own). */
function refine(block: Element, depth: number, out: Element[]) {
  const parts = depth < SPLIT_DEPTH ? content(block) : [];
  if (parts.length > 0 && parts.length <= SPLIT_PARTS) {
    const box = block.getBoundingClientRect();
    const style = getComputedStyle(block);
    const hollow = style.display === "contents" || box.width === 0 || box.height === 0;
    if (hollow || (box.height > SPLIT_HEIGHT && !paints(style))) {
      for (const part of parts) refine(part, depth + 1, out);
      return;
    }
  }
  out.push(block);
}

const onScreen = (box: DOMRect, vw: number, vh: number) =>
  box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < vh && box.right > 0 && box.left < vw;

/** Resolves when every animation is over (or would long have been: a
    hidden tab may hold them, and a first frame that takes long to paint
    starts them late). */
function settle(animations: Animation[], longest: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, longest + 2000);
    Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
}

function fade(): Promise<void> {
  const animations = layers().map((layer) =>
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: RISE_EASE }),
  );
  return settle(animations, FADE_MS);
}

function unveil(origin: RevealOrigin, circle: boolean): Promise<void> {
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = window.innerHeight;
  const main = document.getElementById("main");
  const home = document.querySelector("[data-star-home]");
  const far =
    Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(vw - origin.x, origin.y),
      Math.hypot(origin.x, vh - origin.y),
      Math.hypot(vw - origin.x, vh - origin.y),
    ) + 2;
  const near = Math.min(far, origin.size * 0.6);

  // Read everything first, then start every animation.
  const plans: { el: Element; keyframes: Keyframe[]; options: KeyframeAnimationOptions }[] = [];
  for (const layer of layers()) {
    const box = layer.getBoundingClientRect();
    if (!onScreen(box, vw, vh)) continue;
    if (circle) {
      // In the layer's own box (its offset size over its drawn size undoes
      // a scale of its own, should it have one).
      const kx = layer.offsetWidth && box.width ? layer.offsetWidth / box.width : 1;
      const ky = layer.offsetHeight && box.height ? layer.offsetHeight / box.height : 1;
      const at = `at ${((origin.x - box.left) * kx).toFixed(1)}px ${((origin.y - box.top) * ky).toFixed(1)}px`;
      plans.push({
        el: layer,
        keyframes: [
          { clipPath: `circle(${near.toFixed(1)}px ${at})` },
          { clipPath: `circle(${far.toFixed(1)}px ${at})` },
        ],
        options: { duration: CIRCLE_MS, easing: ease(CIRCLE_EASE) },
      });
    }

    const blocks: Element[] = [];
    for (const block of blocksOf(layer, main)) {
      if (home && block.contains(home)) blocks.push(block);
      else refine(block, 0, blocks);
    }
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      if (!onScreen(rect, vw, vh)) continue;
      const style = getComputedStyle(block);
      const opacity = parseFloat(style.opacity);
      if (!(opacity > 0) || style.visibility !== "visible") continue;
      // When the circle's edge is ACROSS of the way over the block's
      // on-screen part.
      const left = Math.max(rect.left, 0) - origin.x;
      const right = Math.min(rect.right, vw) - origin.x;
      const top = Math.max(rect.top, 0) - origin.y;
      const bottom = Math.min(rect.bottom, vh) - origin.y;
      const nearest = Math.hypot(Math.max(left, 0, -right), Math.max(top, 0, -bottom));
      const farthest = Math.hypot(Math.max(-left, right), Math.max(-top, bottom));
      const reach = clamp((nearest + (farthest - nearest) * ACROSS - near) / (far - near), 0, 1);
      const landing = !!home && block.contains(home);
      const delay = landing ? 0 : Math.round(clamp(CIRCLE_MS * timeAt(CIRCLE_EASE, reach) - LEAD_MS, 0, MAX_DELAY_MS));
      plans.push({
        el: block,
        keyframes: [{ opacity: 0 }, { opacity }],
        options: { duration: FADE_IN_MS, delay, easing: FADE_IN_EASE, fill: "backwards" },
      });
      if (style.transform === "none" && !landing) {
        plans.push({
          el: block,
          keyframes: [{ transform: `translateY(${RISE}px)` }, { transform: "none" }],
          options: { duration: RISE_MS, delay, easing: RISE_EASE, fill: "backwards" },
        });
      }
    }
  }
  const animations = plans.map(({ el, keyframes, options }) => el.animate(keyframes, options));
  return settle(animations, Math.max(CIRCLE_MS, MAX_DELAY_MS + RISE_MS));
}

/**
 * Lifts the veil (no-op when there is none) and plays the reveal from
 * `origin` (null: a plain fade), with the circle when `circle` is set.
 * Resolves once the reveal is over. Never throws: whatever happens, the
 * page is shown.
 */
export function liftVeil(origin: RevealOrigin | null, motion = true, circle = true): Promise<void> {
  const root = document.documentElement;
  const state = root.getAttribute(VEIL_ATTR);
  if (state === null) return Promise.resolve();
  root.removeAttribute(VEIL_ATTR);
  document.getElementById("main")?.removeAttribute("aria-busy");
  if (!motion) return Promise.resolve();
  // Still "" means the app hydrated too late for the intro: once the CSS
  // failsafe has started, the page is already (being) shown.
  const at = window.__starIntro?.at;
  if (state !== "live" && (at === undefined || performance.now() - at >= FAILSAFE_S * 1000)) {
    return Promise.resolve();
  }
  try {
    return state === "live" && origin ? unveil(origin, circle) : fade();
  } catch {
    return Promise.resolve();
  }
}
