// Project marks: one small, bold, monochrome glyph per project (keyed by the
// slug in content/projects.json). Each is drawn on a 20×20 grid in
// currentColor, with secondary tones done through opacity, so a glyph
// follows the text colour of its tile in both themes.
//
//   <ProjectIcon slug="laya" className="size-5 text-primary" />
//   <ProjectTile slug="laya" />   // the 44px rounded tile used in the rows

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type GlyphProps = { className?: string; title?: string };

function Glyph({ className, title, children }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("block shrink-0", className)}
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

/** AegiLabs: a shield with two agent "eyes", the guardian that runs the work. */
function AegiLabs() {
  return (
    <path
      fillRule="evenodd"
      d="M9.05 2.05a2.5 2.5 0 0 1 1.9 0l5 2.03c.66.27 1.05.88 1.05 1.6v3.7c0 3.97-2.6 7.25-6.35 8.6a1.9 1.9 0 0 1-1.3 0C5.6 16.63 3 13.35 3 9.38v-3.7c0-.72.4-1.33 1.05-1.6l5-2.03ZM7.25 8.4a1 1 0 0 1 2 0v2.2a1 1 0 0 1-2 0V8.4Zm3.5 0a1 1 0 0 1 2 0v2.2a1 1 0 0 1-2 0V8.4Z"
    />
  );
}

/** Liquid Glass: a droplet with a glassy highlight. */
function LiquidGlass() {
  return (
    <path
      fillRule="evenodd"
      d="M9.2 2.75a1 1 0 0 1 1.6 0c1.95 2.55 5.2 6.4 5.2 9.75a6 6 0 0 1-12 0c0-3.35 3.25-7.2 5.2-9.75ZM6.75 12.3a.75.75 0 0 1 1.5.05 2.75 2.75 0 0 0 1.85 2.75.75.75 0 1 1-.5 1.42 4.25 4.25 0 0 1-2.85-4.22Z"
    />
  );
}

/** Laya: three candlesticks, the last one a down candle. */
function Laya() {
  return (
    <>
      <rect x="3.9" y="5.5" width="1.4" height="10" rx=".7" />
      <rect x="2.8" y="8" width="3.6" height="5.5" rx="1.1" />
      <rect x="9.3" y="2.5" width="1.4" height="11" rx=".7" />
      <rect x="8.2" y="4.5" width="3.6" height="7" rx="1.1" />
      <g opacity=".45">
        <rect x="14.7" y="7" width="1.4" height="10.5" rx=".7" />
        <rect x="13.6" y="9.5" width="3.6" height="5.5" rx="1.1" />
      </g>
    </>
  );
}

/** ArchExcellence: a round arch under a cornice. */
function ArchExcellence() {
  return (
    <>
      <rect x="1.75" y="2.75" width="16.5" height="2.5" rx="1" />
      <path d="M3 6.5h14v10a1 1 0 0 1-1 1h-2.6v-6a3.4 3.4 0 0 0-6.8 0v6H4a1 1 0 0 1-1-1v-10Z" />
    </>
  );
}

/** sealed.: a padlock with its keyhole. */
function Sealed() {
  return (
    <>
      <path
        d="M6.4 9V6.6a3.6 3.6 0 0 1 7.2 0V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        fillRule="evenodd"
        d="M3.5 10.9c0-1.33 1.07-2.4 2.4-2.4h8.2c1.33 0 2.4 1.07 2.4 2.4v4.7c0 1.33-1.07 2.4-2.4 2.4H5.9a2.4 2.4 0 0 1-2.4-2.4v-4.7Zm6.5.6a1.4 1.4 0 0 0-.7 2.61v1.24a.7.7 0 0 0 1.4 0v-1.24A1.4 1.4 0 0 0 10 11.5Z"
      />
    </>
  );
}

