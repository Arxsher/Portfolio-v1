// How a folded plane sits in the world. Sheet space has the nose at +x and
// the written side facing −z; a finished plane's "up" is −z (the halves fold
// toward the reader). Screen space is x right, y down, z away.
//
//   flightQuat   nose to the right, wings level, seen a little from above
//   NOTE_QUAT    the flat sheet facing the reader, text upright

import { quatAxis, quatMul, type Quat } from "./math";

const DEG = Math.PI / 180;

/** Sheet → screen for a level plane flying right, seen exactly side-on. */
const BASE = quatAxis(1, 0, 0, -90 * DEG);

export const NOTE_QUAT: Quat = [0, 0, 0, 1];

/**
 * A flying plane: `tilt` shows the top of the wings (degrees, + = seen
 * from above), `yaw` turns the nose toward (−) or away from (+) the
 * viewer, `pitch` lifts the nose, `roll` banks about the nose.
 */
export function flightQuat(tilt: number, yaw: number, pitch: number, roll: number): Quat {
  let q = quatMul(quatAxis(1, 0, 0, roll * DEG), BASE);
  q = quatMul(quatAxis(0, 1, 0, yaw * DEG), q);
  q = quatMul(quatAxis(0, 0, 1, -pitch * DEG), q);
  return quatMul(quatAxis(1, 0, 0, tilt * DEG), q);
}

/** Point of a finished plane that it turns about (its middle). */
export const PLANE_PIVOT = { x: -2, y: 0, z: -20 } as const;

/** Length of a finished plane in sheet units (nose to tail). */
export const PLANE_LENGTH = 389;
