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

/** How a printed character is inked: the board's sand, or a status colour. */
export type Tone = "sand" | "green" | "ochre" | "muted";

export type Glyph = { ch: string; tone: Tone };

export const BLANK: Glyph = { ch: " ", tone: "sand" };

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

/**
 * Lays a message out on the board: words wrapped to the width, every line
 * centred, the block centred on the rows. Words longer than a row are cut.
 */
export function layoutMessage(text: string, rows: number, cols: number): Glyph[][] {
  const words = normalize(text).trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const raw of words) {
    let word = raw;
    while (word.length > cols) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(word.slice(0, cols));
      word = word.slice(cols);
    }
    if (!word) continue;
    if (!line) line = word;
    else if (line.length + 1 + word.length <= cols) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, rows);
  const top = Math.floor((rows - shown.length) / 2);
  return Array.from({ length: rows }, (_, row) => {
    const text = shown[row - top] ?? "";
    const left = Math.floor((cols - text.length) / 2);
    return Array.from({ length: cols }, (_, col) => ({ ch: text[col - left] ?? " ", tone: "sand" as Tone }));
  });
}

/* ---------------------------------------------------------------------- */
/* the timetable                                                           */
/* ---------------------------------------------------------------------- */

export type Remark = "ON TIME" | "BOARDING" | "DEPARTED";

export type Flight = { name: string; remark: Remark; tone: Tone };

const REMARK_TONE: Record<Remark, Tone> = { "ON TIME": "green", BOARDING: "ochre", DEPARTED: "muted" };

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
  for (let i = 0; i < flight.name.length && i < cols; i++) row[i] = { ch: flight.name[i], tone: "sand" };
  const start = cols - flight.remark.length;
  for (let i = 0; i < flight.remark.length; i++) row[start + i] = { ch: flight.remark[i], tone: flight.tone };
  return row;
}

/** Lines the board can be asked for by the shuffle button: short, ours. */
export const MESSAGES: readonly string[] = [
  "Marhaba, welcome aboard",
  "Made in Casablanca",
  "Zero room for jank",
  "Resident tinkerer",
  "Every flap drawn in code",
  "Next stop: your idea",
];

/** The small board on the home and lab tiles: two rows, eight cells. */
export const TILE_COLS = 8;
export const TILE_BOARDS: ReadonlyArray<{ rows: [string, string]; tone: Tone; lamp: Tone | null }> = [
  { rows: ["CASA", "BLANCA"], tone: "sand", lamp: null },
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
