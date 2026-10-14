// Masonry for the lab tiles, without JavaScript and without layout shift.
//
// Every tile's place is worked out ahead of time for each column count
// (2 on phones, 3 from a 560px wide container, 4 from 900px when allowed),
// in units of the column width, and written onto the tile as CSS custom
// properties. Container queries pick the set that applies and the tile is
// absolutely positioned with calc() against `100cqw`, so the markup is the
// same for everyone (static export, no hydration mismatch) and keeps the
// natural reading order 1, 2, 3 … in the DOM.
//
//   <Masonry max={3} items={pieces.map((p) => ({ key: p.slug, aspect: p.tile.aspect, children: <LabTile piece={p} /> }))} />
//
// Placement: with three columns the tiles go strictly across the rows
// (columns hold 1/4/7, 2/5/8, 3/6/9), as the home grid is designed; with
// two or four, each tile drops into the shortest column so the ends stay
// level. Pass `rows` to change which counts read strictly across.

import type { CSSProperties, ReactNode } from "react";

export type MasonryItem = {
  key: string;
  /** width / height */
  aspect: number;
  children: ReactNode;
};

type Count = 2 | 3 | 4;

/** Typical column width per count, used to weigh gaps when balancing. */
const TYPICAL_WIDTH: Record<Count, number> = { 2: 170, 3: 204, 4: 287 };

const css = `
.lab-masonry {
  position: relative;
  container-type: inline-size;
}
.lab-masonry > * {
  --cols: 2;
  --gap: var(--g2);
  --x: var(--x2);
  --y: var(--y2);
  --n: var(--n2);
  --h: var(--h2);
  --cw: calc((100cqw - (var(--cols) - 1) * var(--gap)) / var(--cols));
}
.lab-masonry-sizer {
  height: var(--h);
}
.lab-masonry-item {
  position: absolute;
  left: calc(var(--x) * (var(--cw) + var(--gap)));
  top: calc(var(--y) * var(--cw) + var(--n) * var(--gap));
  width: var(--cw);
  height: calc(var(--cw) / var(--aspect));
}
.lab-masonry[data-animate] > .lab-masonry-item {
  transition:
    left 480ms var(--ease-out),
    top 480ms var(--ease-out),
    width 480ms var(--ease-out),
    height 480ms var(--ease-out);
}
.lab-masonry[data-animate] > .lab-masonry-sizer {
  transition: height 480ms var(--ease-out);
}
@media (prefers-reduced-motion: reduce) {
  .lab-masonry[data-animate] > * {
    transition: none;
  }
}
@container (min-width: 560px) {
  .lab-masonry > * {
    --cols: 3;
    --gap: var(--g3);
    --x: var(--x3);
    --y: var(--y3);
    --n: var(--n3);
    --h: var(--h3);
  }
}
@container (min-width: 900px) {
  .lab-masonry[data-max="4"] > * {
    --cols: 4;
    --gap: var(--g4);
    --x: var(--x4);
    --y: var(--y4);
    --n: var(--n4);
    --h: var(--h4);
  }
}
`;

type Placed = { x: number; y: number; n: number };

function place(aspects: readonly number[], cols: Count, gap: number, rows: boolean) {
  const sums = new Array<number>(cols).fill(0);
  const counts = new Array<number>(cols).fill(0);
  const gapUnits = gap / TYPICAL_WIDTH[cols];
  const placed: Placed[] = aspects.map((aspect, index) => {
    let column = index % cols;
    if (!rows) {
      let best = Infinity;
      for (let c = 0; c < cols; c++) {
        const height = sums[c] + counts[c] * gapUnits;
        if (height < best - 1e-6) {
          best = height;
          column = c;
        }
      }
    }
    const spot = { x: column, y: sums[column], n: counts[column] };
    sums[column] += 1 / aspect;
    counts[column] += 1;
    return spot;
  });
  const heights = sums
    .map((sum, c) => (counts[c] ? `calc(${round(sum)} * var(--cw) + ${counts[c] - 1} * var(--gap))` : null))
    .filter(Boolean);
  const height = heights.length === 0 ? "0px" : heights.length === 1 ? heights[0]! : `max(${heights.join(", ")})`;
  return { placed, height };
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;

export function Masonry({
  items,
  max = 3,
  gap = { 2: 8, 3: 8, 4: 8 },
  rows = [3],
  label,
  animate = false,
  className,
}: {
  items: readonly MasonryItem[];
  /** Most columns to use (4 only on wide containers). */
  max?: 3 | 4;
  /** Gap in px per column count. */
  gap?: Partial<Record<Count, number>>;
  /** Column counts that place strictly across the rows. */
  rows?: readonly Count[];
  /** Accessible name for the list. */
  label?: string;
  /** Glide tiles to their new places (turn on briefly while the set changes). */
  animate?: boolean;
  className?: string;
}) {
  const aspects = items.map((item) => item.aspect);
  const gaps: Record<Count, number> = { 2: gap[2] ?? 8, 3: gap[3] ?? gap[2] ?? 8, 4: gap[4] ?? gap[3] ?? 8 };
  const counts: Count[] = max === 4 ? [2, 3, 4] : [2, 3];
  const layouts = counts.map((cols) => ({ cols, ...place(aspects, cols, gaps[cols], rows.includes(cols)) }));

  const vars = (fn: (layout: (typeof layouts)[number]) => Record<string, string | number>) =>
    Object.assign({}, ...layouts.map(fn)) as Record<string, string | number>;

  const containerStyle = {
    "--g2": `${gaps[2]}px`,
    "--g3": `${gaps[3]}px`,
    "--g4": `${gaps[4]}px`,
  } as CSSProperties;

  return (
    <div
      role="list"
      aria-label={label}
      data-max={max}
      data-animate={animate ? "" : undefined}
      className={`lab-masonry ${className ?? ""}`}
      style={containerStyle}
    >
      <style href="lab-masonry" precedence="default">
        {css}
      </style>
      <div
        aria-hidden="true"
        className="lab-masonry-sizer"
        style={vars((layout) => ({ [`--h${layout.cols}`]: layout.height })) as CSSProperties}
      />
      {items.map((item, index) => (
        <div
          key={item.key}
          role="listitem"
          className="lab-masonry-item"
          style={
            {
              "--aspect": round(item.aspect),
              ...vars((layout) => {
                const spot = layout.placed[index];
                return {
                  [`--x${layout.cols}`]: spot.x,
                  [`--y${layout.cols}`]: round(spot.y),
                  [`--n${layout.cols}`]: spot.n,
                };
              }),
            } as CSSProperties
          }
        >
          {item.children}
        </div>
      ))}
    </div>
  );
}
