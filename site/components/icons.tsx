// Icon set. Every icon is drawn on a 16×16 grid (the day/night pair on
// 24×24), renders at 16px by default and paints with currentColor, so
// colour comes from the text colour of the parent (`text-muted
// hover:text-primary` …). The site's ornament (the eight-pointed star, the
// long arrow, the arch) lives in components/ornament.tsx, not here.
//
//   <Mail />  <ArrowUpRight size={13} />  <GitHub className="size-5" />
//
// Outline icons use a 1.5px stroke; Home, Pen, Folder, Sparkle and Moon are
// small solid glyphs (they read better at 12–14px inside the palette
// tiles). Brand marks follow each brand's public logo shape.

import type { ReactNode } from "react";

export type IconProps = {
  className?: string;
  size?: number;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  title?: string;
};

function Svg({
  size = 16,
  className,
  title,
  viewBox = "0 0 16 16",
  children,
}: IconProps & { viewBox?: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
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

/* ---------------------------------------------------------------------- */
/* arrows                                                                  */
/* ---------------------------------------------------------------------- */

export function ArrowUpRight(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M4.75 11.25 11 5" />
        <path d="M5.75 4.75h5.5v5.5" />
      </Stroke>
    </Svg>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="M6.25 3.75 10.5 8l-4.25 4.25" />
      </Stroke>
    </Svg>
  );
}

export function ChevronUp(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke width={1.6}>
        <path d="M3.75 10.25 8 6l4.25 4.25" />
      </Stroke>
    </Svg>
  );
}

/* ---------------------------------------------------------------------- */
/* brands                                                                  */
/* ---------------------------------------------------------------------- */

export function GitHub(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
      />
    </Svg>
  );
}

/** The X (formerly Twitter) mark. Drawn a little inset so it sits level with GitHub. */
export function X(props: IconProps) {
  return (
    <Svg {...props} viewBox="-2.5 -2.5 29 29">
      <path
        fill="currentColor"
        d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z"
      />
    </Svg>
  );
}

export function Instagram(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <rect x="2" y="2" width="12" height="12" rx="3.6" />
        <circle cx="8" cy="8" r="2.75" />
      </Stroke>
      <circle cx="11.6" cy="4.4" r=".9" fill="currentColor" />
    </Svg>
  );
}

export function Spotify(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 .75a7.25 7.25 0 1 0 0 14.5A7.25 7.25 0 0 0 8 .75Zm3.33 10.47a.53.53 0 0 1-.73.18c-2-1.22-4.5-1.5-7.47-.82a.53.53 0 1 1-.24-1.04c3.24-.74 6.03-.42 8.26.95.25.15.33.48.18.73Zm1.03-2.3a.66.66 0 0 1-.91.22c-2.28-1.4-5.76-1.81-8.46-.99a.66.66 0 1 1-.39-1.27c3.09-.94 6.92-.48 9.54 1.13.31.19.41.6.22.91Zm.09-2.4C9.72 4.9 5.22 4.75 2.62 5.54a.8.8 0 1 1-.46-1.53c2.98-.9 7.95-.73 11.09 1.13a.8.8 0 0 1-.8 1.38Z"
      />
    </Svg>
  );
}

/* ---------------------------------------------------------------------- */
/* actions + places                                                        */
/* ---------------------------------------------------------------------- */

export function Mail(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <rect x="2.25" y="3.25" width="11.5" height="9.5" rx="2.25" />
        <path d="m4.75 6.25 3.25 2.3 3.25-2.3" />
      </Stroke>
    </Svg>
  );
}

export function Calendar(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <rect x="2.25" y="3" width="11.5" height="10.75" rx="2.25" />
        <path d="M2.5 6.75h11M5.5 1.75v2.5M10.5 1.75v2.5" />
      </Stroke>
      <circle cx="5.6" cy="9.9" r=".95" fill="currentColor" />
      <circle cx="8.4" cy="9.9" r=".95" fill="currentColor" />
    </Svg>
  );
}

export function Home(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M7.13 1.72a1.35 1.35 0 0 1 1.74 0l4.6 3.9c.33.28.53.7.53 1.14v6.04c0 .83-.67 1.5-1.5 1.5H10.1v-3.4a1.1 1.1 0 0 0-1.1-1.1H7a1.1 1.1 0 0 0-1.1 1.1v3.4H3.5c-.83 0-1.5-.67-1.5-1.5V6.76c0-.44.2-.86.53-1.14l4.6-3.9Z"
      />
    </Svg>
  );
}

