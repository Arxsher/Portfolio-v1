// The tiny planet's geometry, made once per mount from a fixed seed, so
// the same continents, forests, towns and clouds come back every visit
// (the tile and the stage build the same world at two resolutions).
//
// - Terrain: a subdivided icosahedron pushed in and out by a domain-warped
//   gradient noise. Sea level sits at a fixed share of the surface, land is
//   raised in low facets and mountains get a ridged kick. Every triangle
//   carries its own flat normal and colour (beach, meadow, forest, desert,
//   rock, snow, polar ice, and sea floor under the water), so it reads as a
//   cut low-poly model.
// - Ocean: the same sphere at radius 1 (indexed, shared vertices) with the
//   water's depth at each vertex, so the shallows glow around the coasts.
// - Pines (instanced two-tier cones), towns (lights clustered on low land
//   near the coasts, with stray villages), cloud banks (flattened low-poly
//   puffs strung along the wind) and a cratered moon.

export type World = {
  /** Non-indexed: position 3, normal 3, colour 3 (sRGB) per vertex. */
  terrain: Float32Array;
  terrainVertices: number;
  /** Indexed sphere at sea level: position 3, depth 1 per vertex. */
  ocean: Float32Array;
  oceanIndices: Uint16Array;
  /** Pine mesh: position 3, normal 3, part 1 (0 foliage, 1 trunk). */
  treeMesh: Float32Array;
  treeMeshVertices: number;
  /** Per pine: base x y z, height, then r g b (sRGB), seed. */
  trees: Float32Array;
  treeCount: number;
  /** Puff mesh (low-poly ball): position 3, normal 3. */
  puffMesh: Float32Array;
  puffMeshVertices: number;
  /** Per puff: centre x y z, radius, then flatness, drift (rad/s), shade, seed. */
  puffs: Float32Array;
  puffCount: number;
  /** Per cloud bank (for the shadows): centre x y z, radius, drift. */
  banks: Float32Array;
  bankCount: number;
  /** Per light: position x y z, the sun height it comes on at, seed, size. */
  lights: Float32Array;
  lightCount: number;
  /** Non-indexed moon: position 3, normal 3, colour 3. */
  moon: Float32Array;
  moonVertices: number;
  /** Indexed sphere for the atmosphere shell (positions only). */
  shell: Float32Array;
  shellIndices: Uint16Array;
  /** Land as a share of the surface (for the description). */
  land: number;
};

export type Detail = {
  /** Icosphere subdivisions for land and sea. */
  level: number;
  trees: number;
  towns: number;
  villages: number;
  banks: number;
};

export const DETAIL: Record<"tile" | "stage", Detail> = {
  stage: { level: 5, trees: 760, towns: 26, villages: 140, banks: 15 },
  tile: { level: 4, trees: 300, towns: 22, villages: 80, banks: 12 },
};

const SEED = 20261021;
/** Share of the surface under water. */
const SEA_SHARE = 0.63;

/* ---------------------------------------------------------------------- */
/* random and noise                                                        */
/* ---------------------------------------------------------------------- */

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Noise3 = (x: number, y: number, z: number) => number;

/** Gradient noise (Perlin's improved noise) with a seeded permutation, about −1..1. */
function makeNoise(seed: number): Noise3 {
  const rand = mulberry(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h: number, x: number, y: number, z: number) => {
    const k = h & 15;
    const u = k < 8 ? x : y;
    const v = k < 4 ? y : k === 12 || k === 14 ? x : z;
    return ((k & 1) === 0 ? u : -u) + ((k & 2) === 0 ? v : -v);
  };
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  return (x, y, z) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    const A = perm[X] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;
    return mix(
      mix(mix(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), mix(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      mix(
        mix(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
        mix(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u),
        v,
      ),
      w,
    );
  };
}

function fbm(noise: Noise3, x: number, y: number, z: number, octaves: number, lacunarity = 2.03, gain = 0.5): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * f + i * 17.1, y * f - i * 9.3, z * f + i * 5.7);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}

