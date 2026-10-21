// Tray icons for the night train, drawn on the lab's 16×16 grid with
// 1.5px strokes in currentColor (decorative: the controls carry the names).

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

/** A train seen nose on: the cab, its windscreen, two lamps and the rails. */
export function TrainIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.25 11.25V4.6c0-1.3 1.05-2.35 2.35-2.35h2.8c1.3 0 2.35 1.05 2.35 2.35v6.65" />
      <path d="M4.25 11.25h7.5" />
      <path d="M5.4 7.1h5.2" />
      <path d="m5.25 13.75 1-2.5m4.5 2.5-1-2.5" />
      <circle cx="6.1" cy="9.25" r="0.2" fill="currentColor" strokeWidth={1.2} />
      <circle cx="9.9" cy="9.25" r="0.2" fill="currentColor" strokeWidth={1.2} />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.75v1.1M8 13.15v1.1M1.75 8h1.1M13.15 8h1.1M3.6 3.6l.78.78M11.62 11.62l.78.78M3.6 12.4l.78-.78M11.62 4.38l.78-.78" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" />
    </Svg>
  );
}
