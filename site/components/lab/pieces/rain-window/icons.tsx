// Tray icons for the rain window, on the lab's 16×16 grid with 1.5px
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

/** A bolt of lightning. */
export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.2 1.8 4.4 8.9h3.4l-1 5.3 4.8-7.1H8.2z" />
    </Svg>
  );
}

/** Breath: three soft drifting lines. */
export function BreathIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.2 5.2c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0c.9-.7 1.9-.9 3.2-.5" />
      <path d="M2.2 8.6c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0c.9-.7 1.9-.9 3.2-.5" />
      <path d="M4.4 12c1-.8 2-.8 3 0s2.2.9 3.4 0" />
    </Svg>
  );
}
