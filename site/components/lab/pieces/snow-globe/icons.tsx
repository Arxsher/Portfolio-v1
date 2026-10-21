// Tray icons for the snow globe, drawn on the lab's 16×16 grid with 1.5px
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

/** A small globe on its base, with motion marks either side. */
export function ShakeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="7" r="3.6" />
      <path d="M5.4 13.6h5.2l-.7-2.3H6.1z" />
      <path d="M1.8 5.2c-.5 1.2-.5 2.6 0 3.8" />
      <path d="M14.2 5.2c.5 1.2.5 2.6 0 3.8" />
    </Svg>
  );
}

/** A four-pane window. */
export function WindowIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="10" height="10" rx="1.2" />
      <path d="M8 3.4v9.2" />
      <path d="M3.4 8h9.2" />
    </Svg>
  );
}
