// Icons for the lab (stage controls and the piece page actions). Same
// conventions as components/icons.tsx: a 16×16 grid, 1.5px strokes,
// currentColor, 16px by default, decorative unless given a title.

import type { ReactNode } from "react";
import type { IconProps } from "@/components/icons";

function Svg({ size = 16, className, title, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function Stroke({ children, width = 1.5 }: { children: ReactNode; width?: number }) {
  return (
    <g stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  );
}

/** Four corners pointing out: enter full screen. */
export function Expand(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M2.75 5.5V2.75H5.5" />
        <path d="M10.5 2.75h2.75V5.5" />
        <path d="M13.25 10.5v2.75H10.5" />
        <path d="M5.5 13.25H2.75V10.5" />
      </Stroke>
    </Svg>
  );
}

/** Four corners pointing in: leave full screen. */
export function Shrink(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M5.75 2.75v3h-3" />
        <path d="M13.25 5.75h-3v-3" />
        <path d="M10.25 13.25v-3h3" />
        <path d="M2.75 10.25h3v3" />
      </Stroke>
    </Svg>
  );
}

/** An arrow rising out of an open tray. */
export function Share(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M8 2.5v7.25" />
        <path d="M5.5 5 8 2.5 10.5 5" />
        <path d="M5.25 7.25h-.75a1.25 1.25 0 0 0-1.25 1.25v3.75c0 .69.56 1.25 1.25 1.25h7a1.25 1.25 0 0 0 1.25-1.25V8.5a1.25 1.25 0 0 0-1.25-1.25h-.75" />
      </Stroke>
    </Svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M9.75 4 5.75 8l4 4" />
      </Stroke>
    </Svg>
  );
}

export function ChevronRightSmall(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M6.25 4l4 4-4 4" />
      </Stroke>
    </Svg>
  );
}

export function SpeakerOn(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M2.5 6.6c0-.47.38-.85.85-.85h1.6L7.6 3.5c.4-.34 1.02-.06 1.02.47v8.06c0 .53-.62.81-1.02.47L4.95 10.25h-1.6a.85.85 0 0 1-.85-.85V6.6Z"
        fill="currentColor"
      />
      <Stroke>
        <path d="M10.9 6.1a2.6 2.6 0 0 1 0 3.8" />
        <path d="M12.55 4.4a5 5 0 0 1 0 7.2" />
      </Stroke>
    </Svg>
  );
}

export function SpeakerOff(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M2.5 6.6c0-.47.38-.85.85-.85h1.6L7.6 3.5c.4-.34 1.02-.06 1.02.47v8.06c0 .53-.62.81-1.02.47L4.95 10.25h-1.6a.85.85 0 0 1-.85-.85V6.6Z"
        fill="currentColor"
      />
      <Stroke>
        <path d="m10.75 6.25 3 3.5" />
        <path d="m13.75 6.25-3 3.5" />
      </Stroke>
    </Svg>
  );
}

export function Play(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M4.75 3.9c0-.77.83-1.25 1.5-.87l6.6 3.83c.67.39.67 1.36 0 1.74l-6.6 3.83c-.67.38-1.5-.1-1.5-.87V3.9Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function Pause(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
    </Svg>
  );
}

/** Counter-clockwise arrow: start over. */
export function Reset(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M3.5 8.5a4.5 4.5 0 1 0 1.32-3.68L3.25 6.25" />
        <path d="M3.25 3.25v3h3" />
      </Stroke>
    </Svg>
  );
}

/** Two crossing arrows: something new at random. */
export function Shuffle(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M2.5 4.75h1.6c1.03 0 1.99.53 2.54 1.4l2.72 3.7c.55.87 1.51 1.4 2.54 1.4h1.6" />
        <path d="M2.5 11.25h1.6c.84 0 1.63-.35 2.2-.95" />
        <path d="M9.7 5.7c.57-.6 1.36-.95 2.2-.95h1.6" />
        <path d="m11.75 3 1.75 1.75-1.75 1.75" />
        <path d="m11.75 9.5 1.75 1.75-1.75 1.75" />
      </Stroke>
    </Svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M8 3.5v9" />
        <path d="M3.5 8h9" />
      </Stroke>
    </Svg>
  );
}

export function Minus(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M3.5 8h9" />
      </Stroke>
    </Svg>
  );
}

/** Four tiles: grid view. */
export function GridView(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke width={1.4}>
        <rect x="2.75" y="2.75" width="4.25" height="5.5" rx="1.25" />
        <rect x="9" y="2.75" width="4.25" height="3.5" rx="1.25" />
        <rect x="2.75" y="10.25" width="4.25" height="3" rx="1.25" />
        <rect x="9" y="8.25" width="4.25" height="5" rx="1.25" />
      </Stroke>
    </Svg>
  );
}

/** Two arches on a sill: the arcade view of the lab. */
export function ArcadeView(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke width={1.4}>
        <path d="M2.25 13V7.9a2.75 2.75 0 0 1 5.5 0V13" />
        <path d="M8.25 13V7.9a2.75 2.75 0 0 1 5.5 0V13" />
        <path d="M1.25 13.25h13.5" />
      </Stroke>
    </Svg>
  );
}

/** Ruled lines: list view. */
export function ListView(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M2.75 4.25h10.5" />
        <path d="M2.75 8h10.5" />
        <path d="M2.75 11.75h10.5" />
      </Stroke>
    </Svg>
  );
}

/** ↵ */
export function Return(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M12.75 3.5v3.75a2 2 0 0 1-2 2H3.75" />
        <path d="M6.25 6.75 3.75 9.25l2.5 2.5" />
      </Stroke>
    </Svg>
  );
}

/** A small link glyph for "Link copied". */
export function LinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M6.75 9.25a2.6 2.6 0 0 0 3.68 0l2.12-2.12a2.6 2.6 0 0 0-3.68-3.68l-.6.6" />
        <path d="M9.25 6.75a2.6 2.6 0 0 0-3.68 0L3.45 8.87a2.6 2.6 0 0 0 3.68 3.68l.6-.6" />
      </Stroke>
    </Svg>
  );
}