/* ---------------------------------------------------------------------- */
/* icosphere                                                               */
/* ---------------------------------------------------------------------- */

type Sphere = { verts: Float64Array; faces: Uint16Array; vertexCount: number; faceCount: number };

const sphereCache = new Map<number, Sphere>();

/** A unit icosphere, `level` times subdivided (shared vertices). */
export function icosphere(level: number): Sphere {
  const cached = sphereCache.get(level);
  if (cached) return cached;
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: number[] = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];
  for (let i = 0; i < verts.length; i += 3) {
    const l = Math.hypot(verts[i], verts[i + 1], verts[i + 2]);
    verts[i] /= l;
    verts[i + 1] /= l;
    verts[i + 2] /= l;
  }
  let faces: number[] = [
    0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6,
    8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
  ];
  for (let l = 0; l < level; l++) {
    const mid = new Map<number, number>();
    const midpoint = (a: number, b: number) => {
      const key = a < b ? a * 65536 + b : b * 65536 + a;
      const hit = mid.get(key);
      if (hit !== undefined) return hit;
      const x = verts[a * 3] + verts[b * 3];
      const y = verts[a * 3 + 1] + verts[b * 3 + 1];
      const z = verts[a * 3 + 2] + verts[b * 3 + 2];
      const len = Math.hypot(x, y, z);
      const index = verts.length / 3;
      verts.push(x / len, y / len, z / len);
      mid.set(key, index);
      return index;
    };
    const next: number[] = [];
    for (let i = 0; i < faces.length; i += 3) {
      const a = faces[i];
      const b = faces[i + 1];
      const c = faces[i + 2];
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    faces = next;
  }
  const sphere: Sphere = {
    verts: new Float64Array(verts),
    faces: new Uint16Array(faces),
    vertexCount: verts.length / 3,
    faceCount: faces.length / 3,
  };
  sphereCache.set(level, sphere);
  return sphere;
}

/* ---------------------------------------------------------------------- */
/* the land                                                                */
/* ---------------------------------------------------------------------- */

type Field = {
  /** Height above sea level (normalised: land 0..1, sea 0..−1) for a unit direction. */
  height: (x: number, y: number, z: number) => number;
  /** Planet radius for a unit direction. */
  radius: (x: number, y: number, z: number) => number;
  moisture: (x: number, y: number, z: number) => number;
  ice: (x: number, y: number, z: number) => boolean;
};

let fieldCache: Field | null = null;

