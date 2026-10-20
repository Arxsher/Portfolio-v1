// The wall's state, kept outside React: which pattern, which glazes, where
// every piece sits on the canvas and when each one changes. piece.tsx owns
// one of these, feeds it sizes and gestures, and hands its buffers to the
// renderer.
//
// Time is the piece's own clock (seconds the frame loop has run), so a
// ripple paused offscreen picks up where it stopped.

import { buildPattern, type Fold, type Pattern, type Pt } from "./geometry";
import { COLOURING_COUNT, glazeWall, hashInts, paletteById, type PaletteId } from "./glaze";
import { layWall, pieceAt, rings, type Wall } from "./mesh";
import { TILE_STRIDE } from "./renderer";
import type { Step } from "./sound";

export type Mode = "tile" | "stage";

const patterns = new Map<Fold, Pattern>();
export function patternFor(fold: Fold): Pattern {
  let pattern = patterns.get(fold);
  if (!pattern) {
    pattern = buildPattern(fold);
    patterns.set(fold, pattern);
  }
  return pattern;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * How big the pattern is drawn and where its centre rosette sits. The
 * tile's panel shows about three stars across, the medallion's centre star
 * and its first ring of glaze; the
 * sixteen-fold is drawn small enough that about three rosettes stand one
 * above the other and their ring of petals reads.
 */
function framing(fold: Fold, mode: Mode, width: number, height: number): { scale: number; centre: Pt } {
  if (mode === "tile") return { scale: width / 3.3, centre: { x: width / 2, y: height / 2 } };
  const m = Math.min(width, height);
  const scale = fold === 8 ? clamp(m / 7.2, 44, 84) : fold === 12 ? clamp(m / 2.45, 128, 236) : clamp(m / 3.2, 110, 190);
  return { scale, centre: { x: width / 2, y: height / 2 } };
}

/** Speed of the ripple (CSS px per second) and of the laying (faster, tighter). */
const RIPPLE_SPEED = 760;
const LAY_SPEED = 1300;
/** How long a re-glaze keeps the wall busy after the last piece turns (wipe, rocking, wet sheen). */
const SETTLE = 2.2;

export class Wallworks {
  readonly mode: Mode;
  fold: Fold = 8;
  palette: PaletteId = "fes";
  colouring = 0;
  seed = 1;
  wall: Wall | null = null;
  tiles = new Float32Array(0);
  width = 0;
  height = 0;
  /** The clock time after which nothing on the wall is still changing. */
  busyUntil = 0;
  /** Set when buffers need re-uploading. */
  geometryDirty = true;
  tilesDirty = true;

  constructor(mode: Mode) {
    this.mode = mode;
  }

  /** Lay the wall out for a new size (keeps the glazes). Returns true when it changed. */
  resize(width: number, height: number): boolean {
    if (width < 2 || height < 2) return false;
    if (this.wall && Math.abs(width - this.width) < 0.5 && Math.abs(height - this.height) < 0.5) return false;
    this.width = width;
    this.height = height;
    this.rebuild();
    return true;
  }

  private rebuild() {
    const { scale, centre } = framing(this.fold, this.mode, this.width, this.height);
    this.wall = layWall(patternFor(this.fold), {
      width: this.width,
      height: this.height,
      scale,
      centre,
      margin: 8,
    });
    const n = this.wall.pieces.length;
    this.tiles = new Float32Array(n * TILE_STRIDE);
    const colours = this.glazes(this.palette, this.colouring, this.seed);
    for (const piece of this.wall.pieces) {
      const o = piece.index * TILE_STRIDE;
      const c = piece.index * 3;
      this.tiles.set([colours[c], colours[c + 1], colours[c + 2], -1e4], o);
      this.tiles.set([colours[c], colours[c + 1], colours[c + 2], -1e4], o + 4);
      this.tiles[o + 8] = piece.centre.x;
      this.tiles[o + 9] = piece.centre.y;
      this.tiles[o + 10] = hashInts(piece.i, piece.j, piece.k, 77);
      this.tiles[o + 11] = 0;
    }
    this.geometryDirty = true;
    this.tilesDirty = true;
  }

  private glazes(palette: PaletteId, colouring: number, seed: number): Float32Array {
    const wall = this.wall!;
    const out = new Float32Array(wall.pieces.length * 3);
    glazeWall(wall.pieces, this.fold, paletteById(palette), colouring, seed, out, 3, 0, wall.origin, wall.scale);
    return out;
  }

  /** Switch pattern: the new wall is laid from the centre outward (or at once). */
  setFold(fold: Fold, now: number, animate: boolean): Step[] {
    if (fold === this.fold && this.wall) return [];
    this.fold = fold;
    if (!this.width) return [];
    this.rebuild();
    return this.lay(now, animate);
  }

  /** Set every piece from the centre outward, ring by ring. */
  lay(now: number, animate: boolean, delay = 0): Step[] {
    const wall = this.wall;
    if (!wall) return [];
    if (!animate) {
      for (let i = 0; i < wall.pieces.length; i++) this.tiles[i * TILE_STRIDE + 7] = -1e4;
      this.tilesDirty = true;
      return [];
    }
    const start = pieceAt(wall, this.width / 2, this.height / 2);
    const hops = rings(wall, start);
    const step = wall.hop / LAY_SPEED;
    let last = 0;
    for (const piece of wall.pieces) {
      const jitter = (hashInts(piece.i, piece.j, piece.k, 5) - 0.5) * step * 0.8;
      const t = now + delay + hops[piece.index] * step + jitter;
      this.tiles[piece.index * TILE_STRIDE + 7] = t;
      last = Math.max(last, t);
    }
    this.busyUntil = Math.max(this.busyUntil, last + 1);
    this.tilesDirty = true;
    return this.steps(hops, step, delay);
  }

  /**
   * Re-glaze from (x, y): the next colouring (or `palette`) spreads out from
   * the piece under the point, one ring of neighbours at a time. `fade`
   * swaps every piece at once with a short cross-fade (reduced motion).
   */
  reglaze(x: number, y: number, now: number, { palette, fade = false }: { palette?: PaletteId; fade?: boolean } = {}): Step[] {
    const wall = this.wall;
    if (!wall) return [];
    if (palette) this.palette = palette;
    else this.colouring = (this.colouring + 1) % COLOURING_COUNT;
    this.seed += 1;
    const next = this.glazes(this.palette, this.colouring, this.seed);
    const hops = fade ? new Int32Array(wall.pieces.length) : rings(wall, pieceAt(wall, x, y));
    const step = fade ? 0 : wall.hop / RIPPLE_SPEED;
    let last = now;
    for (const piece of wall.pieces) {
      const o = piece.index * TILE_STRIDE;
      const c = piece.index * 3;
      const flip = this.tiles[o + 3];
      const jitter = fade ? 0 : (hashInts(piece.i, piece.j, piece.k, this.seed) - 0.5) * step * 0.6;
      const arrive = now + hops[piece.index] * step + jitter;
      let when = arrive;
      if (flip > now) {
        // still waiting for an earlier ripple: whichever front arrives first brings the new glaze
        when = Math.min(flip, arrive);
      } else {
        // what it shows now becomes the old glaze
        this.tiles[o] = this.tiles[o + 4];
        this.tiles[o + 1] = this.tiles[o + 5];
        this.tiles[o + 2] = this.tiles[o + 6];
      }
      if (when === arrive) {
        this.tiles[o + 8] = x;
        this.tiles[o + 9] = y;
      }
      this.tiles[o + 3] = when;
      this.tiles[o + 4] = next[c];
      this.tiles[o + 5] = next[c + 1];
      this.tiles[o + 6] = next[c + 2];
      this.tiles[o + 11] = fade ? 1 : 0;
      last = Math.max(last, when);
    }
    this.busyUntil = Math.max(this.busyUntil, last + SETTLE);
    this.tilesDirty = true;
    return fade ? [{ delay: 0, pan: 0 }] : this.steps(hops, step, 0);
  }

  /** One sound step per ring (thinned to at most 16), panned by where the ring sits. */
  private steps(hops: Int32Array, step: number, delay: number): Step[] {
    const wall = this.wall!;
    let max = 0;
    for (const h of hops) max = Math.max(max, h);
    const sum = new Float64Array(max + 1);
    const count = new Float64Array(max + 1);
    for (const piece of wall.pieces) {
      const h = hops[piece.index];
      if (piece.centre.x < 0 || piece.centre.x > this.width || piece.centre.y < 0 || piece.centre.y > this.height) continue;
      sum[h] += piece.centre.x;
      count[h] += 1;
    }
    const every = Math.max(1, Math.ceil((max + 1) / 16));
    const out: Step[] = [];
    for (let r = 0; r <= max; r += every) {
      if (!count[r]) continue;
      out.push({ delay: delay + r * step, pan: ((sum[r] / count[r]) / this.width) * 1.4 - 0.7 });
    }
    return out;
  }
}
