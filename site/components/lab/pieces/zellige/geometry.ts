// Geometry for the zellige piece: the patterns are built, not drawn by hand.
//
//   arrangementFaces(segments)  every bounded face of a set of line segments
//                               (a planar arrangement: split at crossings,
//                               prune loose ends, walk the faces)
//   buildPattern(fold)          one repeat of a pattern: its pieces (faces
//                               whose centre falls in the fundamental cell),
//                               their shape classes and the lattice
//
// Folds:
//   8   the khatam: an eight-pointed star made of two squares at every
//       lattice point, tip to tip, and the four-armed crosses that fall out
//       of the gaps between them
//   12  a twelve-fold rosette (a twelve-pointed star in a ring of petals)
//       on a hexagonal lattice, from Hankin's "polygons in contact" on the
//       3.12.12 tiling, with the rays run on to their second crossing
//   16  a sixteen-fold rosette on a square lattice, from the same method on
//       a tiling of sixteen-gons and the four-pointed gaps between them
//
// Pure and dependency-free (so it can be tested outside the browser).

export type Pt = { x: number; y: number };
export type Seg = readonly [number, number, number, number];

const TAU = Math.PI * 2;

/* ---------------------------------------------------------------------- */
/* planar arrangement                                                      */
/* ---------------------------------------------------------------------- */

