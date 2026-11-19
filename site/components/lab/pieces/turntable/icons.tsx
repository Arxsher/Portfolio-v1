// Tray icons for the deck, on the lab's 16 × 16 grid with 1.5px strokes.

import type { ReactNode } from "react";
import type { IconProps } from "@/components/icons";

function Svg({ size = 16, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** A filled rounded square: stop the platter. */
export function StopIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="8" height="8" rx="1.6" fill="currentColor" />
    </Svg>
  );
}

/** The cue lever: the arm lifting off (or lowering onto) a line, the record. */
export function CueIcon({ up, ...props }: IconProps & { up: boolean }) {
  return (
    <Svg {...props}>
      <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13.25h10" />
        {up ? <path d="M8 10.5V3.5M5.25 6.25 8 3.5l2.75 2.75" /> : <path d="M8 3.5v7M5.25 7.75 8 10.5l2.75-2.75" />}
      </g>
    </Svg>
  );
}
