// Tray icons for the holo cards, drawn on the lab's 16×16 grid with 1.5px
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

/** Two cards squared up in a stack. */
export function StackIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="8" height="10.5" rx="1.6" />
      <path d="M5.6 1.75h4.8" />
    </Svg>
  );
}

/** Three cards fanned out. */
export function FanIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="2" width="6" height="9" rx="1.3" />
      <path d="M4.1 3.9 2.3 4.4a1.2 1.2 0 0 0-.8 1.5l1.9 6.4" />
      <path d="M11.9 3.9l1.8.5a1.2 1.2 0 0 1 .8 1.5l-1.9 6.4" />
    </Svg>
  );
}

/** The front card sent round to the back. */
export function NextIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="4.5" width="7" height="9.5" rx="1.4" />
      <path d="M11 4.5h1.6A1.4 1.4 0 0 1 14 5.9v6.7" />
      <path d="M5.5 4.5V3.4A1.4 1.4 0 0 1 6.9 2h3.4" />
      <path d="m8.8.9 1.5 1.1-1.5 1.1" />
    </Svg>
  );
}

/** A card turning over. */
export function FlipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="2" width="7" height="12" rx="1.4" />
      <path d="M1.5 6.2a6.5 6.5 0 0 0 0 3.6" />
      <path d="M14.5 6.2a6.5 6.5 0 0 1 0 3.6" />
    </Svg>
  );
}

/** A phone rocking side to side (the gyroscope steers the cards). */
export function TiltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="2" width="6" height="12" rx="1.5" />
      <path d="M7.25 11.75h1.5" />
      <path d="M2.5 6a5 5 0 0 0 0 4" />
      <path d="M13.5 6a5 5 0 0 1 0 4" />
    </Svg>
  );
}