function makeField(): Field {
  if (fieldCache) return fieldCache;
  const base = makeNoise(SEED);
  const warp = makeNoise(SEED + 1);
  const ridge = makeNoise(SEED + 2);
  const wet = makeNoise(SEED + 3);
  const raw = (x: number, y: number, z: number) => {
    const wx = fbm(warp, x * 1.1 + 3.1, y * 1.1, z * 1.1, 3);
    const wy = fbm(warp, x * 1.1, y * 1.1 + 7.7, z * 1.1, 3);
    const wz = fbm(warp, x * 1.1, y * 1.1, z * 1.1 - 4.2, 3);
    const px = x + wx * 0.55;
    const py = y + wy * 0.55;
    const pz = z + wz * 0.55;
    return fbm(base, px * 1.25, py * 1.25, pz * 1.25, 5, 2.07, 0.52);
  };
  // sea level and the extremes, from a fixed sample of the sphere
  const probe = icosphere(4);
  const samples = new Float64Array(probe.vertexCount);
  for (let i = 0; i < probe.vertexCount; i++) samples[i] = raw(probe.verts[i * 3], probe.verts[i * 3 + 1], probe.verts[i * 3 + 2]);
  const sorted = Float64Array.from(samples).sort();
  const sea = sorted[Math.floor(sorted.length * SEA_SHARE)];
  const top = sorted[sorted.length - 1] - sea;
  const bottom = sea - sorted[0];
  const height = (x: number, y: number, z: number) => {
    const h = raw(x, y, z) - sea;
    return h > 0 ? Math.min(1, h / top) : Math.max(-1, h / bottom);
  };
  const ice = (x: number, y: number, z: number) => Math.abs(y) + wet(x * 3.1, y * 3.1, z * 3.1) * 0.07 > 0.915;
  const radius = (x: number, y: number, z: number) => {
    const h = height(x, y, z);
    let r: number;
    if (h > 0) {
      const ridged = 1 - Math.abs(ridge(x * 3.3, y * 3.3, z * 3.3));
      const peaks = ridged * ridged * smooth(0.28, 0.75, h);
      r = 1.011 + 0.07 * Math.pow(h, 1.25) + 0.045 * peaks;
    } else {
      r = 0.988 - 0.07 * Math.pow(-h, 0.8);
    }
    if (ice(x, y, z)) r = Math.max(r, 1.009 + Math.max(0, h) * 0.02);
    return r;
  };
  const moisture = (x: number, y: number, z: number) => fbm(wet, x * 1.9 + 11, y * 1.9, z * 1.9, 3);
  fieldCache = { height, radius, moisture, ice };
  return fieldCache;
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* palette (sRGB 0..1) ---------------------------------------------------- */

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

const C = {
  floorShallow: hex("#d9cfa4"),
  floorDeep: hex("#3a6274"),
  sand: hex("#eadbab"),
  meadow: hex("#9fc46a"),
  meadowDry: hex("#bfc97c"),
  forest: hex("#6b9c4f"),
  desert: hex("#e3c48d"),
  hills: hex("#a9a275"),
  rock: hex("#958a7c"),
  snow: hex("#f2f4f6"),
  ice: hex("#e9f1f6"),
  pine: hex("#3e7a4b"),
  pineDark: hex("#2f6640"),
  pineCold: hex("#4f7d63"),
  moon: hex("#d5d1c8"),
  moonSea: hex("#aeaba3"),
  crater: hex("#bdb9b0"),
};

type Biome = "floor" | "sand" | "meadow" | "dry" | "forest" | "desert" | "hills" | "rock" | "snow" | "ice";

function biomeAt(field: Field, x: number, y: number, z: number, h: number, coast: boolean): Biome {
  if (field.ice(x, y, z)) return "ice";
  if (h <= 0) return "floor";
  const lat = Math.abs(y);
  const m = field.moisture(x, y, z);
  const cold = lat * 1.05 + h * 0.6;
  if (h > 0.8 || cold > 1.16) return "snow";
  if (h > 0.62) return "rock";
  if (coast && h < 0.07) return "sand";
  if (h > 0.44) return "hills";
  if (m < -0.13 && lat < 0.5) return "desert";
  if (m > -0.02) return "forest";
  return m < -0.08 ? "dry" : "meadow";
}

function colourFor(biome: Biome, depth: number, out: number[], jitter: number) {
  let c: readonly number[];
  switch (biome) {
    case "floor": {
      const k = smooth(0, 0.55, depth);
      out[0] = C.floorShallow[0] + (C.floorDeep[0] - C.floorShallow[0]) * k;
      out[1] = C.floorShallow[1] + (C.floorDeep[1] - C.floorShallow[1]) * k;
      out[2] = C.floorShallow[2] + (C.floorDeep[2] - C.floorShallow[2]) * k;
      return;
    }
    case "sand":
      c = C.sand;
      break;
    case "meadow":
      c = C.meadow;
      break;
    case "dry":
      c = C.meadowDry;
      break;
    case "forest":
      c = C.forest;
      break;
    case "desert":
      c = C.desert;
      break;
    case "hills":
      c = C.hills;
      break;
    case "rock":
      c = C.rock;
      break;
    case "snow":
      c = C.snow;
      break;
    default:
      c = C.ice;
  }
  const j = 1 + jitter;
  out[0] = Math.min(1, c[0] * j);
  out[1] = Math.min(1, c[1] * j);
  out[2] = Math.min(1, c[2] * j);
}

/* ---------------------------------------------------------------------- */
/* building                                                                */
/* ---------------------------------------------------------------------- */

function pushTri(
  out: number[],
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
  colour: readonly number[] | null,
) {
  const ux = bx - ax, uy = by - ay, uz = bz - az;
  const vx = cx - ax, vy = cy - ay, vz = cz - az;
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l;
  ny /= l;
  nz /= l;
  // keep the normal pointing away from the centre of the shape it belongs to
  const mx = ax + bx + cx, my = ay + by + cy, mz = az + bz + cz;
  if (nx * mx + ny * my + nz * mz < 0) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }
  const verts = [ax, ay, az, bx, by, bz, cx, cy, cz];
  for (let k = 0; k < 3; k++) {
    out.push(verts[k * 3], verts[k * 3 + 1], verts[k * 3 + 2], nx, ny, nz);
    if (colour) out.push(colour[0], colour[1], colour[2]);
  }
}

