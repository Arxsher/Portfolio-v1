"use client";

// X, Instagram, Spotify: a small calling card with the avatar (the star
// mark on sand until a photo is set), the name in Fraunces, the handle,
// and a way out to the profile.

import { AvatarFill } from "@/components/avatar";
import { Arrow } from "@/components/ornament";
import { site } from "@/content/site";
import { PANELS, type PanelView } from "../items";
import { Panel, type PanelProps } from "./panel";

export type SocialView = Extract<PanelView, "x" | "instagram" | "spotify">;

const NETWORK: Record<SocialView, string> = { x: "X", instagram: "Instagram", spotify: "Spotify" };

export function SocialPanel({ view, titleId, onBack, onClose }: PanelProps & { view: SocialView }) {
  const network = NETWORK[view];
  const profile = site.socials.find((entry) => entry.name === network);

  return (
    <Panel titleId={titleId} title={PANELS[view].title} onBack={onBack} onClose={onClose}>
      {profile ? (
        <div className="flex flex-wrap items-center gap-4 rounded-paper bg-band p-4 sm:flex-nowrap sm:p-5">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-full shadow-[0_0_0_1px_var(--line)]">
            <AvatarFill mark={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[22px] leading-[1.15] text-primary">{site.name}</p>
            <p className="truncate text-small text-muted">
              {profile.handle} on {network}
            </p>
          </div>
          <a
            href={profile.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="btn btn-soft max-sm:w-full"
          >
            Open
            <Arrow external />
            <span className="sr-only">
              {" "}
              {site.name} on {network} (opens in a new tab)
            </span>
          </a>
        </div>
      ) : null}
    </Panel>
  );
}