export function Pen(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M10.9 2.03a1.6 1.6 0 0 1 2.27 0l.8.8a1.6 1.6 0 0 1 0 2.27l-6.9 6.9a1.6 1.6 0 0 1-.7.41l-2.9.82a.55.55 0 0 1-.68-.68l.82-2.9c.08-.26.22-.5.41-.7l6.88-6.92Z"
      />
      <path d="M2.75 14.25h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function Folder(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M1.5 4.5c0-1.1.9-2 2-2h2.38c.53 0 1.04.21 1.41.59l.83.82c.18.19.44.29.7.29h3.68c1.1 0 2 .9 2 2v5.3c0 1.1-.9 2-2 2h-9a2 2 0 0 1-2-2v-7Z"
      />
    </Svg>
  );
}

export function Doc(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <rect x="3" y="1.75" width="10" height="12.5" rx="2.25" />
        <path d="M5.75 5.5h4.5M5.75 8h4.5M5.75 10.5H8" />
      </Stroke>
    </Svg>
  );
}

export function Sparkle(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M6.5 3.25c.42 2.62 1.5 3.93 4.25 5-2.75 1.07-3.83 2.38-4.25 5-.42-2.62-1.5-3.93-4.25-5 2.75-1.07 3.83-2.38 4.25-5Z"
      />
      <path
        fill="currentColor"
        d="M12.25 1.5c.2 1.2.7 1.8 1.95 2.3-1.25.5-1.75 1.1-1.95 2.3-.2-1.2-.7-1.8-1.95-2.3 1.25-.5 1.75-1.1 1.95-2.3Z"
      />
      <circle cx="12.6" cy="12.4" r=".9" fill="currentColor" />
    </Svg>
  );
}

export function Moon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        d="M13.1 9.85A5.1 5.1 0 0 1 6.15 2.9a5.45 5.45 0 1 0 6.95 6.95Z"
      />
    </Svg>
  );
}

export function Sun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="2.4" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
      <Stroke width={1.4}>
        <path d="M12.7 8h1.35M11.32 11.32l.96.96M8 12.7v1.35M4.68 11.32l-.96.96M3.3 8H1.95M4.68 4.68l-.96-.96M8 3.3V1.95M11.32 4.68l.96-.96" />
      </Stroke>
    </Svg>
  );
}

export function Monitor(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <rect x="1.75" y="2.5" width="12.5" height="8.75" rx="2" />
        <path d="M5.5 14h5M8 11.25V14" />
      </Stroke>
    </Svg>
  );
}

export function Copy(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <rect x="5.25" y="5.25" width="8.5" height="8.5" rx="2" />
        <path d="M10.75 5.25V4.25a2 2 0 0 0-2-2h-4.5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h1" />
      </Stroke>
    </Svg>
  );
}

export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="m3.5 8.4 2.9 2.85L12.5 5" />
      </Stroke>
    </Svg>
  );
}

export function Close(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
      </Stroke>
    </Svg>
  );
}

export function Search(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke>
        <circle cx="7.25" cy="7.25" r="4.5" />
        <path d="m10.6 10.6 3.15 3.15" />
      </Stroke>
    </Svg>
  );
}

/**
 * Verified badge: a filled rosette with a check cut in the badge colour of
 * the page background. Colour the badge with `text-verified`.
 */
export function Verified(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        d="M8 1l2.2 1.69 2.75.36.36 2.75L15 8l-1.69 2.2-.36 2.75-2.75.36L8 15l-2.2-1.69-2.75-.36-.36-2.75L1 8l1.69-2.2.36-2.75 2.75-.36Z"
      />
      <path
        d="m5.35 8.2 1.75 1.75 3.55-3.8"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ---------------------------------------------------------------------- */
/* day / night (the top bar's switch)                                      */
/* ---------------------------------------------------------------------- */

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI) / 4;
  const inner = 7;
  const outer = i % 2 ? 9 : 10.5;
  const f = (n: number) => n.toFixed(2);
  return `M${f(12 + inner * Math.cos(angle))} ${f(12 + inner * Math.sin(angle))}L${f(12 + outer * Math.cos(angle))} ${f(12 + outer * Math.sin(angle))}`;
}).join("");

/** The sun as an eight-rayed star (rays alternate long and short). */
export function SunStar(props: IconProps) {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d={RAYS} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** A thin crescent moon. */
export function Crescent(props: IconProps) {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <path
        d="M15.5 3.6a8.6 8.6 0 1 0 4.9 13.9A7.2 7.2 0 0 1 15.5 3.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A long, fine arrow pointing up (back to top). */
export function ArrowUp(props: IconProps) {
  return (
    <Svg {...props}>
      <Stroke width={1.3}>
        <path d="M8 14V2.5M3.5 7 8 2.5 12.5 7" />
      </Stroke>
    </Svg>
  );
}

/** Lookup for data-driven places (e.g. site.socials names, intro chips). */
export const SocialIcons = {
  GitHub,
  X,
  Instagram,
  Spotify,
} as const;
