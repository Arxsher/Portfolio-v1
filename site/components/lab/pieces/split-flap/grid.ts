// Rows of cells (and a lamp per row) built into a container element, plus
// the stagger that makes a board change ripple: left to right along a row,
// top to bottom down the board, each cell a few ms off its neighbour.

import { BLANK, DRUM, type Glyph, type Tone } from "./drum";
import type { Cell, FlapEngine } from "./engine";

export type Stagger = (row: number, col: number) => number;

/** The usual ripple: along the row, then down the board, with a little scatter. */
export const ripple =
  (random: () => number = Math.random, along = 0.024, down = 0.07): Stagger =>
  (row, col) =>
    col * along + row * down + random() * 0.03;

export class FlapGrid {
  rows = 0;
  cols = 0;
  /** True until the grid has been shown something (its first board can simply appear). */
  fresh = true;
  readonly cells: Cell[][] = [];
  private readonly rowEls: HTMLDivElement[] = [];
  private readonly lamps: HTMLSpanElement[] = [];
  private readonly lookup = new WeakMap<Element, Cell>();
  private lampTimers: number[] = [];

  constructor(
    private readonly engine: FlapEngine,
    private readonly container: HTMLElement,
    private readonly withLamps = false,
  ) {}

  /** Change the shape. Rows that stay keep their cells; a new width rebuilds every row. */
  resize(rows: number, cols: number) {
    if (rows === this.rows && cols === this.cols) return;
    if (cols !== this.cols) {
      while (this.rowEls.length) this.dropRow();
      this.cols = cols;
    }
    while (this.rowEls.length > rows) this.dropRow();
    while (this.rowEls.length < rows) this.addRow();
    this.rows = rows;
  }

  private addRow() {
    const row = document.createElement("div");
    row.className = "sf-row";
    const cells: Cell[] = [];
    for (let col = 0; col < this.cols; col++) {
      const cell = this.engine.create(DRUM, BLANK);
      cell.pan = this.cols > 1 ? (col / (this.cols - 1)) * 2 - 1 : 0;
      this.lookup.set(cell.el, cell);
      row.appendChild(cell.el);
      cells.push(cell);
    }
    if (this.withLamps) {
      const lamp = document.createElement("span");
      lamp.className = "sf-lamp";
      row.appendChild(lamp);
      this.lamps.push(lamp);
    }
    this.container.appendChild(row);
    this.rowEls.push(row);
    this.cells.push(cells);
  }

  private dropRow() {
    const row = this.rowEls.pop();
    const cells = this.cells.pop();
    cells?.forEach((cell) => this.engine.release(cell));
    this.lamps.pop();
    row?.remove();
  }

  /** Turn the board to `lines` (rows × cols), rippling, or all at once. */
  show(lines: Glyph[][], { instant = false, stagger = ripple() }: { instant?: boolean; stagger?: Stagger } = {}) {
    this.fresh = false;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        const glyph = lines[row]?.[col] ?? BLANK;
        if (instant) this.engine.place(cell, glyph);
        else this.engine.set(cell, glyph, stagger(row, col));
      }
    }
  }

  /** Lamps per row; each lights when its row has had time to turn over. */
  setLamps(tones: ReadonlyArray<Tone | null>, delayFor: (row: number) => number = () => 0) {
    this.lampTimers.forEach((timer) => window.clearTimeout(timer));
    this.lampTimers = [];
    this.lamps.forEach((lamp, row) => {
      const tone = tones[row];
      const value = tone === "green" || tone === "ochre" ? tone : "";
      if ((lamp.dataset.tone ?? "") === value) return;
      const apply = () => {
        if (value) lamp.dataset.tone = value;
        else delete lamp.dataset.tone;
      };
      const delay = delayFor(row);
      if (delay <= 0) apply();
      else this.lampTimers.push(window.setTimeout(apply, delay * 1000));
    });
  }

  /** The cell under an element (or one of its halves). */
  cellAt(target: Element | null): Cell | undefined {
    const el = target?.closest?.(".sf-cell");
    return el ? this.lookup.get(el) : undefined;
  }

  destroy() {
    this.lampTimers.forEach((timer) => window.clearTimeout(timer));
    while (this.rowEls.length) this.dropRow();
  }
}