/** Bounded faces (CCW) of the arrangement of `segments`. */
export function arrangementFaces(segments: readonly Seg[], eps = 1e-7): Pt[][] {
  const n = segments.length;
  // split parameters per segment
  const splits: number[][] = segments.map(() => [0, 1]);
  const boxes = segments.map(([x1, y1, x2, y2]) => [
    Math.min(x1, x2) - eps,
    Math.min(y1, y2) - eps,
    Math.max(x1, x2) + eps,
    Math.max(y1, y2) + eps,
  ]);
  for (let i = 0; i < n; i++) {
    const [px, py, qx, qy] = segments[i];
    const rx = qx - px;
    const ry = qy - py;
    const bi = boxes[i];
    for (let j = i + 1; j < n; j++) {
      const bj = boxes[j];
      if (bj[0] > bi[2] || bj[2] < bi[0] || bj[1] > bi[3] || bj[3] < bi[1]) continue;
      const [sx0, sy0, sx1, sy1] = segments[j];
      const sx = sx1 - sx0;
      const sy = sy1 - sy0;
      const denom = rx * sy - ry * sx;
      const wx = sx0 - px;
      const wy = sy0 - py;
      const lenR = Math.hypot(rx, ry);
      const lenS = Math.hypot(sx, sy);
      if (Math.abs(denom) < eps * lenR * lenS) {
        // parallel: only collinear overlaps matter
        if (Math.abs(wx * ry - wy * rx) > eps * lenR) continue;
        const rr = rx * rx + ry * ry;
        const ss = sx * sx + sy * sy;
        const t0 = (wx * rx + wy * ry) / rr;
        const t1 = ((sx1 - px) * rx + (sy1 - py) * ry) / rr;
        if (t0 > -eps && t0 < 1 + eps) splits[i].push(t0);
        if (t1 > -eps && t1 < 1 + eps) splits[i].push(t1);
        const u0 = ((px - sx0) * sx + (py - sy0) * sy) / ss;
        const u1 = ((qx - sx0) * sx + (qy - sy0) * sy) / ss;
        if (u0 > -eps && u0 < 1 + eps) splits[j].push(u0);
        if (u1 > -eps && u1 < 1 + eps) splits[j].push(u1);
        continue;
      }
      const t = (wx * sy - wy * sx) / denom;
      const u = (wx * ry - wy * rx) / denom;
      const et = eps / lenR;
      const eu = eps / lenS;
      if (t < -et || t > 1 + et || u < -eu || u > 1 + eu) continue;
      splits[i].push(t);
      splits[j].push(u);
    }
  }

  // vertices, deduplicated on a fine grid
  const q = eps * 20;
  const grid = new Map<string, number>();
  const vx: number[] = [];
  const vy: number[] = [];
  const vertex = (x: number, y: number) => {
    const gx = Math.round(x / q);
    const gy = Math.round(y / q);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const id = grid.get(`${gx + dx},${gy + dy}`);
        if (id !== undefined && Math.abs(vx[id] - x) <= q && Math.abs(vy[id] - y) <= q) return id;
      }
    const id = vx.length;
    vx.push(x);
    vy.push(y);
    grid.set(`${gx},${gy}`, id);
    return id;
  };

  const edges = new Set<string>();
  const adj = new Map<number, Set<number>>();
  const link = (a: number, b: number) => {
    if (a === b) return;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (edges.has(key)) return;
    edges.add(key);
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };
  for (let i = 0; i < n; i++) {
    const [px, py, qx, qy] = segments[i];
    const ts = splits[i].map((t) => Math.min(1, Math.max(0, t))).sort((a, b) => a - b);
    let prev = vertex(px + (qx - px) * ts[0], py + (qy - py) * ts[0]);
    for (let k = 1; k < ts.length; k++) {
      const id = vertex(px + (qx - px) * ts[k], py + (qy - py) * ts[k]);
      link(prev, id);
      prev = id;
    }
  }

  // prune loose ends (vertices of degree one), repeatedly
  const stack = [...adj.keys()].filter((v) => adj.get(v)!.size < 2);
  while (stack.length) {
    const v = stack.pop()!;
    const set = adj.get(v);
    if (!set) continue;
    for (const w of set) {
      const other = adj.get(w)!;
      other.delete(v);
      if (other.size < 2) stack.push(w);
    }
    adj.delete(v);
  }

  // neighbours sorted by angle
  const order = new Map<number, number[]>();
  for (const [v, set] of adj) {
    const list = [...set].sort(
      (a, b) => Math.atan2(vy[a] - vy[v], vx[a] - vx[v]) - Math.atan2(vy[b] - vy[v], vx[b] - vx[v]),
    );
    order.set(v, list);
  }

  // walk faces: from u→v, turn to the neighbour just clockwise of u around v
  const seen = new Set<string>();
  const faces: Pt[][] = [];
  for (const [u, list] of order) {
    for (const v0 of list) {
      if (seen.has(`${u}>${v0}`)) continue;
      const loop: number[] = [];
      let a = u;
      let b = v0;
      let guard = 0;
      while (!seen.has(`${a}>${b}`) && guard++ < 10000) {
        seen.add(`${a}>${b}`);
        loop.push(a);
        const around = order.get(b)!;
        const k = around.indexOf(a);
        const c = around[(k - 1 + around.length) % around.length];
        a = b;
        b = c;
      }
      let area = 0;
      for (let k = 0; k < loop.length; k++) {
        const p = loop[k];
        const r = loop[(k + 1) % loop.length];
        area += vx[p] * vy[r] - vx[r] * vy[p];
      }
      if (area > 1e-9) faces.push(simplify(loop.map((id) => ({ x: vx[id], y: vy[id] }))));
    }
  }
  return faces;
}

/** Drop vertices that sit on a straight run. */
function simplify(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  const m = points.length;
  for (let i = 0; i < m; i++) {
    const a = points[(i - 1 + m) % m];
    const b = points[i];
    const c = points[(i + 1) % m];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    const len = Math.hypot(b.x - a.x, b.y - a.y) * Math.hypot(c.x - b.x, c.y - b.y);
    if (Math.abs(cross) > 1e-9 * Math.max(len, 1e-12)) out.push(b);
  }
  return out;
}

