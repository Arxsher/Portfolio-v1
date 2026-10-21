// WebGL2 renderer for the holo cards: one full-screen pass for the stage's
// shadows, then the three cards back to front, each a strip of quads (the
// bend only curves across the card) shaded by shaders.ts with its faces
// from two texture arrays (print in sRGB, masks linear; mipmapped and
// anisotropically filtered, since the cards tilt). No depth buffer: the
// cards are drawn in order of depth. Nothing allocates per frame.

import { createProgram, drawFullscreen, FULLSCREEN_VERTEX, uniformLocations } from "../../gl";
import { BACK_LAYER, CARD_LOOK, CARD_MM_H, CARD_MM_W, EMBLEM_MM, LATTICE_MM, LAYERS } from "./art";
import { BEND, CARD_H, CARD_R, CARD_W, COUNT, type Card } from "./deck";
import { BACKDROP_FRAGMENT, CARD_FRAGMENT, CARD_VERTEX } from "./shaders";
import type { View } from "./view";

export type Vec3 = [number, number, number];

/** The lighting of the room the cards are in (one per theme, mixed between). */
export type Look = {
  ambient: Vec3;
  light: Vec3;
  envTop: Vec3;
  envBottom: Vec3;
  /** The soft overhead light's share of the foil colour. */
  sky: Vec3;
  foilGain: number;
  /** Shadow strengths on the stage: toward the light, and the contact shadow behind. */
  shadow: number;
  contact: number;
  /** A faint pool of the lamp's light on the stage (night). */
  pool: number;
  poolColor: Vec3;
};

export const DAY: Look = {
  ambient: [0.5, 0.5, 0.52],
  light: [1.0, 0.98, 0.95],
  envTop: [0.9, 0.9, 0.93],
  envBottom: [0.1, 0.1, 0.106],
  sky: [0.34, 0.34, 0.35],
  foilGain: 2.1,
  shadow: 0.36,
  contact: 0.24,
  pool: 0,
  poolColor: [0, 0, 0],
};

export const NIGHT: Look = {
  ambient: [0.15, 0.145, 0.14],
  light: [1.2, 1.12, 1.0],
  envTop: [0.42, 0.39, 0.37],
  envBottom: [0.012, 0.012, 0.013],
  sky: [0.1, 0.095, 0.09],
  foilGain: 2.3,
  shadow: 0.55,
  contact: 0.4,
  pool: 0.075,
  poolColor: [1.0, 0.86, 0.68],
};

export function blankLook(): Look {
  return {
    ambient: [0, 0, 0],
    light: [0, 0, 0],
    envTop: [0, 0, 0],
    envBottom: [0, 0, 0],
    sky: [0, 0, 0],
    foilGain: 0,
    shadow: 0,
    contact: 0,
    pool: 0,
    poolColor: [0, 0, 0],
  };
}

/** Mix day and night into `out` (t: 0 day, 1 night). */
export function mixLook(t: number, out: Look): Look {
  const mix3 = (a: Vec3, b: Vec3, o: Vec3) => {
    o[0] = a[0] + (b[0] - a[0]) * t;
    o[1] = a[1] + (b[1] - a[1]) * t;
    o[2] = a[2] + (b[2] - a[2]) * t;
  };
  mix3(DAY.ambient, NIGHT.ambient, out.ambient);
  mix3(DAY.light, NIGHT.light, out.light);
  mix3(DAY.envTop, NIGHT.envTop, out.envTop);
  mix3(DAY.envBottom, NIGHT.envBottom, out.envBottom);
  mix3(DAY.sky, NIGHT.sky, out.sky);
  mix3(DAY.poolColor, NIGHT.poolColor, out.poolColor);
  out.foilGain = DAY.foilGain + (NIGHT.foilGain - DAY.foilGain) * t;
  out.shadow = DAY.shadow + (NIGHT.shadow - DAY.shadow) * t;
  out.contact = DAY.contact + (NIGHT.contact - DAY.contact) * t;
  out.pool = DAY.pool + (NIGHT.pool - DAY.pool) * t;
  return out;
}

export type Frame = {
  view: View;
  dpr: number;
  cards: readonly Card[];
  drawOrder: readonly number[];
  light: Float32Array;
  look: Look;
  /** Glints of the micro-facets (0 off). */
  sparkle: number;
};

/** Where the stage plane sits behind the deck (world z). */
export const BACK_Z = -0.42;

const mmToLocal = (x: number, y: number): [number, number] => [(x / CARD_MM_W - 0.5) * CARD_W, (0.5 - y / CARD_MM_H) * CARD_H];

