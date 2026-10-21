// Tray icons for the tiny planet, on the lab's 16×16 grid with 1.5px
// strokes in currentColor (decorative: the buttons carry the names).

import type { ReactNode } from "react";
import type { IconProps } from "@/components/icons";

function Svg({ size = 16, className, children }: IconProps & { children: ReactNode }) {
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
      <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

/** A small planet with a curved arrow sweeping round it: give it a spin. */
export function SpinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="3.25" />
      <path d="M2.4 10.6c.9 1.5 4.3 1.3 7.4-.3 2.6-1.4 4.2-3.3 3.8-4.6" />
      <path d="M11.9 5.1l1.75.55.45-1.8" />
    </Svg>
  );
}

/** A crescent and a dot on a dotted path: the moon. */
export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.6 3.2a4.9 4.9 0 1 0 2.2 7.6 4 4 0 0 1-2.2-7.6Z" />
    </Svg>
  );
}
