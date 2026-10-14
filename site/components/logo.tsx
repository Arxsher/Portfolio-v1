// The mark: an inlaid eight-pointed star, the khatam at the heart of every
// zellige panel (an outline star with a solid star set in its centre). It
// stands for the site in the top bar (cobalt), on the seal in the lab, on
// the avatar tile and wherever "arsher" needs a sign. Paints with
// currentColor; stays crisp from 12px up.
//
//   <Logo />                      16px, decorative
//   <Logo size={20} className="text-cobalt" />
//   <Logo title="arsher" />       with an accessible name

import { starPoints } from "@/lib/zellige";

const OUTER = starPoints(12, 12, 10.6);
const HEART = starPoints(12, 12, 5.2);

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
      viewBox="0 0 24 24"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <polygon
        points={OUTER}
        fill="none"
        stroke="currentColor"
        strokeWidth={size <= 14 ? 1.6 : 1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polygon points={HEART} fill="currentColor" />
    </svg>
  );
}