function buildTerrain(level: number, field: Field, rand: () => number) {
  const sphere = icosphere(level);
  const { verts, faces, vertexCount, faceCount } = sphere;
  const radius = new Float64Array(vertexCount);
  const height = new Float64Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const x = verts[i * 3], y = verts[i * 3 + 1], z = verts[i * 3 + 2];
    height[i] = field.height(x, y, z);
    radius[i] = field.radius(x, y, z);
  }
  const data: number[] = [];
  const colour = [0, 0, 0];
  const faceBiome: Biome[] = new Array(faceCount);
  const faceHeight = new Float64Array(faceCount);
  let landFaces = 0;
  for (let f = 0; f < faceCount; f++) {
    const a = faces[f * 3], b = faces[f * 3 + 1], c = faces[f * 3 + 2];
    const ha = height[a], hb = height[b], hc = height[c];
    const h = (ha + hb + hc) / 3;
    const top = Math.max(radius[a], radius[b], radius[c]);
    const low = Math.min(ha, hb, hc);
    const cx = (verts[a * 3] + verts[b * 3] + verts[c * 3]) / 3;
    const cy = (verts[a * 3 + 1] + verts[b * 3 + 1] + verts[c * 3 + 1]) / 3;
    const cz = (verts[a * 3 + 2] + verts[b * 3 + 2] + verts[c * 3 + 2]) / 3;
    const cl = Math.hypot(cx, cy, cz);
    const underwater = top < 1;
    const coast = low <= 0;
    let biome = underwater ? "floor" : biomeAt(field, cx / cl, cy / cl, cz / cl, Math.max(h, 0.001), coast);
    if (biome === "floor" && !underwater) biome = "sand";
    if (biome !== "floor" && biome !== "ice") landFaces += 1;
    faceBiome[f] = biome;
    faceHeight[f] = h;
    colourFor(biome, -Math.min(0, h), colour, (rand() - 0.5) * 0.085);
    const ra = radius[a], rb = radius[b], rc = radius[c];
    pushTri(
      data,
      verts[a * 3] * ra, verts[a * 3 + 1] * ra, verts[a * 3 + 2] * ra,
      verts[b * 3] * rb, verts[b * 3 + 1] * rb, verts[b * 3 + 2] * rb,
      verts[c * 3] * rc, verts[c * 3 + 1] * rc, verts[c * 3 + 2] * rc,
      colour,
    );
  }
  return { data: new Float32Array(data), vertices: data.length / 9, sphere, radius, height, faceBiome, faceHeight, land: landFaces / faceCount };
}

function buildOcean(sphere: Sphere, radius: Float64Array) {
  const { verts, vertexCount, faces } = sphere;
  const data = new Float32Array(vertexCount * 4);
  for (let i = 0; i < vertexCount; i++) {
    data[i * 4] = verts[i * 3];
    data[i * 4 + 1] = verts[i * 3 + 1];
    data[i * 4 + 2] = verts[i * 3 + 2];
    // depth below the surface (0 on land), in planet radii
    data[i * 4 + 3] = Math.max(0, 1 - radius[i]);
  }
  return { data, indices: faces };
}

