// WebGL2 plumbing for the dusk picture: the scene pass draws one texel per
// dot into a small texture, the dither pass maps it onto the canvas with
// whole-pixel dots. Two scene textures take turns so a dot-size change can
// dissolve from the old grid into the new one. Nothing here knows React,
// and draw() allocates nothing.

import { createProgram, drawFullscreen, FULLSCREEN_VERTEX, uniformLocations } from "../../gl";
import type { Levels } from "./look";
import { DITHER, SCENE } from "./shaders";

type Grid = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  /** dots across and down */
  cols: number;
  rows: number;
  /** device px per dot */
  cellPx: number;
  /** grid origin in device px (≤ 0: the partial dots are split between the edges) */
  ox: number;
  oy: number;
};

export type PaletteRGB = ReadonlyArray<readonly [number, number, number]>;

export type DuskFrame = {
  time: number;
  /** sun x across the picture (0..1) and elevation (degrees) */
  sunX: number;
  elevation: number;
  tile: boolean;
  palette: PaletteRGB;
  previousPalette: PaletteRGB;
  /** each palette's tone curve */
  levels: Levels;
  previousLevels: Levels;
  /** 0 → 1 while a new palette dissolves in */
  paletteMix: number;
  /** 0 → 1 while a new dot size dissolves in */
  dotMix: number;
  dim: number;
};

/** Pack up to four colours into `out` (reused every frame). */
const flat = (palette: PaletteRGB, out: Float32Array) => {
  out.fill(0);
  const n = Math.min(4, palette.length);
  for (let i = 0; i < n; i++) {
    const c = palette[i];
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  return out;
};

export class DuskRenderer {
  private gl: WebGL2RenderingContext;
  private scene: WebGLProgram;
  private dither: WebGLProgram;
  private us: (name: string) => WebGLUniformLocation | null;
  private ud: (name: string) => WebGLUniformLocation | null;
  private vao: WebGLVertexArrayObject;
  private grids: [Grid | null, Grid | null] = [null, null];
  private current = 0;
  private width = 0;
  private height = 0;
  private pal = new Float32Array(12);
  private prevPal = new Float32Array(12);

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.scene = createProgram(gl, FULLSCREEN_VERTEX, SCENE);
    this.dither = createProgram(gl, FULLSCREEN_VERTEX, DITHER);
    this.us = uniformLocations(gl, this.scene);
    this.ud = uniformLocations(gl, this.dither);
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("dusk: could not allocate a vertex array");
    this.vao = vao;
  }

  /** Whether the grid must be (re)built for this canvas and dot size. */
  needsGrid(width: number, height: number, cellPx: number): boolean {
    const g = this.grids[this.current];
    return !g || this.width !== width || this.height !== height || g.cellPx !== cellPx;
  }

  /**
   * Lay the dot grid over a canvas of width × height device px. With
   * `keepPrevious` the old grid stays (frozen) for a dissolve.
   */
  setGrid(width: number, height: number, cellPx: number, keepPrevious: boolean) {
    const gl = this.gl;
    const resized = this.width !== width || this.height !== height;
    this.width = width;
    this.height = height;
    if (keepPrevious && !resized && this.grids[this.current]) {
      this.current = 1 - this.current;
    } else {
      // nothing to dissolve from: drop the other grid
      this.free(1 - this.current);
    }
    this.free(this.current);
    const cols = Math.ceil(width / cellPx);
    const rows = Math.ceil(height / cellPx);
    const texture = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!texture || !fbo) throw new Error("dusk: could not allocate the dot grid");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.grids[this.current] = {
      texture,
      fbo,
      cols,
      rows,
      cellPx,
      ox: Math.floor((width - cols * cellPx) / 2),
      oy: Math.floor((height - rows * cellPx) / 2),
    };
  }

  get hasPrevious(): boolean {
    return Boolean(this.grids[1 - this.current]);
  }

  /** Forget the old grid once its dissolve is over. */
  dropPrevious() {
    this.free(1 - this.current);
  }

  draw(frame: DuskFrame) {
    const gl = this.gl;
    const grid = this.grids[this.current];
    if (!grid) return;
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(this.vao);

    // 1. the scene, one texel per dot
    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.fbo);
    gl.viewport(0, 0, grid.cols, grid.rows);
    gl.useProgram(this.scene);
    const us = this.us;
    gl.uniform2f(us("uCells"), grid.cols, grid.rows);
    gl.uniform1f(us("uAspect"), (grid.cols * grid.cellPx) / (grid.rows * grid.cellPx));
    gl.uniform1f(us("uTime"), frame.time);
    gl.uniform2f(us("uSun"), frame.sunX, frame.elevation);
    gl.uniform1f(us("uTile"), frame.tile ? 1 : 0);
    gl.uniform1f(us("uZoom"), frame.tile ? 1.28 : 1);
    drawFullscreen(gl);

    // 2. the dither, onto the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.dither);
    const ud = this.ud;
    const previous = this.grids[1 - this.current];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, grid.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, (previous ?? grid).texture);
    gl.uniform1i(ud("uScene"), 0);
    gl.uniform1i(ud("uPrev"), 1);
    gl.uniform2f(ud("uRes"), this.width, this.height);
    gl.uniform1f(ud("uCellPx"), grid.cellPx);
    gl.uniform2f(ud("uOffset"), grid.ox, grid.oy);
    gl.uniform1f(ud("uPrevCellPx"), (previous ?? grid).cellPx);
    gl.uniform2f(ud("uPrevOffset"), (previous ?? grid).ox, (previous ?? grid).oy);
    gl.uniform1f(ud("uDotMix"), previous ? frame.dotMix : 1);
    gl.uniform3fv(ud("uPal"), flat(frame.palette, this.pal));
    gl.uniform1i(ud("uCount"), Math.min(4, frame.palette.length));
    const L = frame.levels;
    gl.uniform4f(ud("uLevels"), L[0], L[1], L[2], L[3]);
    gl.uniform3fv(ud("uPrevPal"), flat(frame.previousPalette, this.prevPal));
    gl.uniform1i(ud("uPrevCount"), Math.min(4, frame.previousPalette.length));
    const P = frame.previousLevels;
    gl.uniform4f(ud("uPrevLevels"), P[0], P[1], P[2], P[3]);
    gl.uniform1f(ud("uPalMix"), frame.paletteMix);
    gl.uniform1f(ud("uDim"), frame.dim);
    drawFullscreen(gl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(null);
  }

  private free(index: number) {
    const g = this.grids[index];
    if (!g) return;
    this.gl.deleteTexture(g.texture);
    this.gl.deleteFramebuffer(g.fbo);
    this.grids[index] = null;
  }

  dispose() {
    this.free(0);
    this.free(1);
    this.gl.deleteProgram(this.scene);
    this.gl.deleteProgram(this.dither);
    this.gl.deleteVertexArray(this.vao);
  }
}
