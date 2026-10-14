// The wall: one pattern repeat (geometry.ts) laid across the canvas.
//
//   layWall(pattern, { width, height, scale, centre })
//     → every piece that touches the view (plus a margin), in canvas CSS px,
//       fan-triangulated from its centroid into one vertex buffer, with the
//       pieces that touch each other listed for the re-glaze ripple
//   rings(wall, from)      rings of touching pieces out from one piece
//   pieceAt(wall, x, y)    the piece under a point
//
// Vertex layout (11 floats, no index buffer, so per-triangle values can be
// flat): position xy · piece centre xy · distance to this triangle's outer
// edge (exact: distance to a line is affine) · that edge's outward normal xy
// · piece index · reach (the largest edge distance in the piece) · radius
// (centre to the farthest corner) · shape class.

import { polygonArea, type Pattern, type Pt } from "./geometry";

export const FLOATS_PER_VERTEX = 11;

export type WallPiece = {
  /** Index in the wall (and in the tile data texture). */
  index: number;
  /** Lattice cell and the piece's place in the repeat: stable across resizes. */
  i: number;
  j: number;
  k: number;
  shape: number;
  centre: Pt;
  points: Pt[];
  /** Largest distance from the centre to an edge line (CSS px). */
  reach: number;
  /** Centre to the farthest corner (CSS px). */
  radius: number;
  /** Bounding box, for picking. */
  box: [number, number, number, number];
};

export type Wall = {
  pieces: WallPiece[];
  /** Neighbours of each piece (pieces sharing a corner or an edge). */
  neighbours: Int32Array[];
  vertices: Float32Array;
  vertexCount: number;
  /** Mean distance between neighbouring centres (CSS px): the ripple's step. */
  hop: number;
  /** Where the lattice origin landed (CSS px). */
  origin: Pt;
  scale: number;
};

export function layWall(
  pattern: Pattern,
  { width, height, scale, centre, margin = 0 }: { width: number; height: number; scale: number; centre: Pt; margin?: number },
): Wall {
  const { a, b } = pattern;
  // lattice cells whose repeat can reach the view: solve for the view's
  // corners in lattice coordinates and pad by two cells
  const det = a.x * b.y - a.y * b.x;
  const toLattice = (x: number, y: number) => {
    const px = (x - centre.x) / scale;
    const py = (y - centre.y) / scale;
    return { u: (px * b.y - py * b.x) / det, v: (a.x * py - a.y * px) / det };
  };
  const corners = [
    toLattice(-margin, -margin),
    toLattice(width + margin, -margin),
    toLattice(-margin, height + margin),
    toLattice(width + margin, height + margin),
  ];
  const u0 = Math.floor(Math.min(...corners.map((c) => c.u))) - 2;
  const u1 = Math.ceil(Math.max(...corners.map((c) => c.u))) + 2;
  const v0 = Math.floor(Math.min(...corners.map((c) => c.v))) - 2;
  const v1 = Math.ceil(Math.max(...corners.map((c) => c.v))) + 2;

  const pieces: WallPiece[] = [];
  let triangles = 0;
  for (let i = u0; i <= u1; i++) {
    for (let j = v0; j <= v1; j++) {
      const ox = centre.x + (i * a.x + j * b.x) * scale;
      const oy = centre.y + (i * a.y + j * b.y) * scale;
      pattern.pieces.forEach((piece, k) => {
        const points = piece.points.map((p) => ({ x: ox + p.x * scale, y: oy + p.y * scale }));
        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;
        for (const p of points) {
          x0 = Math.min(x0, p.x);
          y0 = Math.min(y0, p.y);
          x1 = Math.max(x1, p.x);
          y1 = Math.max(y1, p.y);
        }
        if (x1 < -margin || y1 < -margin || x0 > width + margin || y0 > height + margin) return;
        const c = { x: ox + piece.centre.x * scale, y: oy + piece.centre.y * scale };
        let reach = 0;
        let radius = 0;
        for (let e = 0; e < points.length; e++) {
          const p = points[e];
          const q = points[(e + 1) % points.length];
          const len = Math.hypot(q.x - p.x, q.y - p.y);
          reach = Math.max(reach, Math.abs((q.x - p.x) * (c.y - p.y) - (q.y - p.y) * (c.x - p.x)) / len);
          radius = Math.max(radius, Math.hypot(p.x - c.x, p.y - c.y));
        }
        pieces.push({
          index: pieces.length,
          i,
          j,
          k,
          shape: piece.shape,
          centre: c,
          points,
          reach,
          radius,
          box: [x0, y0, x1, y1],
        });
        triangles += points.length;
      });
    }
  }

  // one fan per piece
  const vertices = new Float32Array(triangles * 3 * FLOATS_PER_VERTEX);
  let o = 0;
  const put = (x: number, y: number, piece: WallPiece, dist: number, nx: number, ny: number) => {
    vertices[o++] = x;
    vertices[o++] = y;
    vertices[o++] = piece.centre.x;
    vertices[o++] = piece.centre.y;
    vertices[o++] = dist;
    vertices[o++] = nx;
    vertices[o++] = ny;
    vertices[o++] = piece.index;
    vertices[o++] = piece.reach;
    vertices[o++] = piece.radius;
    vertices[o++] = piece.shape;
  };
  for (const piece of pieces) {
    const { points, centre: c } = piece;
    const ccw = polygonArea(points) > 0;
    for (let e = 0; e < points.length; e++) {
      const p = points[e];
      const q = points[(e + 1) % points.length];
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      // outward normal of the edge
      let nx = (q.y - p.y) / len;
      let ny = -(q.x - p.x) / len;
      if (!ccw) {
        nx = -nx;
        ny = -ny;
      }
      const dist = Math.abs((q.x - p.x) * (c.y - p.y) - (q.y - p.y) * (c.x - p.x)) / len;
      put(c.x, c.y, piece, dist, nx, ny);
      put(p.x, p.y, piece, 0, nx, ny);
      put(q.x, q.y, piece, 0, nx, ny);
    }
  }

  // neighbours: pieces that share a corner (a grid of rounded corners)
  const key = (p: Pt) => `${Math.round(p.x * 64)},${Math.round(p.y * 64)}`;
  const byCorner = new Map<string, number[]>();
  for (const piece of pieces) {
    for (const p of piece.points) {
      const k = key(p);
      const list = byCorner.get(k);
      if (list) {
        if (!list.includes(piece.index)) list.push(piece.index);
      } else byCorner.set(k, [piece.index]);
    }
  }
  const sets = pieces.map(() => new Set<number>());
  for (const list of byCorner.values()) {
    for (const x of list) for (const y of list) if (x !== y) sets[x].add(y);
  }
  const neighbours = sets.map((set) => Int32Array.from(set));
  let hopSum = 0;
  let hopCount = 0;
  for (const piece of pieces) {
    for (const n of neighbours[piece.index]) {
      const other = pieces[n];
      hopSum += Math.hypot(other.centre.x - piece.centre.x, other.centre.y - piece.centre.y);
      hopCount++;
    }
  }

  return {
    pieces,
    neighbours,
    vertices,
    vertexCount: triangles * 3,
    hop: hopCount ? hopSum / hopCount : scale,
    origin: centre,
    scale,
  };
}