/** Two stacked six-sided cones on a short trunk, 1 unit tall, base at y = 0. */
function buildPine(): { data: Float32Array; vertices: number } {
  const out: number[] = [];
  const sides = 6;
  const ring = (y: number, r: number, i: number, phase: number): [number, number, number] => {
    const a = ((i + phase) / sides) * Math.PI * 2;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  const cone = (y0: number, y1: number, r: number, phase: number, part: number) => {
    for (let i = 0; i < sides; i++) {
      const p = ring(y0, r, i, phase);
      const q = ring(y0, r, i + 1, phase);
      tri(out, p, [0, y1, 0], q, part);
      // underside, so a tree seen from below the slope isn't hollow
      tri(out, q, [0, y0 + 0.02, 0], p, part, true);
    }
  };
  // trunk: a four-sided post
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const b = ((i + 1) / 4) * Math.PI * 2 + Math.PI / 4;
    const r = 0.07;
    const p0: [number, number, number] = [Math.cos(a) * r, -0.15, Math.sin(a) * r];
    const p1: [number, number, number] = [Math.cos(b) * r, -0.15, Math.sin(b) * r];
    const p2: [number, number, number] = [Math.cos(b) * r, 0.3, Math.sin(b) * r];
    const p3: [number, number, number] = [Math.cos(a) * r, 0.3, Math.sin(a) * r];
    tri(out, p0, p2, p1, 1);
    tri(out, p0, p3, p2, 1);
  }
  cone(0.16, 0.78, 0.34, 0, 0);
  cone(0.5, 1.0, 0.24, 0.5, 0);
  return { data: new Float32Array(out), vertices: out.length / 7 };
}

/** A pine triangle with its flat normal facing away from the trunk's axis, or down. */
function tri(out: number[], a: readonly number[], b: readonly number[], c: readonly number[], part: number, down = false) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l;
  ny /= l;
  nz /= l;
  const mx = (a[0] + b[0] + c[0]) / 3;
  const mz = (a[2] + b[2] + c[2]) / 3;
  const flip = down ? ny > 0 : nx * mx + nz * mz < 0;
  if (flip) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }
  for (const p of [a, b, c]) out.push(p[0], p[1], p[2], nx, ny, nz, part);
}

function buildTrees(terrain: ReturnType<typeof buildTerrain>, count: number, rand: () => number) {
  const { sphere, radius, faceBiome, faceHeight } = terrain;
  const { verts, faces, faceCount } = sphere;
  const candidates: number[] = [];
  const weights: number[] = [];
  for (let f = 0; f < faceCount; f++) {
    const b = faceBiome[f];
    const w = b === "forest" ? 1 : b === "hills" ? 0.45 : b === "meadow" ? 0.12 : b === "dry" ? 0.04 : 0;
    if (w > 0) {
      candidates.push(f);
      weights.push(w);
    }
  }
  const out: number[] = [];
  let placed = 0;
  // walk the candidates in a shuffled order, keeping each with its weight, until enough are placed
  const order = candidates.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = order[i];
    order[i] = order[j];
    order[j] = t;
  }
  for (let pass = 0; pass < 2 && placed < count; pass++) {
    for (const k of order) {
      if (placed >= count) break;
      if (rand() > weights[k] * (pass === 0 ? 1 : 0.6)) continue;
      const f = candidates[k];
      const a = faces[f * 3], b = faces[f * 3 + 1], c = faces[f * 3 + 2];
      // a random point in the facet, kept away from its edges
      let u = rand(), v = rand();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      u = 0.15 + u * 0.7;
      v = 0.15 + v * 0.7;
      if (u + v > 0.85) {
        const s = 0.85 / (u + v);
        u *= s;
        v *= s;
      }
      const w = 1 - u - v;
      const ra = radius[a], rb = radius[b], rc = radius[c];
      const x = verts[a * 3] * ra * w + verts[b * 3] * rb * u + verts[c * 3] * rc * v;
      const y = verts[a * 3 + 1] * ra * w + verts[b * 3 + 1] * rb * u + verts[c * 3 + 1] * rc * v;
      const z = verts[a * 3 + 2] * ra * w + verts[b * 3 + 2] * rb * u + verts[c * 3 + 2] * rc * v;
      const h = faceHeight[f];
      const cold = Math.abs(y) > 0.62 || h > 0.32;
      const tone = cold ? C.pineCold : rand() < 0.5 ? C.pine : C.pineDark;
      const j = 1 + (rand() - 0.5) * 0.14;
      const size = (cold ? 0.03 : 0.036) * (0.8 + rand() * 0.45);
      out.push(x, y, z, size, tone[0] * j, tone[1] * j, tone[2] * j, rand());
      placed += 1;
    }
  }
  return { data: new Float32Array(out), count: placed };
}

