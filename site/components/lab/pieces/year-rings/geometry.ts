// The slice as triangles, rebuilt from the ring bounds whenever the tree
// grows (a few thousand numbers into preallocated arrays, no allocation):
//
// - face: a fan from the pith to the wood's edge at the current growth
//   (the outline where the ring coordinate equals `grown`, warp included),
//   at the slice's top. The shader works out the rings per pixel.
// - bark: a band of six rows round the trunk, from the cambium at the
//   wood's edge, over the bark's rough top (a little lower than the sanded
//   wood) and its rounded lip, down the side to the floor. Thin while the
//   tree is young, thicker as it grows, varying round the trunk.
// - outline: the outer radius at SEG angles, for the floor's shadow.
//
// Angles go clockwise from the far side seen from above:
// (x, z) = (sin θ, −cos θ) · r.

import { BARK, boundAt, SEG, TAU, THICKNESS, unwarp, type Rings } from "./rings";

/** Rows of the bark band: radial offset (× bark width), extra offset, height below the face, profile v. */
const PROFILE: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 0, 0, 0],
  [0.22, 0, 0.0012, 0.22],
  [0.74, 0, 0.0034, 0.74],
  [1, 0, 0.0095, 1],
  [1, 0.0024, 0.024, 1.2],
  [1, 0.0042, THICKNESS, 2],
];
export const BARK_ROWS = PROFILE.length;
/** Floats per bark vertex: position 3, normal 3, uv 2. */
export const BARK_STRIDE = 8;

export type SliceMesh = {
  /** Fan: centre, then SEG + 1 rim vertices (xyz). */
  face: Float32Array;
  faceIndex: Uint16Array;
  bark: Float32Array;
  barkIndex: Uint16Array;
  /** Outer radius at SEG angles (floor shadow). */
  outline: Float32Array;
  /** Mean outer radius (for framing while it grows). */
  meanOuter: number;
};

export function newSliceMesh(): SliceMesh {
  const faceIndex = new Uint16Array(SEG * 3);
  for (let i = 0; i < SEG; i++) {
    faceIndex[i * 3] = 0;
    faceIndex[i * 3 + 1] = 1 + i;
    faceIndex[i * 3 + 2] = 2 + i;
  }
  const cols = SEG + 1;
  const barkIndex = new Uint16Array((BARK_ROWS - 1) * SEG * 6);
  let o = 0;
  for (let row = 0; row < BARK_ROWS - 1; row++) {
    for (let i = 0; i < SEG; i++) {
      const a = row * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      barkIndex[o++] = a;
      barkIndex[o++] = c;
      barkIndex[o++] = b;
      barkIndex[o++] = b;
      barkIndex[o++] = c;
      barkIndex[o++] = d;
    }
  }
  return {
    face: new Float32Array((SEG + 2) * 3),
    faceIndex,
    bark: new Float32Array(BARK_ROWS * cols * BARK_STRIDE),
    barkIndex,
    outline: new Float32Array(SEG),
    meanOuter: 1,
  };
}

const woodR = new Float32Array(SEG + 1);
const barkW = new Float32Array(SEG + 1);
const jag = new Float32Array(SEG + 1);

/** How thick the bark is round the trunk (0.8–1.2 ×), a fixed pattern. */
function barkVariation(theta: number) {
  return 1 + 0.12 * Math.sin(3 * theta + 0.4) + 0.08 * Math.sin(7 * theta + 2.1);
}

/** The bark's ragged outer edge: plates and cracks. */
function jagged(theta: number) {
  return (
    0.0024 * Math.sin(29 * theta + 0.3) +
    0.0016 * Math.sin(47 * theta + 1.9) +
    0.0011 * Math.sin(83 * theta + 4.4) +
    0.0007 * Math.sin(131 * theta + 2.2)
  );
}

/** Rebuild the mesh for a tree grown to `grown` rings (fractional while growing). */
export function updateSliceMesh(mesh: SliceMesh, rings: Rings, grown: number) {
  const H = THICKNESS;
  // the bark thickens as the trunk does
  let meanFull = 0;
  let meanNow = 0;
  for (let i = 0; i <= SEG; i++) {
    const theta = (i / SEG) * TAU;
    const r = unwarp(theta, boundAt(rings, grown, theta));
    woodR[i] = r;
    if (i < SEG) {
      meanNow += r;
      meanFull += boundAt(rings, rings.n, theta);
    }
  }
  meanNow /= SEG;
  meanFull /= SEG;
  const grownShare = Math.min(1, meanNow / Math.max(1e-6, meanFull));
  const scale = BARK * (0.32 + 0.68 * grownShare);
  for (let i = 0; i <= SEG; i++) {
    const theta = (i / SEG) * TAU;
    barkW[i] = scale * barkVariation(theta);
    jag[i] = jagged(theta) * (0.4 + 0.6 * grownShare);
  }

  // face fan
  const face = mesh.face;
  face[0] = 0;
  face[1] = H;
  face[2] = 0;
  for (let i = 0; i <= SEG; i++) {
    const theta = (i / SEG) * TAU;
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const o = (1 + i) * 3;
    face[o] = s * woodR[i];
    face[o + 1] = H;
    face[o + 2] = -c * woodR[i];
  }

  // bark band: positions and uv
  const cols = SEG + 1;
  const bark = mesh.bark;
  let outerSum = 0;
  for (let row = 0; row < BARK_ROWS; row++) {
    const [k, extra, drop, v] = PROFILE[row];
    for (let i = 0; i <= SEG; i++) {
      const theta = (i / SEG) * TAU;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      // rows past the lip carry the ragged edge
      const r = woodR[i] + barkW[i] * k + extra + (row >= 3 ? jag[i] : row === 2 ? jag[i] * 0.6 : 0);
      const o = (row * cols + i) * BARK_STRIDE;
      bark[o] = s * r;
      bark[o + 1] = H - drop;
      bark[o + 2] = -c * r;
      bark[o + 6] = i / SEG;
      bark[o + 7] = v;
      if (row === BARK_ROWS - 1 && i < SEG) {
        mesh.outline[i] = r;
        outerSum += r;
      }
    }
  }
  mesh.meanOuter = outerSum / SEG;

  // normals from the grid's neighbours
  for (let row = 0; row < BARK_ROWS; row++) {
    const r0 = Math.max(0, row - 1);
    const r1 = Math.min(BARK_ROWS - 1, row + 1);
    for (let i = 0; i <= SEG; i++) {
      const im = i === 0 ? SEG - 1 : i - 1;
      const ip = i === SEG ? 1 : i + 1;
      const a = (row * cols + ip) * BARK_STRIDE;
      const b = (row * cols + im) * BARK_STRIDE;
      const tx = bark[a] - bark[b];
      const ty = bark[a + 1] - bark[b + 1];
      const tz = bark[a + 2] - bark[b + 2];
      const p = (r1 * cols + i) * BARK_STRIDE;
      const q = (r0 * cols + i) * BARK_STRIDE;
      const px = bark[p] - bark[q];
      const py = bark[p + 1] - bark[q + 1];
      const pz = bark[p + 2] - bark[q + 2];
      // n = tθ × tprofile (outward, then up on the top rows)
      let nx = ty * pz - tz * py;
      let ny = tz * px - tx * pz;
      let nz = tx * py - ty * px;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const o = (row * cols + i) * BARK_STRIDE;
      bark[o + 3] = nx;
      bark[o + 4] = ny;
      bark[o + 5] = nz;
    }
  }
}
