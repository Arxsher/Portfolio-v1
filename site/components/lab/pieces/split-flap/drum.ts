// What the board can show, and what it shows.
//
// A split-flap cell is a drum of flaps that only turns one way, so a cell
// gets from one character to another by passing every flap in between.
// The order below is the order of the flaps on the drum: blank first, then
// the alphabet, figures and a little punctuation, as on the real boards.

import projects from "@/content/projects.json";

export const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-/'!?&+@#";
/** The clock's own drums: hour tens, hour units, minute tens, minute units. */
export const CLOCK_DRUMS = ["012", "0123456789", "012345", "0123456789"] as const;

/** How a printed character is inked: the board's plain white ink, or a status colour. */
export type Tone = "ink" | "green" | "amber" | "muted";

export type Glyph = { ch: string; tone: Tone };

export const BLANK: Glyph = { ch: " ", tone: "ink" };

/** Folds anything typed onto the drum: upper case, no accents, unknown marks become blanks. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .split("")
    .map((ch) => (DRUM.includes(ch) ? ch : " "))
    .join("");
}

/** Greedy word wrap to `width`; words longer than that are cut. */
function wrap(words: readonly string[], width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const raw of words) {
    let word = raw;
    while (word.length > width) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    if (!word) continue;
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The words split into exactly `count` lines of at most `cols`, as evenly as
 * possible: the longest line as short as it can be, then the least ragged
 * of those. Null when it cannot be done (too few words, or a word too long).
 */
function split(words: readonly string[], count: number, cols: number): string[] | null {
  const n = words.length;
  if (count < 1 || count > n) return null;
  // width of words[j..i) on one line
  const starts = [0];
  for (const word of words) starts.push(starts[starts.length - 1] + word.length + 1);
  const width = (j: number, i: number) => starts[i] - starts[j] - 1;
  const fill = (cost: (j: number, i: number) => number, combine: (before: number, line: number) => number) => {
    const best: number[][] = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(Infinity));
    const from: number[][] = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(-1));
    best[0][0] = 0;
    for (let k = 1; k <= count; k++) {
      for (let i = k; i <= n; i++) {
        for (let j = k - 1; j < i; j++) {
          if (best[k - 1][j] === Infinity) continue;
          const line = cost(j, i);
          if (line === Infinity) continue;
          const value = combine(best[k - 1][j], line);
          if (value < best[k][i]) {
            best[k][i] = value;
            from[k][i] = j;
          }
        }
      }
    }
    return { total: best[count][n], from };
  };
  const longest = fill((j, i) => (width(j, i) <= cols ? width(j, i) : Infinity), Math.max).total;
  if (longest === Infinity) return null;
  const even = fill(
    (j, i) => (width(j, i) <= longest ? (longest - width(j, i)) ** 2 : Infinity),
    (before, line) => before + line,
  );
  const lines: string[] = [];
  for (let k = count, i = n; k > 0; k--) {
    const j = even.from[k][i];
    lines.unshift(words.slice(j, i).join(" "));
    i = j;
  }
  return lines;
}

/**
 * Lays a message out on the board: words wrapped to the width and the
 * lines evened out, every line centred, the block centred on the rows (a
 * touch high when it cannot be exact, as the optical centre is). A short
 * message that would sit on one line in a field of blank flaps is spread
 * over a number of lines that centres exactly: two on an even board, three
 * on an odd one tall enough. Words longer than a row are cut.
 */
export function layoutMessage(text: string, rows: number, cols: number): Glyph[][] {
  const words = normalize(text).trim().split(/\s+/).filter(Boolean);
  let lines = wrap(words, cols);
  if (lines.length > 1 && lines.length <= rows) {
    lines = split(words, lines.length, cols) ?? lines;
  } else if (lines.length === 1 && words.length >= 2) {
    const spread = rows % 2 === 0 ? 2 : rows >= 5 && words.length >= 3 ? 3 : 1;
    if (spread > 1) lines = split(words, spread, cols) ?? lines;
  }
  const shown = lines.slice(0, rows);
  const top = Math.floor((rows - shown.length) / 2);
  return Array.from({ length: rows }, (_, row) => {
    const text = shown[row - top] ?? "";
    const left = Math.floor((cols - text.length) / 2);
    return Array.from({ length: cols }, (_, col) => ({ ch: text[col - left] ?? " ", tone: "ink" as Tone }));
  });
}

/* ---------------------------------------------------------------------- */
/* the timetable                                                           */
/* ---------------------------------------------------------------------- */

export type Remark = "ON TIME" | "BOARDING" | "DEPARTED";

export type Flight = { name: string; remark: Remark; tone: Tone };

const REMARK_TONE: Record<Remark, Tone> = { "ON TIME": "green", BOARDING: "amber", DEPARTED: "muted" };

/**
 * Zakaria's projects as departures: work in progress is boarding, this
 * year's launches are on time, earlier ones have left.
 */
export const FLIGHTS: readonly Flight[] = projects.map((project) => {
  const inProgress = project.category === "wip" || /progress/i.test(project.date);
  const remark: Remark = inProgress ? "BOARDING" : /2026/.test(project.date) ? "ON TIME" : "DEPARTED";
  return { name: normalize(project.name).trim(), remark, tone: REMARK_TONE[remark] };
});

/** The flights that fit a row of `cols` cells (name, a gap, the remark). */
export function flightsFor(cols: number): Flight[] {
  return FLIGHTS.filter((flight) => flight.name.length + 1 + flight.remark.length <= cols);
}

/** One timetable row: the destination from the left, the remark flush right. */
export function flightRow(flight: Flight | undefined, cols: number): Glyph[] {
  const row: Glyph[] = Array.from({ length: cols }, () => BLANK);
  if (!flight) return row;
  for (let i = 0; i < flight.name.length && i < cols; i++) row[i] = { ch: flight.name[i], tone: "ink" };
  const start = cols - flight.remark.length;
  for (let i = 0; i < flight.remark.length; i++) row[start + i] = { ch: flight.remark[i], tone: flight.tone };
  return row;
}

/** Lines the board can be asked for by the shuffle button: short, ours. */
export const MESSAGES: readonly string[] = [
  "Marhaba, welcome aboard",
  "Made in Morocco",
  "Zero room for jank",
  "Resident tinkerer",
  "Every flap drawn in code",
  "Next stop: your idea",
];

/** The small board on the home and lab tiles: two rows, eight cells. */
export const TILE_COLS = 8;
export const TILE_BOARDS: ReadonlyArray<{ rows: [string, string]; tone: Tone; lamp: Tone | null }> = [
  { rows: ["CASA", "BLANCA"], tone: "ink", lamp: null },
  ...FLIGHTS.filter((flight) => flight.name.length <= TILE_COLS)
    .slice(0, 4)
    .map((flight) => ({ rows: [flight.name, flight.remark] as [string, string], tone: flight.tone, lamp: flight.tone })),
];

/** A centred row of `cols` glyphs. */
export function centred(text: string, cols: number, tone: Tone): Glyph[] {
  const value = normalize(text).slice(0, cols);
  const left = Math.floor((cols - value.length) / 2);
  return Array.from({ length: cols }, (_, col) => ({ ch: value[col - left] ?? " ", tone }));
}
