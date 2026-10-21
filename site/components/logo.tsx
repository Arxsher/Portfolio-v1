// Ashh's mark: a soft, chubby five-pointed star (the ★ from his bio) with
// two oval eyes. The corners are rounded and the eyes are cut out of the
// shape (even-odd fill), so the mark is one path in currentColor and the
// eyes show whatever sits behind it. Drawn on a 16×16 grid.
//
// This module stays free of client code so server components (footer,
// avatar, OG images) can use the static `Logo`. The eyes can also move:
// `starPath(x, y, open)` rebuilds the path with the eyes shifted and/or
// half shut, which is what the live header mark (components/star-logo.tsx)
// and the first-load intro (components/star-intro.tsx) draw with. At rest
// it returns exactly LOGO_PATH.

/** The star's body, without the eyes. */
export const STAR_BODY =
  "M8.75 2.51L9.92 4.64Q10.38 5.47 11.31 5.65L13.71 6.11Q15.23 6.4 14.17 7.53L12.5 9.31Q11.85 10 11.97 10.94L12.27 13.36Q12.47 14.9 11.06 14.24L8.86 13.2Q8 12.8 7.14 13.2L4.94 14.24Q3.53 14.9 3.73 13.36L4.03 10.94Q4.15 10 3.5 9.31L1.83 7.53Q0.77 6.4 2.29 6.11L4.69 5.65Q5.62 5.47 6.08 4.64L7.25 2.51Q8 1.15 8.75 2.51Z";

/** Eye centres and radii at rest (16-unit grid). */
export const EYE_CENTERS = [
  { cx: 6.35, cy: 8.55 },
  { cx: 9.65, cy: 8.55 },
] as const;
export const EYE_RX = 0.78;
export const EYE_RY = 1.08;

/** How far the eyes may travel from rest, in grid units. A look of
    (x, y) with x² + y² ≤ 1 keeps both ovals at least ~0.8 units inside the
    body (checked against the arms, the legs and the notch between them). */
export const EYE_TRAVEL = { x: 1.15, y: 0.9 } as const;

export type EyeShape = { cx: number; cy: number; rx: number; ry: number };

const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * The two eye ovals for a look direction (`x`, `y` in -1…1, clamped to the
 * unit circle) and an openness (1 open, 0 shut). Looking sideways narrows
 * the far eye a touch (a hint of a turned head); blinking lowers the lid
 * from the top, so the bottom of each eye stays put.
 */
export function eyeShapes(x = 0, y = 0, open = 1): [EyeShape, EyeShape] {
  const length = Math.hypot(x, y);
  if (length > 1) {
    x /= length;
    y /= length;
  }
  const lid = Math.min(1, Math.max(0, open));
  const ry = EYE_RY * (1 - 0.04 * Math.abs(y)) * lid;
  const dy = (EYE_RY - ry) * 0.45;
  return EYE_CENTERS.map(({ cx, cy }, index) => {
    // index 0 is the left eye: it is the far one when looking right.
    const far = index === 0 ? Math.max(0, x) : Math.max(0, -x);
    return {
      cx: cx + x * EYE_TRAVEL.x,
      cy: cy + y * EYE_TRAVEL.y + dy,
      rx: EYE_RX * (1 - 0.05 * Math.abs(x) - 0.07 * far),
      ry,
    };
  }) as [EyeShape, EyeShape];
}

/** One eye as an SVG subpath (two half-arcs). */
export function eyePath({ cx, cy, rx, ry }: EyeShape): string {
  const left = round(cx - rx);
  const r = `${round(rx)} ${round(ry)}`;
  return `M${left} ${round(cy)}a${r} 0 1 0 ${round(2 * rx)} 0a${r} 0 1 0 ${round(-2 * rx)} 0Z`;
}

/** Below this height an eye is shut: the hole is left out entirely (at
    16px it would be a quarter of a pixel anyway). */
const SHUT = 0.12;

/** The full mark (body + eye holes, for an even-odd fill) with the eyes
    looking towards (x, y) and `open` between 0 and 1. */
export function starPath(x = 0, y = 0, open = 1): string {
  let d = STAR_BODY;
  for (const eye of eyeShapes(x, y, open)) {
    if (eye.ry >= SHUT) d += eyePath(eye);
  }
  return d;
}

/** The mark at rest: the star with both eyes open, looking straight out. */
export const LOGO_PATH = starPath();

export function Logo({
  className,
  size = 16,
  title,
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className ? `shrink-0 fill-current ${className}` : "shrink-0 fill-current"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={LOGO_PATH} fillRule="evenodd" />
    </svg>
  );
}
