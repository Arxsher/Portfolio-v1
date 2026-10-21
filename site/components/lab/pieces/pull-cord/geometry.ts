// The lamp and the cord, measured in scene units (1 unit = 1 CSS px on the
// big desktop stage; layout.ts scales the whole scene to fit). Shared by
// the physics (collisions, where the cord leaves the shade) and the shader
// (which receives the same numbers as constants, see shaders.ts).
//
// Lamp space: the origin is the centre of the shade's rim, x to the right,
// y up the lamp's axis, z toward the viewer. The camera looks up at the
// lamp a little (TILT), so the rim reads as an ellipse with the lit
// inside of the shade showing through it. A point (x, y, z) of the lamp
// lands on the screen at (x, y·cos TILT + z·sin TILT) in the lamp's own
// screen frame, which the swing then rotates about the canopy.

/** Shade: half an ellipsoid, rim radius × height. */
export const DOME_R = 84;
export const DOME_H = 58;
/** The brass neck the cable enters at the top. */
export const NECK_R = 8;
export const NECK_TOP = 74;
/** A clear globe bulb, its centre a little below the rim plane. */
export const BULB_R = 18;
export const BULB_Y = -5;
/** The brass grommet on the rim the pull cord comes out of. */
export const GROMMET_X = 80.5;
export const GROMMET_R = 3.4;
export const GROMMET_BOTTOM = -4.5;
export const GROMMET_TOP = 2;
/** The ceiling cup. */
export const CANOPY_R = 24;
export const CANOPY_H = 12;
/** Radii of the cable and the pull cord. */
export const CABLE_R = 1.7;
export const CORD_R = 2.1;
/** The porcelain pull: an uneven capsule (bottom radius, top radius, centre distance). */
export const BEAD_R1 = 8.4;
export const BEAD_R2 = 3.4;
export const BEAD_H = 16;
/** Cord length that disappears into the top of the pull. */
export const BEAD_ATTACH = BEAD_H + BEAD_R2 - 1.2;
/** Total length of the pull, top to bottom. */
export const BEAD_LENGTH = BEAD_R1 + BEAD_H + BEAD_R2;

/** How far the camera looks up at the lamp (radians). */
export const TILT = 0.22;
export const TILT_C = Math.cos(TILT);
export const TILT_S = Math.sin(TILT);

/** Height of the shade's outline on screen (the silhouette of the tilted ellipsoid). */
export const DOME_SIL = Math.sqrt((DOME_H * TILT_C) ** 2 + (DOME_R * TILT_S) ** 2);
/** Half height of the rim ellipse on screen. */
export const RIM_E = DOME_R * TILT_S;

/** Where the cord leaves the grommet, in the lamp's screen frame (x, y up). */
export const EXIT_X = GROMMET_X;
export const EXIT_Y = GROMMET_BOTTOM * TILT_C;
/** The bulb's centre in the lamp's screen frame. */
export const BULB_SY = BULB_Y * TILT_C;
/** Top of the neck (where the cable leaves) in the lamp's screen frame. */
export const NECK_SY = NECK_TOP * TILT_C;

/** The lamp's centre of mass, below the canopy along the cable (from the rim centre, up). */
export const MASS_Y = 22;
