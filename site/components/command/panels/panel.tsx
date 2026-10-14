"use client";

// Shared chrome for every view of the command bar:
//
//   ┌──────────────────────────────────────────────┐
//   │ [▣]  Title                                 × │   36px tile, 15px title
//   │      One line on what this is.               │   13px description
//   │                                              │
//   │  body …                                      │   scrolls past 64vh
//   │ ──────────────────────────────────────────── │   hairline above the input
//
// The body keeps its full width while the dock widens around it (it is
// centred and clipped), so nothing reflows during the open animation.

import type { ReactNode } from "react";
import {
  Calendar,
  Close,
  Doc,
  Folder,
  GitHub,
  Home,
  Instagram,
  Mail,
  Moon,
  Pen,
  Sparkle,
  Spotify,
  X,
} from "@/components/icons";
import type { IconName } from "../items";

/** Brand marks read a touch large next to the glyphs, so they draw smaller (X by 2px, GitHub and Spotify by 1px). */
export function ViewIcon({ name, size = 14 }: { name: IconName; size?: number }) {
  switch (name) {
    case "home":
      return <Home size={size} />;
    case "pen":
      return <Pen size={size} />;
    case "calendar":
      return <Calendar size={size} />;
    case "mail":
      return <Mail size={size} />;
    case "folder":
      return <Folder size={size} />;
    case "doc":
      return <Doc size={size} />;
    case "sparkle":
      return <Sparkle size={size} />;
    case "moon":
      return <Moon size={size} />;
    case "github":
      return <GitHub size={size - 1} />;
    case "x":
      return <X size={size - 2} />;
    case "instagram":
      return <Instagram size={size} />;
    case "spotify":
      return <Spotify size={size - 1} />;
  }
}

/** The content column inside the dock: full panel width, centred while the dock animates. */
export const columnStyle = { width: "min(540px, calc(100vw - 24px))" } as const;

/** The hairline between a view and the input row. */
export function Hairline() {
  return <div aria-hidden="true" className="mx-3 h-px bg-border" />;
}

export function Panel({
  label,
  title,
  description,
  icon,
  onClose,
  children,
}: {
  /** Accessible name of the view (defaults to the title). */
  label?: string;
  title: string;
  description: ReactNode;
  icon: IconName;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <section aria-label={label ?? title} className="w-full">
      <div
        className="relative left-1/2 max-h-[min(64vh,580px,calc(var(--dock-room,100vh)_-_120px))] -translate-x-1/2 overflow-y-auto overscroll-contain p-3"
        style={columnStyle}
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-tile text-primary">
            <ViewIcon name={icon} />
          </span>
          <div className="min-w-0 flex-1 leading-[1.35]">
            <h2 className="text-[15px] font-medium text-primary">{title}</h2>
            {typeof description === "string" ? (
              <p className="text-[13px] text-secondary">{description}</p>
            ) : (
              description
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-me-1 -mt-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[12px] text-tertiary outline-none transition-colors duration-150 hover:bg-well hover:text-primary focus-visible:bg-well focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
          >
            <Close size={15} />
          </button>
        </div>
        {children}
      </div>
      <Hairline />
    </section>
  );
}

/** The solid 36px button used inside panels (Send, Follow, Say hi instead). */
export const panelButtonClass =
  "relative inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-ink px-4 text-[14px] font-medium text-on-ink transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] disabled:cursor-default disabled:opacity-60 disabled:active:scale-100 focus-ring";

/** The soft row used by list-like views (writing posts, projects). */
export const panelRowClass =
  "-mx-2 flex items-center gap-3 rounded-[14px] p-2 outline-none transition-colors duration-150 ease-out hover:bg-tile focus-visible:bg-tile focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";