export class HoloRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly cardProgram: WebGLProgram;
  private readonly backProgram: WebGLProgram;
  private readonly uc: (name: string) => WebGLUniformLocation | null;
  private readonly ub: (name: string) => WebGLUniformLocation | null;
  private readonly cardVao: WebGLVertexArrayObject;
  private readonly emptyVao: WebGLVertexArrayObject;
  private readonly buffers: WebGLBuffer[] = [];
  private readonly indexCount: number;
  private print: WebGLTexture | null = null;
  private mask: WebGLTexture | null = null;
  private texW = 0;
  private texH = 0;
  private readonly aniso: number;
  private readonly anisoExt: EXT_texture_filter_anisotropic | null;
  // scratch for the shadow uniforms
  private readonly sc = new Float32Array(9);
  private readonly sx = new Float32Array(9);
  private readonly sy = new Float32Array(9);
  private readonly sn = new Float32Array(9);
  private readonly emblems: Array<[number, number]>;
  private readonly emblemBack: [number, number];

  constructor(gl: WebGL2RenderingContext, segments: number) {
    this.gl = gl;
    this.cardProgram = createProgram(gl, CARD_VERTEX, CARD_FRAGMENT);
    this.backProgram = createProgram(gl, FULLSCREEN_VERTEX, BACKDROP_FRAGMENT);
    this.uc = uniformLocations(gl, this.cardProgram);
    this.ub = uniformLocations(gl, this.backProgram);

    // a strip of `segments` quads across the card (the bend only varies with x)
    const verts = new Float32Array((segments + 1) * 2 * 2);
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments - 0.5) * CARD_W;
      verts.set([x, -CARD_H / 2, x, CARD_H / 2], i * 4);
    }
    const index = new Uint16Array(segments * 6);
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      index.set([a, a + 2, a + 1, a + 1, a + 2, a + 3], i * 6);
    }
    this.indexCount = index.length;
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    if (!vao || !vbo || !ibo) throw new Error("holo-cards: could not create buffers");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.cardVao = vao;
    this.buffers.push(vbo, ibo);
    const empty = gl.createVertexArray();
    if (!empty) throw new Error("holo-cards: could not create a vertex array");
    this.emptyVao = empty;

    this.anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
    this.aniso = this.anisoExt ? Math.min(8, gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number) : 0;

    this.emblems = EMBLEM_MM.slice(0, COUNT).map(([x, y]) => mmToLocal(x, y));
    this.emblemBack = mmToLocal(EMBLEM_MM[BACK_LAYER][0], EMBLEM_MM[BACK_LAYER][1]);
  }

  /** (Re)allocate the face textures for faces `width` × `height` px. */
  allocate(width: number, height: number) {
    if (this.print && width === this.texW && height === this.texH) return;
    const gl = this.gl;
    if (this.print) gl.deleteTexture(this.print);
    if (this.mask) gl.deleteTexture(this.mask);
    const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
    const make = (format: number) => {
      const tex = gl.createTexture();
      if (!tex) throw new Error("holo-cards: could not create a texture");
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, format, width, height, LAYERS);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (this.anisoExt && this.aniso > 1) gl.texParameterf(gl.TEXTURE_2D_ARRAY, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, this.aniso);
      return tex;
    };
    this.print = make(gl.SRGB8_ALPHA8);
    this.mask = make(gl.RGBA8);
    this.texW = width;
    this.texH = height;
  }

  /** Upload one face (call allocate first, finishArt after the last). */
  uploadLayer(layer: number, print: TexImageSource, mask: ImageData) {
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.print);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, this.texW, this.texH, 1, gl.RGBA, gl.UNSIGNED_BYTE, print);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.mask);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, this.texW, this.texH, 1, gl.RGBA, gl.UNSIGNED_BYTE, mask);
  }

  finishArt() {
    const gl = this.gl;
    for (const tex of [this.print, this.mask]) {
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    }
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  }

  get hasArt() {
    return this.print !== null;
  }

  draw(frame: Frame) {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const { view, dpr, cards, look, light } = frame;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // every card's plane, for the shadows
    for (let i = 0; i < COUNT; i++) {
      const c = cards[i];
      const a = c.axes;
      this.sc[i * 3] = c.x;
      this.sc[i * 3 + 1] = c.y;
      // the bow pushes the middle of the card back a little
      this.sc[i * 3 + 2] = c.z + c.p[BEND] * CARD_W * CARD_W * (1 / 12);
      for (let k = 0; k < 3; k++) {
        this.sx[i * 3 + k] = a[k];
        this.sy[i * 3 + k] = a[3 + k];
        this.sn[i * 3 + k] = a[6 + k];
      }
    }

    // the stage: shadows (and the night's pool of light)
    const ub = this.ub;
    gl.useProgram(this.backProgram);
    gl.uniform4f(ub("uCam"), view.cx * dpr, view.cy * dpr, view.scale * view.depth * dpr, view.depth);
    gl.uniform2f(ub("uCanvas"), canvas.width, canvas.height);
    gl.uniform1f(ub("uEyeY"), view.yc);
    gl.uniform1f(ub("uBackZ"), BACK_Z);
    gl.uniform3fv(ub("uLight"), light);
    gl.uniform3fv(ub("uCardC"), this.sc);
    gl.uniform3fv(ub("uCardX"), this.sx);
    gl.uniform3fv(ub("uCardY"), this.sy);
    gl.uniform3fv(ub("uCardN"), this.sn);
    gl.uniform2f(ub("uHalf"), CARD_W / 2, CARD_H / 2);
    gl.uniform1f(ub("uRadius"), CARD_R);
    gl.uniform4f(ub("uShade"), look.shadow, look.contact, look.pool, 0);
    gl.uniform3fv(ub("uPool"), look.poolColor);
    drawFullscreen(gl, this.emptyVao);

    if (!this.print || !this.mask) return;

    // the cards, back to front
    const uc = this.uc;
    gl.useProgram(this.cardProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.print);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.mask);
    gl.uniform1i(uc("uPrint"), 0);
    gl.uniform1i(uc("uMask"), 1);
    gl.uniform2f(uc("uTexel"), 1 / this.texW, 1 / this.texH);
    gl.uniformMatrix4fv(uc("uViewProj"), false, view.viewProj);
    gl.uniform3fv(uc("uEye"), view.eye);
    gl.uniform3fv(uc("uLight"), light);
    gl.uniform3fv(uc("uLightColor"), look.light);
    gl.uniform3fv(uc("uAmbient"), look.ambient);
    gl.uniform3fv(uc("uEnvTop"), look.envTop);
    gl.uniform3fv(uc("uEnvBottom"), look.envBottom);
    gl.uniform3fv(uc("uSky"), look.sky);
    gl.uniform1f(uc("uFoilGain"), look.foilGain);
    gl.uniform1f(uc("uSparkle"), frame.sparkle);
    gl.uniform1i(uc("uDebug"), (globalThis as unknown as { __holoDebug?: number }).__holoDebug ?? 0);
    // the emboss reads the same at any texture size
    gl.uniform1f(uc("uEmboss"), 2.2 * (this.texW / 640));
    gl.uniform2f(uc("uHalf"), CARD_W / 2, CARD_H / 2);
    gl.uniform1f(uc("uRadius"), CARD_R);
    gl.uniform1f(uc("uBackLayer"), BACK_LAYER);
    gl.uniform2f(uc("uEmblemBack"), this.emblemBack[0], this.emblemBack[1]);
    gl.uniform1f(uc("uLatticeCell"), LATTICE_MM / CARD_MM_H);
    gl.uniform3fv(uc("uCardC"), this.sc);
    gl.uniform3fv(uc("uCardX"), this.sx);
    gl.uniform3fv(uc("uCardY"), this.sy);
    gl.uniform3fv(uc("uCardN"), this.sn);
    gl.bindVertexArray(this.cardVao);
    for (const id of frame.drawOrder) {
      const card = cards[id];
      const look = CARD_LOOK[id];
      gl.uniformMatrix4fv(uc("uModel"), false, card.model);
      gl.uniform1f(uc("uBend"), card.p[BEND]);
      gl.uniform1f(uc("uLayer"), id);
      gl.uniform1i(uc("uPattern"), look.pattern);
      gl.uniform1f(uc("uPearl"), look.pearl);
      gl.uniform2f(uc("uEmblem"), this.emblems[id][0], this.emblems[id][1]);
      gl.uniform1i(uc("uSelf"), id);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.cardProgram);
    gl.deleteProgram(this.backProgram);
    gl.deleteVertexArray(this.cardVao);
    gl.deleteVertexArray(this.emptyVao);
    for (const buffer of this.buffers) gl.deleteBuffer(buffer);
    if (this.print) gl.deleteTexture(this.print);
    if (this.mask) gl.deleteTexture(this.mask);
    this.print = this.mask = null;
  }
}
