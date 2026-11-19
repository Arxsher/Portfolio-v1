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
  /** Per row: the tone its lamp lights with once the row has landed (undefined: nothing waiting). */
  private pendingLamps: Array<string | undefined> = [];

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

  /**
   * Lamps per row. A row that is turning has its lamp put out at once, and
   * it lights with its new tone when the row's last flap lands (see
   * updateLamps); a row that stays as it is keeps or takes its tone now.
   * Call after show().
   */
  setLamps(tones: ReadonlyArray<Tone | null>) {
    this.pendingLamps = [];
    this.lamps.forEach((lamp, row) => {
      const tone = tones[row];
      const value = tone === "green" || tone === "amber" ? tone : "";
      if (this.rowTurning(row)) {
        delete lamp.dataset.tone;
        this.pendingLamps[row] = value;
      } else {
        lampTone(lamp, value);
      }
    });
  }

  /** Lights the lamps of rows that have come to rest. Call once a frame (cheap when nothing waits). */
  updateLamps() {
    for (let row = 0; row < this.pendingLamps.length; row++) {
      const value = this.pendingLamps[row];
      if (value === undefined || this.rowTurning(row)) continue;
      this.pendingLamps[row] = undefined;
      const lamp = this.lamps[row];
      if (lamp) lampTone(lamp, value);
    }
  }

  private rowTurning(row: number): boolean {
    const cells = this.cells[row];
    if (!cells) return false;
    for (const cell of cells) if (this.engine.turning(cell)) return true;
    return false;
  }

  /** The cell under an element (or one of its halves). */
  cellAt(target: Element | null): Cell | undefined {
    const el = target?.closest?.(".sf-cell");
    return el ? this.lookup.get(el) : undefined;
  }

  /** Where a cell sits on the board, or null if it is not on it. */
  positionOf(cell: Cell): { row: number; col: number } | null {
    for (let row = 0; row < this.cells.length; row++) {
      const col = this.cells[row].indexOf(cell);
      if (col >= 0) return { row, col };
    }
    return null;
  }

  destroy() {
    this.pendingLamps = [];
    while (this.rowEls.length) this.dropRow();
  }
}

function lampTone(lamp: HTMLElement, value: string) {
  if ((lamp.dataset.tone ?? "") === value) return;
  if (value) lamp.dataset.tone = value;
  else delete lamp.dataset.tone;
}
