// Tray icons for the golden hour room, drawn on the lab's 16×16 grid with
// 1.5px strokes in currentColor (decorative: the buttons carry the names).

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

/** An articulated desk lamp. */
export function LampIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 14h6" />
      <path d="M6.5 14 5 8.5l4.2-3.2" />
      <path d="m9.2 5.3 1.6-1.9 3.2 3.4-2.1 1.5z" />
      <path d="M11.4 9.6 10.6 11" />
    </Svg>
  );
}

/** A monitor on a stand. */
export function ScreenIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="3" width="12" height="7.5" rx="1.25" />
      <path d="M8 10.5V13M5.5 13.25h5" />
    </Svg>
  );
}

/** A small sun (the readout while it's up). */
export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="2.6" />
      <path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1" />
    </Svg>
  );
}

/** A crescent moon (the readout after dark). */
export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12.8 9.6A5.2 5.2 0 0 1 6.4 3.2a5.2 5.2 0 1 0 6.4 6.4Z" />
    </Svg>
  );
}
