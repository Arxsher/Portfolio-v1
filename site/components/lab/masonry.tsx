// Masonry for the lab tiles, without JavaScript and without layout shift.
//
// Every tile's place is worked out ahead of time for each column count
// (2 on phones, 3 from a 560px wide container, 4 from 900px when allowed),
// in units of the column width plus a number of gaps, and written onto the
// tile as CSS custom properties. Container queries pick the set that
// applies and the tile is absolutely positioned with calc() against
// `100cqw`, so the markup is the same for everyone (static export, no
// hydration mismatch) and keeps the natural reading order 1, 2, 3 … in the
// DOM.
//
//   <Masonry max={3} level items={pieces.map((p) => ({ key: p.slug, aspect: p.tile.aspect, children: <LabTile piece={p} /> }))} />
//
// Placement: column counts listed in `rows` place strictly across the rows
// (with three columns: 1/4/7, 2/5/8, 3/6/9); the others drop each tile into
// the shortest column, then try every way of dealing the last row out so
// the columns end as close together as they can.
//
// Level (`level`): the columns then end exactly level at every width. Each
// column's tiles are scaled by the same small factor (a few percent, at
// most MAX_STRETCH) so the columns' heights in column widths agree,
// and a column with fewer tiles shares its missing gaps out among them, so
// the gaps cancel too. Pieces fill their tiles, so a tile a little taller
// or shorter than its aspect still draws properly. When levelling would
// take more than that (a short filtered list, one tile beside two) the
// tiles keep their true shapes instead.

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