function buildPuff(): { data: Float32Array; vertices: number } {
  const sphere = icosphere(1);
  const out: number[] = [];
  const { verts, faces, faceCount } = sphere;
  for (let f = 0; f < faceCount; f++) {
    const a = faces[f * 3], b = faces[f * 3 + 1], c = faces[f * 3 + 2];
    pushTri(
      out,
      verts[a * 3], verts[a * 3 + 1], verts[a * 3 + 2],
      verts[b * 3], verts[b * 3 + 1], verts[b * 3 + 2],
      verts[c * 3], verts[c * 3 + 1], verts[c * 3 + 2],
      null,
    );
  }
  return { data: new Float32Array(out), vertices: out.length / 6 };
}

function buildClouds(count: number, rand: () => number) {
  const puffs: number[] = [];
  const banks: number[] = [];
  let made = 0;
  let guard = 0;
  const centres: number[] = [];
  while (made < count && guard++ < 400) {
    // a direction, mostly away from the poles, spread out from the others
    const y = (rand() * 2 - 1) * 0.78;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    let tooClose = false;
    for (let i = 0; i < centres.length; i += 3) {
      if (x * centres[i] + y * centres[i + 1] + z * centres[i + 2] > 0.86) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    centres.push(x, y, z);
    // the wind: trade winds blow west near the equator, westerlies east further out
    const lat = Math.abs(y);
    const dir = lat < 0.36 ? -1 : 1;
    const drift = dir * (0.018 + rand() * 0.022);
    // east-west tangent, turned a little
    let tx = -z, tz = x;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    const bx = y * tz, by = z * tx - x * tz, bz = -y * tx;
    const turn = (rand() - 0.5) * 0.7;
    const ex = tx * Math.cos(turn) + bx * Math.sin(turn);
    const ey = by * Math.sin(turn);
    const ez = tz * Math.cos(turn) + bz * Math.sin(turn);
    const n = 3 + Math.floor(rand() * 4);
    const length = 0.1 + n * 0.045;
    const altitude = 1.055 + rand() * 0.02;
    const shade = 0.94 + rand() * 0.06;
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < n; i++) {
      const s = (n === 1 ? 0 : i / (n - 1) - 0.5) * length;
      const middle = 1 - Math.abs(s / (length / 2 + 1e-6));
      const radius = (0.042 + 0.034 * middle) * (0.85 + rand() * 0.3);
      const jx = (rand() - 0.5) * 0.03;
      const jy = (rand() - 0.5) * 0.03;
      let px = x + ex * s + bx * jx;
      let py = y + ey * s + by * jx + jy * 0.2;
      let pz = z + ez * s + bz * jx;
      const pl = Math.hypot(px, py, pz);
      const alt = altitude + middle * 0.01 + (rand() - 0.5) * 0.006;
      px = (px / pl) * alt;
      py = (py / pl) * alt;
      pz = (pz / pl) * alt;
      sx += px;
      sy += py;
      sz += pz;
      puffs.push(px, py, pz, radius, 0.62 + rand() * 0.1, drift, shade, rand());
    }
    banks.push(sx / n, sy / n, sz / n, length / 2 + 0.06, drift);
    made += 1;
  }
  return { puffs: new Float32Array(puffs), puffCount: puffs.length / 8, banks: new Float32Array(banks), bankCount: made };
}

