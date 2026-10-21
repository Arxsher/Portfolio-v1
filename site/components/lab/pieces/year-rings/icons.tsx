// Icons for the year rings controls, on the lab's 16 px grid (1.5 px strokes,
// currentColor, decorative).

import type { IconProps } from "@/components/icons";

/** Rings growing out from a pith: grow the year again. */
export function GrowIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
    >
      <circle cx="8" cy="8" r="1.1" fill="currentColor" />
      <path d="M8 4.6a3.4 3.4 0 1 1-3.3 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 1.75a6.25 6.25 0 1 1-6.1 4.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