export function polygonArea(points: readonly Pt[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

export function centroid(points: readonly Pt[]): Pt {
  let cx = 0;
  let cy = 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const cross = a.x * b.y - b.x * a.y;
    area += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  return { x: cx / (3 * area), y: cy / (3 * area) };
}

/* ---------------------------------------------------------------------- */
/* building blocks                                                         */
/* ---------------------------------------------------------------------- */

/** A regular polygon: `apothem` from the centre to each edge, the first edge's normal at `normal0`. */
export function regularPolygon(cx: number, cy: number, sides: number, apothem: number, normal0 = 0): Pt[] {
  const r = apothem / Math.cos(Math.PI / sides);
  const points: Pt[] = [];
  for (let k = 0; k < sides; k++) {
    const a = normal0 + ((k - 0.5) * TAU) / sides;
    points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return points;
}

/** Outline of a {n/k}-style star made of `squares` squares (circumradius r) overlaid at equal turns. */
export function squareStar(cx: number, cy: number, r: number, squares: number, rotation = 0): Pt[] {
  const points = squares * 4;
  // inner vertices: where neighbouring squares' edges cross
  const apothem = r * Math.SQRT1_2;
  const step = TAU / points;
  const inner = apothem / Math.cos(step / 2);
  const out: Pt[] = [];
  for (let i = 0; i < points; i++) {
    const a = rotation + i * step;
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    const b = a + step / 2;
    out.push({ x: cx + inner * Math.cos(b), y: cy + inner * Math.sin(b) });
  }
  return out;
}

function outlineSegments(points: readonly Pt[], out: Seg[]) {
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    out.push([a.x, a.y, b.x, b.y]);
  }
}

/**
 * Hankin's "polygons in contact" for one polygon whose every vertex has
 * its two edges mirror-symmetric about the vertex bisector (regular
 * polygons, and the symmetric gaps used here): from each edge midpoint a
 * ray leans `theta` off the edge toward each end, and stops where it meets
 * the bisector of the vertex it leans toward (where its mirror twin from
 * the next edge arrives). `centre` is the point the bisectors run through.
 */
function hankin(points: readonly Pt[], theta: number, out: Seg[], centre?: Pt) {
  const m = points.length;
  const c = centre ?? centroid(points);
  const ccw = polygonArea(points) > 0;
  for (let i = 0; i < m; i++) {
    const a = points[i];
    const b = points[(i + 1) % m];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const tx = (b.x - a.x) / len;
    const ty = (b.y - a.y) / len;
    // inward normal
    const nx = ccw ? -ty : ty;
    const ny = ccw ? tx : -tx;
    for (const [target, sign] of [
      [b, 1],
      [a, -1],
    ] as const) {
      const dx = sign * tx * Math.cos(theta) + nx * Math.sin(theta);
      const dy = sign * ty * Math.cos(theta) + ny * Math.sin(theta);
      // the bisector of `target`: the line through it and the centre, or for
      // vertices whose bisector misses the centre, its own angle bisector
      const prev = sign > 0 ? a : points[(i - 1 + m) % m];
      const next = sign > 0 ? points[(i + 2) % m] : b;
      const ux0 = prev.x - target.x;
      const uy0 = prev.y - target.y;
      const ux1 = next.x - target.x;
      const uy1 = next.y - target.y;
      const l0 = Math.hypot(ux0, uy0);
      const l1 = Math.hypot(ux1, uy1);
      let ux = ux0 / l0 + ux1 / l1;
      let uy = uy0 / l0 + uy1 / l1;
      if (Math.hypot(ux, uy) < 1e-9) {
        ux = c.x - target.x;
        uy = c.y - target.y;
      }
      // intersect mid + t·d with target + s·u
      const denom = dx * uy - dy * ux;
      if (Math.abs(denom) < 1e-12) continue;
      const t = ((target.x - mx) * uy - (target.y - my) * ux) / denom;
      if (t <= 0) continue;
      out.push([mx, my, mx + dx * t, my + dy * t]);
    }
  }
}

/** Point-in-polygon (even-odd). */
function inside(points: readonly Pt[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/**
 * Hankin with longer rays: each ray runs on past its first crossing and
 * stops at its `k`-th crossing with the polygon's other rays (k = 1 is the
 * plain star; k = 2 grows the ring of petals of a rosette).
 */
function hankinK(points: readonly Pt[], theta: number, k: number, out: Seg[]) {
  const m = points.length;
  const ccw = polygonArea(points) > 0;
  const rays: Array<{ x: number; y: number; dx: number; dy: number }> = [];
  for (let i = 0; i < m; i++) {
    const a = points[i];
    const b = points[(i + 1) % m];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const tx = (b.x - a.x) / len;
    const ty = (b.y - a.y) / len;
    const nx = ccw ? -ty : ty;
    const ny = ccw ? tx : -tx;
    for (const sign of [1, -1]) {
      rays.push({
        x: mx,
        y: my,
        dx: sign * tx * Math.cos(theta) + nx * Math.sin(theta),
        dy: sign * ty * Math.cos(theta) + ny * Math.sin(theta),
      });
    }
  }
  for (const r of rays) {
    const ts: number[] = [];
    for (const o of rays) {
      if (o === r) continue;
      const denom = r.dx * o.dy - r.dy * o.dx;
      if (Math.abs(denom) < 1e-12) continue;
      const wx = o.x - r.x;
      const wy = o.y - r.y;
      const t = (wx * o.dy - wy * o.dx) / denom;
      const u = (wx * r.dy - wy * r.dx) / denom;
      if (t <= 1e-9 || u <= 1e-9) continue;
      if (!inside(points, r.x + r.dx * t, r.y + r.dy * t)) continue;
      ts.push(t);
    }
    ts.sort((p, q) => p - q);
    // crossings that coincide (several rays through one point) count once
    const distinct: number[] = [];
    for (const t of ts) if (!distinct.length || t - distinct[distinct.length - 1] > 1e-7) distinct.push(t);
    const t = distinct[Math.min(k, distinct.length) - 1];
    if (t === undefined) continue;
    out.push([r.x, r.y, r.x + r.dx * t, r.y + r.dy * t]);
  }
}

/* ---------------------------------------------------------------------- */
/* patterns                                                                */
/* ---------------------------------------------------------------------- */

export type Fold = 8 | 12 | 16;

export type Piece = {
  points: Pt[];
  /** Area centroid (the fan centre for triangulation). */
  centre: Pt;
  area: number;
  /** Shape class: pieces with the same outline share it (0 = the biggest). */
  shape: number;
};

export type Pattern = {
  fold: Fold;
  /** Lattice vectors in pattern units. */
  a: Pt;
  b: Pt;
  /** The pieces of one repeat. */
  pieces: Piece[];
  /** Number of shape classes. */
  shapes: number;
  /** Shape class of the main star (the rosette at the lattice points). */
  star: number;
};

type Recipe = {
  a: Pt;
  b: Pt;
  /** Line segments of one repeat, around the origin. */
  cell: (out: Seg[]) => void;
};

function khatam(): Recipe {
  return {
    a: { x: 1, y: 0 },
    b: { x: 0, y: 1 },
    cell: (out) => outlineSegments(squareStar(0, 0, 0.5, 2, 0), out),
  };
}

/**
 * Twelve: the 3.12.12 tiling (dodecagons on a triangular lattice, spacing
 * 1, triangles in the gaps) with a 60° contact angle. The dodecagon's rays
 * run on to their second crossing, which grows the rosette: a twelve-pointed
 * star in a ring of twelve petals.
 */
function twelve(): Recipe {
  const a = { x: 1, y: 0 };
  const b = { x: 0.5, y: Math.sqrt(3) / 2 };
  const tri = 1 / Math.sqrt(3) - 0.5;
  const theta = (60 * Math.PI) / 180;
  return {
    a,
    b,
    cell: (out) => {
      hankinK(regularPolygon(0, 0, 12, 0.5, 0), theta, 2, out);
      // the triangle pointing up (between 0, a, b) and the one pointing down (a, b, a + b)
      hankin(regularPolygon((a.x + b.x) / 3, (a.y + b.y) / 3, 3, tri, Math.PI / 2), theta, out);
      hankin(regularPolygon((2 * a.x + 2 * b.x) / 3, (2 * a.y + 2 * b.y) / 3, 3, tri, -Math.PI / 2), theta, out);
    },
  };
}

/**
 * Sixteen: regular sixteen-gons on a square lattice sharing their axis
 * edges, and the four-pointed gaps between them. The sixteen-gon takes a
 * 67.5° contact angle with rays to their second crossing (a sixteen-pointed
 * star in a ring of sixteen petals); the gap takes a shallow 10°, which
 * turns it into a four-pointed star with kites at its sides.
 */
function sixteen(): Recipe {
  const theta = (67.5 * Math.PI) / 180;
  const thetaGap = (10 * Math.PI) / 180;
  return {
    a: { x: 1, y: 0 },
    b: { x: 0, y: 1 },
    cell: (out) => {
      hankinK(regularPolygon(0, 0, 16, 0.5, 0), theta, 2, out);
      // the gap at the cell centre: the vertices of the four sixteen-gons around it
      // that lie within half a cell of it, walked around the centre
      const centre = { x: 0.5, y: 0.5 };
      const gap: Pt[] = [];
      for (const [cx, cy] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        for (const p of regularPolygon(cx, cy, 16, 0.5, 0)) {
          if (Math.hypot(p.x - centre.x, p.y - centre.y) >= 0.5) continue;
          if (!gap.some((g) => Math.hypot(g.x - p.x, g.y - p.y) < 1e-9)) gap.push(p);
        }
      }
      gap.sort((p, r) => Math.atan2(p.y - 0.5, p.x - 0.5) - Math.atan2(r.y - 0.5, r.x - 0.5));
      hankin(gap, thetaGap, out, centre);
    },
  };
}

function recipeFor(fold: Fold): Recipe {
  if (fold === 8) return khatam();
  if (fold === 12) return twelve();
  return sixteen();
}

/** One repeat of the pattern, with its pieces classified by shape. */
export function buildPattern(fold: Fold): Pattern {
  const recipe = recipeFor(fold);
  const { a, b } = recipe;
  const segments: Seg[] = [];
  const cell: Seg[] = [];
  recipe.cell(cell);
  const R = 2;
  for (let i = -R; i <= R; i++)
    for (let j = -R; j <= R; j++) {
      const ox = i * a.x + j * b.x;
      const oy = i * a.y + j * b.y;
      for (const [x1, y1, x2, y2] of cell) segments.push([x1 + ox, y1 + oy, x2 + ox, y2 + oy]);
    }
  const faces = arrangementFaces(segments);
  // keep faces whose centroid falls in the (slightly shifted) fundamental cell
  const det = a.x * b.y - a.y * b.x;
  const shift = 0.01234;
  const pieces: Piece[] = [];
  for (const points of faces) {
    const c = centroid(points);
    const u = (c.x * b.y - c.y * b.x) / det;
    const v = (a.x * c.y - a.y * c.x) / det;
    if (u < -0.5 + shift || u >= 0.5 + shift || v < -0.5 + shift || v >= 0.5 + shift) continue;
    pieces.push({ points, centre: c, area: polygonArea(points), shape: 0 });
  }
  // shape classes: same vertex count, area and perimeter (within a hair)
  const perimeterOf = (p: Piece) => {
    let perimeter = 0;
    for (let i = 0; i < p.points.length; i++) {
      const s0 = p.points[i];
      const s1 = p.points[(i + 1) % p.points.length];
      perimeter += Math.hypot(s1.x - s0.x, s1.y - s0.y);
    }
    return perimeter;
  };
  const classes: Array<{ n: number; area: number; perimeter: number }> = [];
  const classOf = pieces.map((p) => {
    const perimeter = perimeterOf(p);
    let index = classes.findIndex(
      (c) => c.n === p.points.length && Math.abs(c.area - p.area) < 1e-6 && Math.abs(c.perimeter - perimeter) < 1e-5,
    );
    if (index < 0) index = classes.push({ n: p.points.length, area: p.area, perimeter }) - 1;
    return index;
  });
  const rank = classes.map((_, i) => i).sort((x, y) => classes[y].area - classes[x].area);
  pieces.forEach((p, i) => {
    p.shape = rank.indexOf(classOf[i]);
  });
  // the main star: the piece centred on the lattice point
  let star = 0;
  let best = Infinity;
  for (const p of pieces) {
    const d = Math.hypot(p.centre.x, p.centre.y);
    if (d < best) {
      best = d;
      star = p.shape;
    }
  }
  return { fold, a, b, pieces, shapes: classes.length, star };
}