function buildLights(field: Field, towns: number, villages: number, rand: () => number) {
  const out: number[] = [];
  const centres: number[] = [];
  const isLand = (x: number, y: number, z: number) => field.height(x, y, z) > 0.012 && !field.ice(x, y, z);
  const randomDir = (): [number, number, number] => {
    const y = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  const coastal = (x: number, y: number, z: number) => {
    // is there sea within a short walk?
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const d = 0.075;
      let tx = -z, tz = x;
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl;
      tz /= tl;
      const bx = y * tz, by = z * tx - x * tz, bz = -y * tx;
      const px = x + (tx * Math.cos(a) + bx * Math.sin(a)) * d;
      const py = y + by * Math.sin(a) * d;
      const pz = z + (tz * Math.cos(a) + bz * Math.sin(a)) * d;
      const l = Math.hypot(px, py, pz);
      if (field.height(px / l, py / l, pz / l) <= 0) return true;
    }
    return false;
  };
  const place = (x: number, y: number, z: number, size: number) => {
    const r = field.radius(x, y, z) + 0.004;
    // comes on when the sun is this far below the local horizon (dot of normal and sun)
    const on = -(0.015 + rand() * 0.2);
    out.push(x * r, y * r, z * r, on, rand(), size);
  };
  let guard = 0;
  while (centres.length / 3 < towns && guard++ < 6000) {
    const [x, y, z] = randomDir();
    if (Math.abs(y) > 0.74 || !isLand(x, y, z)) continue;
    const h = field.height(x, y, z);
    if (h > 0.34) continue;
    if (!coastal(x, y, z) && rand() > 0.25) continue;
    let near = false;
    for (let i = 0; i < centres.length; i += 3) {
      if (x * centres[i] + y * centres[i + 1] + z * centres[i + 2] > 0.955) {
        near = true;
        break;
      }
    }
    if (near) continue;
    centres.push(x, y, z);
    const lights = 10 + Math.floor(rand() * rand() * 34);
    const spread = 0.022 + lights * 0.0011;
    let tx = -z, tz = x;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    const bx = y * tz, by = z * tx - x * tz, bz = -y * tx;
    for (let i = 0; i < lights; i++) {
      // gaussian scatter around the town centre (Box–Muller)
      const g = Math.sqrt(-2 * Math.log(Math.max(1e-6, rand())));
      const t = rand() * Math.PI * 2;
      const u = g * Math.cos(t) * spread;
      const v = g * Math.sin(t) * spread;
      let px = x + tx * u + bx * v;
      let py = y + by * v;
      let pz = z + tz * u + bz * v;
      const pl = Math.hypot(px, py, pz);
      px /= pl;
      py /= pl;
      pz /= pl;
      if (!isLand(px, py, pz)) continue;
      const core = Math.exp(-(g * g) / 2);
      place(px, py, pz, 0.55 + core * 0.75);
    }
  }
  let v = 0;
  guard = 0;
  while (v < villages && guard++ < 6000) {
    const [x, y, z] = randomDir();
    if (Math.abs(y) > 0.78 || !isLand(x, y, z) || field.height(x, y, z) > 0.42) continue;
    place(x, y, z, 0.4 + rand() * 0.25);
    v += 1;
  }
  return { data: new Float32Array(out), count: out.length / 6 };
}