/**
 * Rings out from piece `from`: the shortest path to every piece through
 * pieces that touch (Dijkstra, each step weighted by the distance between
 * centres), counted in average steps and rounded. The ripple then moves
 * one whole ring at a time, but its front stays round instead of taking
 * the lattice's diamond shape. Pieces it cannot reach get their straight
 * distance.
 */
export function rings(wall: Wall, from: number): Int32Array {
  const n = wall.pieces.length;
  const out = new Int32Array(n);
  if (from < 0 || from >= n) return out;
  const dist = new Float64Array(n).fill(Infinity);
  const done = new Uint8Array(n);
  // a small binary heap of [distance, piece]
  const heapD: number[] = [];
  const heapV: number[] = [];
  const push = (d: number, v: number) => {
    let i = heapD.length;
    heapD.push(d);
    heapV.push(v);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heapD[parent] <= heapD[i]) break;
      [heapD[parent], heapD[i]] = [heapD[i], heapD[parent]];
      [heapV[parent], heapV[i]] = [heapV[i], heapV[parent]];
      i = parent;
    }
  };
  const pop = (): number => {
    const top = heapV[0];
    const lastD = heapD.pop()!;
    const lastV = heapV.pop()!;
    if (heapD.length) {
      heapD[0] = lastD;
      heapV[0] = lastV;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < heapD.length && heapD[l] < heapD[m]) m = l;
        if (r < heapD.length && heapD[r] < heapD[m]) m = r;
        if (m === i) break;
        [heapD[m], heapD[i]] = [heapD[i], heapD[m]];
        [heapV[m], heapV[i]] = [heapV[i], heapV[m]];
        i = m;
      }
    }
    return top;
  };
  dist[from] = 0;
  push(0, from);
  while (heapD.length) {
    const v = pop();
    if (done[v]) continue;
    done[v] = 1;
    const cv = wall.pieces[v].centre;
    for (const w of wall.neighbours[v]) {
      if (done[w]) continue;
      const cw = wall.pieces[w].centre;
      const d = dist[v] + Math.hypot(cw.x - cv.x, cw.y - cv.y);
      if (d < dist[w]) {
        dist[w] = d;
        push(d, w);
      }
    }
  }
  const origin = wall.pieces[from].centre;
  for (let i = 0; i < n; i++) {
    const c = wall.pieces[i].centre;
    const d = Number.isFinite(dist[i]) ? dist[i] : Math.hypot(c.x - origin.x, c.y - origin.y);
    out[i] = Math.round(d / wall.hop);
  }
  return out;
}

function inside(points: readonly Pt[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** The piece under (x, y), or the nearest one (a click on the grout still counts). */
export function pieceAt(wall: Wall, x: number, y: number): number {
  let nearest = -1;
  let best = Infinity;
  for (const piece of wall.pieces) {
    const [x0, y0, x1, y1] = piece.box;
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && inside(piece.points, x, y)) return piece.index;
    const d = Math.hypot(piece.centre.x - x, piece.centre.y - y);
    if (d < best) {
      best = d;
      nearest = piece.index;
    }
  }
  return nearest;
}
