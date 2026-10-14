// Home: the lab section. Design shots on card-coloured tiles in a masonry
// of three columns (two on phones). Each shot sits centred on its tile as a
// small rounded print with a soft shadow; hovering lifts it slightly and
// shows its title in a chip, clicking opens it large in the lightbox.
//
//   lab / 05
//   ┌──────┐ ┌──────┐ ┌──────┐
//   │      │ │      │ │      │
//   └──────┘ │      │ │      │
//   ┌──────┐ └──────┘ │      │
//   │      │ ┌──────┐ │      │
//   │      │ │      │ │      │
//   └──────┘ └──────┘ └──────┘
//
// The masonry is plain CSS columns, so the reading order goes down the
// first column, then the next. Tile heights come from FRAMES below: they
// are picked so that the five current shots end level in both layouts
// (three columns: 2 + 2 + 1 tall tile; two columns: 3 + 2). New shots
// without an entry get a tile that fits their own aspect ratio.

import { LightboxGallery, type LightboxItem } from "@/components/lightbox";
import { Section } from "@/components/section";
import { site } from "@/content/site";
import { pad } from "@/lib/format";

export type LabItem = {
  slug: string;
  title: string;
  caption?: string;
  image: string;
  width: number;
  height: number;
};

type Frame = {
  /** Tile aspect ratio (width / height). */
  tile: number;
  /** Show the shot cropped to this aspect ratio (object-fit: cover). */
  crop?: { aspect: number; position?: string };
};

/** Share of the tile width the shot takes up. */
const SHOT_WIDTH = 0.8;

// Tile proportions, written as "column width / tile height" at the 204px
// desktop column. The pairs in the first two columns add up to the tall
// tile in the third (210 + 150 = 180 + 180 = 368 - 8px gap); on phones the
// same order splits 3 + 2 and lands level as well.
const FRAMES: Record<string, Frame> = {
  "fact-checker": { tile: 204 / 210 },
  "word-ladder": { tile: 204 / 150 },
  "car-climate": { tile: 204 / 180 },
  "growth-spring": { tile: 204 / 180 },
  // A tall tile: the phone in the middle of this shot, cropped to portrait.
  wormhole: { tile: 204 / 368, crop: { aspect: 0.64, position: "50% 0%" } },
};

const ORDER = Object.keys(FRAMES);

function frameFor(item: LabItem): Frame {
  const known = FRAMES[item.slug];
  if (known) return known;
  // Fallback: the shot at SHOT_WIDTH plus a mat of 14% of the width above
  // and below it.
  const shotHeight = (SHOT_WIDTH * item.height) / item.width;
  return { tile: 1 / (shotHeight + 0.28) };
}

function arrange(items: ReadonlyArray<LabItem>): LabItem[] {
  const rank = (item: LabItem) => {
    const at = ORDER.indexOf(item.slug);
    return at === -1 ? ORDER.length : at;
  };
  // Array.prototype.sort is stable, so unknown items keep their order.
  return [...items].sort((a, b) => rank(a) - rank(b));
}

export function Lab() {
  return (
    <Section id="lab" label="lab" count={pad(site.lab.length, 2)}>
      <LabGrid items={site.lab} />
    </Section>
  );
}

export function LabGrid({ items }: { items: ReadonlyArray<LabItem> }) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[20px] bg-surface text-[14px] text-tertiary">
        Nothing in the lab yet.
      </div>
    );
  }

  const ordered = arrange(items);
  const shots: LightboxItem[] = ordered.map((item) => ({
    src: item.image,
    width: item.width,
    height: item.height,
    title: item.title,
    caption: item.caption,
  }));

  return (
    <LightboxGallery items={shots}>
      {/* Tiles carry their 8px gap as bottom padding (padding, unlike margin,
          is never dropped at a column end), and the list pulls the last gap
          back so the section ends at the bottom of the tallest column. */}
      <ul className="-mb-2 columns-2 gap-2 sm:columns-3">
        {ordered.map((item, index) => (
          <LabTile key={item.slug} item={item} index={index} />
        ))}
      </ul>
    </LightboxGallery>
  );
}

function LabTile({ item, index }: { item: LabItem; index: number }) {
  const frame = frameFor(item);
  const crop = frame.crop;
  return (
    <li className="break-inside-avoid pb-2">
      <a
        href={item.image}
        data-lightbox-index={index}
        aria-haspopup="dialog"
        aria-label={`${item.title}, view larger`}
        className="group relative flex items-center justify-center overflow-hidden rounded-[20px] bg-surface outline-none transition-[background-color,scale] duration-200 ease-out hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.985]"
        style={{ aspectRatio: frame.tile }}
      >
        <img
          src={item.image}
          width={item.width}
          height={item.height}
          alt=""
          loading="lazy"
          draggable={false}
          data-still=""
          className="block h-auto rounded-[10px] shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.06),0_8px_18px_-6px_rgb(0_0_0/0.16)] transition-[scale,filter] duration-300 ease-out select-none group-hover:scale-[1.04] dark:brightness-[0.94] dark:group-hover:brightness-100 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.3),0_10px_22px_-8px_rgb(0_0_0/0.6)]"
          style={{
            width: `${SHOT_WIDTH * 100}%`,
            ...(crop
              ? { aspectRatio: crop.aspect, objectFit: "cover", objectPosition: crop.position ?? "50% 50%" }
              : null),
          }}
        />
        <span className="pointer-events-none absolute bottom-3 left-3 flex h-6 max-w-[calc(100%-24px)] translate-y-1 items-center gap-1 rounded-[8px] bg-raised px-2 text-[12px] text-primary opacity-0 shadow-tray transition-[opacity,translate] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <span className="truncate">{item.title}</span>
          <Expand className="text-tertiary" />
        </span>
      </a>
    </li>
  );
}

/** Two small arrows pointing out of the corners: "view larger". */
function Expand({ className }: { className?: string }) {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
    >
      <g stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.25 2.75h4v4M13.25 2.75 9 7" />
        <path d="M6.75 13.25h-4v-4M2.75 13.25 7 9" />
      </g>
    </svg>
  );
}