/** The most a column's tiles are stretched or squashed to level it. */
const MAX_STRETCH = 0.12;

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
  --hu: var(--hu2);
  --hn: var(--hn2);
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
  height: calc(var(--hu) * var(--cw) + var(--hn) * var(--gap));
}
.lab-masonry[data-animate] > .lab-masonry-item {
  transition:
    left 520ms var(--ease-out),
    top 520ms var(--ease-out),
    width 520ms var(--ease-out),
    height 520ms var(--ease-out);
}
.lab-masonry[data-animate] > .lab-masonry-sizer {
  transition: height 520ms var(--ease-out);
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
    --hu: var(--hu3);
    --hn: var(--hn3);
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
    --hu: var(--hu4);
    --hn: var(--hn4);
    --h: var(--h4);
  }
}
`;

/** A tile's place: column, top (units of column width + gaps), height (the same). */
type Placed = { x: number; y: number; n: number; hu: number; hn: number };

/** Which column each tile goes in. */
function assign(units: readonly number[], cols: Count, gapUnits: number, rows: boolean): number[] {
  if (rows) return units.map((_, index) => index % cols);

  const heights = new Array<number>(cols).fill(0);
  const counts = new Array<number>(cols).fill(0);
  const columns: number[] = [];

  const shortest = (h: readonly number[], n: readonly number[]) => {
    let column = 0;
    let best = Infinity;
    for (let c = 0; c < cols; c++) {
      const end = n[c] ? h[c] + n[c] * gapUnits : 0;
      if (end < best - 1e-6) {
        best = end;
        column = c;
      }
    }
    return column;
  };

  // Greedy: each tile into the shortest column (the leftmost on a tie), as
  // a reader's eye expects.
  for (let index = 0; index < units.length; index++) {
    const column = shortest(heights, counts);
    columns.push(column);
    heights[column] += units[index];
    counts[column] += 1;
  }

  // The last row: try every way of dealing it out (at most 4^4, 3^6 or 2^6
  // options) and keep one only if its column ends are clearly closer than
  // the greedy deal's, never leaving more columns empty.
  const tail = Math.min(units.length, cols === 4 ? 4 : 6);
  const head = units.length - tail;
  for (let k = head; k < units.length; k++) {
    heights[columns[k]] -= units[k];
    counts[columns[k]] -= 1;
  }
  const h = new Array<number>(cols);
  const n = new Array<number>(cols);
  const score = (deal: (k: number) => number) => {
    for (let c = 0; c < cols; c++) {
      h[c] = heights[c];
      n[c] = counts[c];
    }
    for (let k = 0; k < tail; k++) {
      const c = deal(k);
      h[c] += units[head + k];
      n[c] += 1;
    }
    let min = Infinity;
    let max = 0;
    let empty = 0;
    for (let c = 0; c < cols; c++) {
      if (!n[c]) {
        empty++;
        continue;
      }
      const end = h[c] + (n[c] - 1) * gapUnits;
      min = Math.min(min, end);
      max = Math.max(max, end);
    }
    return { empty, spread: max - min };
  };
  const greedy = score((k) => columns[head + k]);
  let bestEmpty = greedy.empty;
  let bestSpread = greedy.spread;
  let bestCode = -1;
  const total = cols ** tail;
  for (let code = 0; code < total; code++) {
    const { empty, spread } = score((k) => Math.floor(code / cols ** k) % cols);
    if (empty < bestEmpty || (empty === bestEmpty && spread < bestSpread - 0.02)) {
      bestEmpty = empty;
      bestSpread = spread;
      bestCode = code;
    }
  }
  if (bestCode >= 0) {
    for (let k = 0; k < tail; k++) columns[head + k] = Math.floor(bestCode / cols ** k) % cols;
  }
  return columns;
}

function place(aspects: readonly number[], cols: Count, gap: number, rows: boolean, level: boolean) {
  const units = aspects.map((aspect) => 1 / Math.max(0.05, aspect));
  const gapUnits = gap / TYPICAL_WIDTH[cols];
  const columns = assign(units, cols, gapUnits, rows);

  const sums = new Array<number>(cols).fill(0);
  const counts = new Array<number>(cols).fill(0);
  columns.forEach((c, index) => {
    sums[c] += units[index];
    counts[c] += 1;
  });

  // Per column: a scale for the tiles' unit heights, and extra gaps per tile.
  const scale = new Array<number>(cols).fill(1);
  const extra = new Array<number>(cols).fill(0);
  const used = sums.map((sum, c) => (counts[c] ? sum : 0)).filter(Boolean);
  const most = Math.max(0, ...counts);
  if (level && used.length > 1 && most > 1) {
    const min = Math.min(...used);
    const max = Math.max(...used);
    // The target that stretches the shortest column as much as it squashes
    // the tallest, so neither moves far from its true shapes. If that is
    // more than MAX_STRETCH (say one tile beside two), the tiles keep their
    // shapes and the ends stay ragged: half-levelled is the worst of both.
    const target = 2 / (1 / min + 1 / max);
    if (target / min - 1 <= MAX_STRETCH) {
      for (let c = 0; c < cols; c++) {
        if (!counts[c]) continue;
        scale[c] = target / sums[c];
        extra[c] = (most - counts[c]) / counts[c];
      }
    }
  }

  const tops = new Array<number>(cols).fill(0);
  const seen = new Array<number>(cols).fill(0);
  const placed: Placed[] = units.map((unit, index) => {
    const c = columns[index];
    const hu = unit * scale[c];
    const spot = { x: c, y: tops[c], n: seen[c] * (1 + extra[c]), hu, hn: extra[c] };
    tops[c] += hu;
    seen[c] += 1;
    return spot;
  });

  const heights = tops
    .map((top, c) =>
      counts[c] ? `calc(${round(top)} * var(--cw) + ${round(counts[c] - 1 + counts[c] * extra[c])} * var(--gap))` : null,
    )
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
  level = false,
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
  /** End every column level (tiles stretch a few percent to fit). */
  level?: boolean;
  /** Accessible name for the list. */
  label?: string;
  /** Glide tiles to their new places (turn on briefly while the set changes). */
  animate?: boolean;
  className?: string;
}) {
  const aspects = items.map((item) => item.aspect);
  const gaps: Record<Count, number> = { 2: gap[2] ?? 8, 3: gap[3] ?? gap[2] ?? 8, 4: gap[4] ?? gap[3] ?? 8 };
  const counts: Count[] = max === 4 ? [2, 3, 4] : [2, 3];
  const layouts = counts.map((cols) => ({ cols, ...place(aspects, cols, gaps[cols], rows.includes(cols), level) }));

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
            vars((layout) => {
              const spot = layout.placed[index];
              return {
                [`--x${layout.cols}`]: spot.x,
                [`--y${layout.cols}`]: round(spot.y),
                [`--n${layout.cols}`]: round(spot.n),
                [`--hu${layout.cols}`]: round(spot.hu),
                [`--hn${layout.cols}`]: round(spot.hn),
              };
            }) as CSSProperties
          }
        >
          {item.children}
        </div>
      ))}
    </div>
  );
}
