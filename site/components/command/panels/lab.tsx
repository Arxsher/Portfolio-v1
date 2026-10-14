"use client";

// "The lab": the design shots as a three-column grid of square tiles with
// the title under each. A tile takes you to the lab section, where the
// shot opens large.

import { useState } from "react";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { VIEWS } from "../items";
import { Panel } from "./panel";

type Shot = (typeof site.lab)[number];

function Tile({ shot, onOpen }: { shot: Shot; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <li>
      <a
        href="/#lab"
        onClick={(event) => {
          event.preventDefault();
          onOpen();
        }}
        className="group block rounded-[16px] focus-ring"
      >
        <span
          className={cn(
            "flex aspect-square items-center justify-center overflow-hidden rounded-[16px] bg-tile p-2 transition-[background-color] duration-150 group-hover:bg-tile-hover",
            !loaded && "skeleton",
          )}
        >
          <img
            src={shot.image}
            width={shot.width}
            height={shot.height}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            ref={(image) => {
              if (image?.complete && image.naturalWidth > 0) setLoaded(true);
            }}
            className={cn(
              "h-auto max-h-full w-auto max-w-full rounded-[8px] object-contain transition-[scale,opacity] duration-300 ease-out group-hover:scale-[1.04]",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </span>
        <span className="mt-1.5 flex items-center gap-1 px-1 text-[12px] text-secondary">
          <span className="truncate">{shot.title}</span>
        </span>
      </a>
    </li>
  );
}

export function LabPanel({ onClose, onOpenLab }: { onClose: () => void; onOpenLab: () => void }) {
  const info = VIEWS.lab;
  return (
    <Panel title={info.title} description={info.description} icon="sparkle" onClose={onClose}>
      {site.lab.length ? (
        <ul className="grid grid-cols-3 gap-2">
          {site.lab.map((shot) => (
            <Tile key={shot.slug} shot={shot} onOpen={onOpenLab} />
          ))}
        </ul>
      ) : (
        <p className="flex h-28 items-center justify-center rounded-[16px] bg-tile text-[14px] text-tertiary">
          Nothing in the lab yet.
        </p>
      )}
    </Panel>
  );
}
