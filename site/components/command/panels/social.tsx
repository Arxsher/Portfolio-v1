"use client";

// X, Instagram, Spotify: a small profile card with the avatar, name and
// handle, and a button out to the profile.

import { AvatarFill } from "@/components/avatar";
import { site } from "@/content/site";
import { VIEWS, type PanelView } from "../items";
import { Panel, panelButtonClass } from "./panel";

export type SocialView = Extract<PanelView, "x" | "instagram" | "spotify">;

const NETWORK: Record<SocialView, { name: string; action: string }> = {
  x: { name: "X", action: "Follow" },
  instagram: { name: "Instagram", action: "Follow" },
  spotify: { name: "Spotify", action: "Open" },
};

export function SocialPanel({ view, onClose }: { view: SocialView; onClose: () => void }) {
  const info = VIEWS[view];
  const network = NETWORK[view];
  const profile = site.socials.find((entry) => entry.name === network.name);

  return (
    <Panel title={info.title} description={info.description} icon={info.icon} onClose={onClose}>
      {profile ? (
        <div className="flex items-center gap-4">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-tile">
            <AvatarFill mark={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-primary">{site.name}</p>
            <p className="truncate text-[13px] text-secondary">{profile.handle}</p>
          </div>
          <a href={profile.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={panelButtonClass}>
            {network.action}
            <span className="sr-only">
              {" "}
              {site.name} on {network.name} (opens in a new tab)
            </span>
          </a>
        </div>
      ) : null}
    </Panel>
  );
}