function buildMoon(rand: () => number) {
  const sphere = icosphere(2);
  const { verts, faces, faceCount, vertexCount } = sphere;
  const noise = makeNoise(SEED + 9);
  const craters: Array<[number, number, number, number, number]> = [];
  for (let i = 0; i < 9; i++) {
    const y = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    craters.push([Math.cos(a) * r, y, Math.sin(a) * r, 0.22 + rand() * 0.3, 0.05 + rand() * 0.06]);
  }
  const radius = new Float64Array(vertexCount);
  const floor = new Float64Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const x = verts[i * 3], y = verts[i * 3 + 1], z = verts[i * 3 + 2];
    let r = 1 + noise(x * 2.4, y * 2.4, z * 2.4) * 0.03;
    let f = 0;
    for (const [cx, cy, cz, size, depth] of craters) {
      const d = Math.acos(Math.max(-1, Math.min(1, x * cx + y * cy + z * cz))) / size;
      if (d < 1) {
        r -= depth * (1 - d * d);
        f = Math.max(f, 1 - d);
      } else if (d < 1.35) {
        r += depth * 0.35 * Math.sin(((d - 1) / 0.35) * Math.PI);
      }
    }
    radius[i] = r;
    floor[i] = f;
  }
  const out: number[] = [];
  const colour = [0, 0, 0];
  for (let f = 0; f < faceCount; f++) {
    const a = faces[f * 3], b = faces[f * 3 + 1], c = faces[f * 3 + 2];
    const cx = verts[a * 3] + verts[b * 3] + verts[c * 3];
    const cy = verts[a * 3 + 1] + verts[b * 3 + 1] + verts[c * 3 + 1];
    const cz = verts[a * 3 + 2] + verts[b * 3 + 2] + verts[c * 3 + 2];
    const sea = smooth(0.05, 0.3, noise(cx * 0.9 + 5, cy * 0.9, cz * 0.9));
    const fl = Math.max(floor[a], floor[b], floor[c]);
    const j = 1 + (rand() - 0.5) * 0.07;
    for (let k = 0; k < 3; k++) {
      const base = C.moon[k] + (C.moonSea[k] - C.moon[k]) * sea;
      colour[k] = (base + (C.crater[k] - base) * smooth(0.2, 0.7, fl)) * j;
    }
    const ra = radius[a], rb = radius[b], rc = radius[c];
    pushTri(
      out,
      verts[a * 3] * ra, verts[a * 3 + 1] * ra, verts[a * 3 + 2] * ra,
      verts[b * 3] * rb, verts[b * 3 + 1] * rb, verts[b * 3 + 2] * rb,
      verts[c * 3] * rc, verts[c * 3 + 1] * rc, verts[c * 3 + 2] * rc,
      colour,
    );
  }
  return { data: new Float32Array(out), vertices: out.length / 9 };
}

export function buildWorld(detail: Detail): World {
  const field = makeField();
  const rand = mulberry(SEED + 100);
  const terrain = buildTerrain(detail.level, field, rand);
  const ocean = buildOcean(terrain.sphere, terrain.radius);
  const pine = buildPine();
  const trees = buildTrees(terrain, detail.trees, mulberry(SEED + 200));
  const puff = buildPuff();
  const clouds = buildClouds(detail.banks, mulberry(SEED + 300));
  const lights = buildLights(field, detail.towns, detail.villages, mulberry(SEED + 400));
  const moon = buildMoon(mulberry(SEED + 500));
  const shell = icosphere(3);
  const shellData = new Float32Array(shell.vertexCount * 3);
  for (let i = 0; i < shellData.length; i++) shellData[i] = shell.verts[i];
  return {
    terrain: terrain.data,
    terrainVertices: terrain.vertices,
    ocean: ocean.data,
    oceanIndices: ocean.indices,
    treeMesh: pine.data,
    treeMeshVertices: pine.vertices,
    trees: trees.data,
    treeCount: trees.count,
    puffMesh: puff.data,
    puffMeshVertices: puff.vertices,
    puffs: clouds.puffs,
    puffCount: clouds.puffCount,
    banks: clouds.banks,
    bankCount: clouds.bankCount,
    lights: lights.data,
    lightCount: lights.count,
    moon: moon.data,
    moonVertices: moon.vertices,
    shell: shellData,
    shellIndices: shell.faces,
    land: terrain.land,
  };
}