/** Skillsy: a staircase, with someone about to climb it. */
function Skillsy() {
  return (
    <>
      <path d="M3 17.5a1 1 0 0 1-1-1v-2.25a1 1 0 0 1 1-1h3.25V10a1 1 0 0 1 1-1h3.25V5.75a1 1 0 0 1 1-1H17a1 1 0 0 1 1 1V16.5a1 1 0 0 1-1 1H3Z" />
      <circle cx="5" cy="9" r="1.6" opacity=".45" />
    </>
  );
}

/** Spotify Wrapped: four sound bars. */
function SpotifyWrapped() {
  return (
    <>
      <rect x="2.4" y="6.5" width="2.8" height="7" rx="1.4" />
      <rect x="6.6" y="2.5" width="2.8" height="15" rx="1.4" />
      <rect x="10.8" y="4.75" width="2.8" height="10.5" rx="1.4" />
      <rect x="15" y="7.5" width="2.8" height="5" rx="1.4" opacity=".45" />
    </>
  );
}

/** Comet Chat: a comet with its tail streaming behind it. */
function CometChat() {
  return (
    <>
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M10.6 9.4 3.6 16.4" strokeWidth="2.6" opacity=".45" />
        <path d="M8.3 7.5 4.8 11" strokeWidth="2" opacity=".3" />
        <path d="M12.5 11.7 9 15.2" strokeWidth="2" opacity=".3" />
      </g>
      <circle cx="13.2" cy="6.8" r="4" />
    </>
  );
}

/** HoloGesture: a raised open hand. */
function HoloGesture() {
  return (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M6.6 10V5.1" />
        <path d="M9.8 9.6V3.4" />
        <path d="M13 9.8V4.2" />
        <path d="M16 11V6.6" />
        <path d="M6.2 13.6 3.6 10.9" />
      </g>
      <path d="M5.5 9.2h11.6v3.2a5.6 5.6 0 0 1-5.6 5.6h-.7a5.3 5.3 0 0 1-4.3-2.2L5 14.1a2 2 0 0 1 .5-.9V9.2Z" />
    </>
  );
}

/** EdenMorph: an organic blob with a droplet splitting off. */
function EdenMorph() {
  return (
    <>
      <path d="M8.7 2.9c2.4-.5 3.6 1.4 5.3 2.1 2.2.9 3 2.8 2.4 4.9-.5 1.5-1.6 2.1-1.7 3.7-.1 2.3-2.1 3.8-4.4 3.5-1.5-.2-2.3-1.1-3.8-1.2-2.2-.2-4.1-1.6-4.3-3.9-.2-1.9.9-2.8 1.2-4.4.5-2.5 2.6-4.2 5.3-4.7Z" />
      <circle cx="16.4" cy="16" r="2" opacity=".45" />
    </>
  );
}

/** Fallback for a project without its own mark: a rounded square. */
function Generic() {
  return <rect x="4" y="4" width="12" height="12" rx="3.5" />;
}

const GLYPHS: Record<string, () => ReactNode> = {
  aegilabs: AegiLabs,
  "liquid-glass": LiquidGlass,
  laya: Laya,
  archexcellence: ArchExcellence,
  sealed: Sealed,
  skillsy: Skillsy,
  "spotify-wrapped": SpotifyWrapped,
  "comet-chat": CometChat,
  hologesture: HoloGesture,
  edenmorph: EdenMorph,
};

/** The bare glyph. Size it with a class (`size-5`) and colour it with text-*. */
export function ProjectIcon({ slug, className, title }: GlyphProps & { slug: string }) {
  const Draw = GLYPHS[slug] ?? Generic;
  return (
    <Glyph className={className} title={title}>
      <Draw />
    </Glyph>
  );
}

/** The 44px tile the glyph sits in (radius 13, surface fill, 20px glyph). */
export function ProjectTile({ slug, className }: { slug: string; className?: string }) {
  return (
    <span
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-surface", className)}
    >
      <ProjectIcon slug={slug} className="size-5 text-primary" />
    </span>
  );
}
