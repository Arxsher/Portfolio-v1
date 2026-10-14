// Home hero, part 1: the pond slot.
//
// =====================================================================
//  MOUNT THE POND ANIMATION HERE: replace <PondPlaceholder /> inside
//  #pond (see HeroPond at the bottom of this file).
//
//  What the slot gives its child (make it fill: `absolute inset-0` or
//  `size-full`):
//    - viewports >= 640px (`sm`): 660 x 400 px
//      (624-660 px wide between 640 and 676 px viewports)
//    - viewports < 640px: (viewport width - 16px) x 300 px,
//      e.g. 374 x 300 on a 390px phone, 359 x 300 on a 375px one
//  i.e. the content column plus a 16px bleed on each side (`-mx-4`).
//
//  The slot feathers its own edge with a CSS mask (`feather` below), so
//  whatever is mounted inside gets the soft, rounded, blurred border for
//  free. If the pond draws its own edge, remove `style={feather}`.
//  #pond is `relative` and `select-none`; it has no handlers of its own.
//  To match the reference:
//    - Fade the pond in once it is ready: opacity 0 -> 1 over 500ms,
//      ease-out (`opacity-0 transition-opacity duration-500 ease-out`,
//      then drop `opacity-0`).
//    - If it is interactive, make the canvas a Tab stop that announces
//      itself: role="button" tabIndex={0} and an aria-label in your own
//      words that describes the scene and how to interact with it (what
//      a click or tap does, and what Enter / Space do). Handle Enter /
//      Space in onKeyDown. Give it
//      `outline-none focus-visible:outline-2 focus-visible:outline-offset-2
//      focus-visible:outline-primary rounded-[24px]` so the focus ring
//      follows the corners, and `touch-pan-y cursor-pointer` so a phone
//      can still scroll the page over it.
//    - Optional: a still image of the scene (`<picture>`/`<img alt="">`,
//      `absolute inset-0 size-full pointer-events-none`) behind the
//      canvas as a fallback for no-JS / reduced motion / while loading,
//      fading over 300ms ease-out (`transition-opacity duration-300`).
// =====================================================================

import type { CSSProperties } from "react";

/* ---------------------------------------------------------------------- */
/* feathered edge                                                          */
/* ---------------------------------------------------------------------- */

// The edge is a rounded rectangle (radius --corner) whose opacity eases
// (smoothstep) from 0 to 1 between --fade-start and --fade-start +
// --fade-span in from the border. All three scale with the slot width
// (cqw of the wrapper): the fade runs about 8→42px with a 63px corner at
// 660px wide, and 4.5→24px with a 36px corner on a phone.
//
// Built as a nine-slice of mask layers: four radial corners, four linear
// edges and a solid centre, so the corners stay round at any aspect.

const STEPS = 8;
const smooth = (t: number) => t * t * (3 - 2 * t);
const ts = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
const alpha = (t: number) => `rgb(0 0 0 / ${+smooth(t).toFixed(4)})`;

// Distance in from the border at which the fade reaches step t.
const inset = (t: number) => `calc(var(--fade-start) + ${t} * var(--fade-span))`;

// Linear edge: opacity grows away from the border.
const edge = (direction: string) =>
  `linear-gradient(${direction}, ${ts.map((t) => `${alpha(t)} ${inset(t)}`).join(", ")})`;

// Corner: a radial fade around the corner's inner point (the centre of the
// rounding), opaque in the middle and clear at the border.
const corner = (at: string) =>
  `radial-gradient(circle at ${at}, ${[...ts]
    .reverse()
    .map((t) => `${alpha(t)} calc(var(--corner) - ${inset(t)})`)
    .join(", ")})`;

const R = "var(--corner)";
const SPAN = `calc(100% - 2 * ${R})`;

const layers: Array<[image: string, size: string, position: string]> = [
  [corner("100% 100%"), `${R} ${R}`, "0 0"], // top left
  [corner("0 100%"), `${R} ${R}`, "100% 0"], // top right
  [corner("100% 0"), `${R} ${R}`, "0 100%"], // bottom left
  [corner("0 0"), `${R} ${R}`, "100% 100%"], // bottom right
  [edge("to bottom"), `${SPAN} ${R}`, "50% 0"], // top
  [edge("to top"), `${SPAN} ${R}`, "50% 100%"], // bottom
  [edge("to right"), `${R} ${SPAN}`, "0 50%"], // left
  [edge("to left"), `${R} ${SPAN}`, "100% 50%"], // right
  ["linear-gradient(#000, #000)", `${SPAN} ${SPAN}`, "50% 50%"], // centre
];

const maskImage = layers.map(([image]) => image).join(", ");
const maskSize = layers.map(([, size]) => size).join(", ");
const maskPosition = layers.map(([, , position]) => position).join(", ");

const feather = {
  // Whole pixels for the slice size so neighbouring layers meet without a seam.
  "--corner": "round(9.6cqw, 1px)",
  "--fade-start": "1.2cqw",
  "--fade-span": "5.2cqw",
  maskImage,
  maskSize,
  maskPosition,
  maskRepeat: "no-repeat",
  WebkitMaskImage: maskImage,
  WebkitMaskSize: maskSize,
  WebkitMaskPosition: maskPosition,
  WebkitMaskRepeat: "no-repeat",
} as CSSProperties;

/* ---------------------------------------------------------------------- */
/* placeholder                                                             */
/* ---------------------------------------------------------------------- */

// Fine film grain (an SVG noise tile), blended softly so it reads in both
// themes.
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** A quiet stand-in: the card colour, a faint dot grid, two soft pools of light and grain. */
function PondPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-tile [--dot:rgb(0_0_0/0.1)] [--pool-a:rgb(255_255_255/0.3)] [--pool-b:rgb(255_255_255/0.2)] dark:[--dot:rgb(255_255_255/0.08)] dark:[--pool-a:rgb(255_255_255/0.035)] dark:[--pool-b:rgb(255_255_255/0.025)]"
      style={{
        backgroundImage: [
          "radial-gradient(circle, var(--dot) 0.75px, transparent 1.25px)",
          "radial-gradient(70% 80% at 24% 22%, var(--pool-a), transparent 70%)",
          "radial-gradient(60% 70% at 82% 84%, var(--pool-b), transparent 70%)",
        ].join(", "),
        backgroundSize: "16px 16px, auto, auto",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 opacity-[0.2] mix-blend-soft-light" style={{ backgroundImage: grain }} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* slot                                                                    */
/* ---------------------------------------------------------------------- */

export function HeroPond() {
  return (
    <figure className="mt-10">
      {/* Bleeds 16px past the text column; also the size container for the feather. */}
      <div className="-mx-4 @container">
        <div id="pond" className="relative h-75 w-full select-none sm:h-100" style={feather}>
          {/* Mount the pond animation here. */}
          <PondPlaceholder />
        </div>
      </div>
    </figure>
  );
}
