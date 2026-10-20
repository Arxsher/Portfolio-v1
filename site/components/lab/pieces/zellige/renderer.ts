// WebGL2 plumbing for the wall: one program, one vertex buffer (the fans
// from mesh.ts) and a float texture with three texels per piece (see
// shaders.ts). Nothing here knows about React.

import { createProgram, uniformLocations } from "../../gl";
import { FLOATS_PER_VERTEX } from "./mesh";
import { FRAGMENT, VERTEX } from "./shaders";

/** Floats per piece in the tile data (3 RGBA texels). */
export const TILE_STRIDE = 12;
const PER_ROW = 256;

export type Vec3 = readonly [number, number, number];

export type Lighting = {
  key: Vec3;
  ambient: Vec3;
  lightPower: number;
  /** Falloff distance as a share of the view's diagonal. */
  lightRadius: number;
  lightSize: number;
  specGain: number;
  groutColor: Vec3;
  body: Vec3;
  envTop: Vec3;
  envBottom: Vec3;
  windowColor: Vec3;
  window: readonly [number, number, number, number];
  vignette: number;
  exposure: number;
};

export type Frame = {
  time: number;
  width: number;
  height: number;
  grout: number;
  relief: number;
  light: Vec3;
  motion: boolean;
  lighting: Lighting;
};

export class WallRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buffer: WebGLBuffer;
  private texture: WebGLTexture;
  private u: (name: string) => WebGLUniformLocation | null;
  private count = 0;
  private rows = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = createProgram(gl, VERTEX, FRAGMENT);
    this.u = uniformLocations(gl, this.program);
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!vao || !buffer || !texture) throw new Error("zellige: could not allocate GL objects");
    this.vao = vao;
    this.buffer = buffer;
    this.texture = texture;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const stride = FLOATS_PER_VERTEX * 4;
    const attribute = (location: number, size: number, offset: number) => {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * 4);
    };
    attribute(0, 2, 0); // position
    attribute(1, 2, 2); // piece centre
    attribute(2, 3, 4); // edge distance, edge normal
    attribute(3, 4, 7); // index, reach, radius, shape
    gl.bindVertexArray(null);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /** New wall geometry. */
  setVertices(vertices: Float32Array, count: number) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    this.count = count;
  }

  /** Tile data: TILE_STRIDE floats per piece (resized to whole rows here). */
  setTiles(data: Float32Array, pieces: number) {
    const gl = this.gl;
    const rows = Math.max(1, Math.ceil(pieces / PER_ROW));
    const width = PER_ROW * 3;
    const needed = rows * width * 4;
    let upload = data;
    if (data.length < needed) {
      upload = new Float32Array(needed);
      upload.set(data.subarray(0, Math.min(data.length, needed)));
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    if (rows !== this.rows) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, rows, 0, gl.RGBA, gl.FLOAT, upload, 0);
      this.rows = rows;
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, rows, gl.RGBA, gl.FLOAT, upload, 0);
    }
  }

  draw(frame: Frame) {
    const gl = this.gl;
    const { lighting: l } = frame;
    const diagonal = Math.hypot(frame.width, frame.height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.count) return;
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const u = this.u;
    gl.uniform1i(u("u_tiles"), 0);
    gl.uniform2f(u("u_res"), frame.width, frame.height);
    gl.uniform1f(u("u_time"), frame.time);
    gl.uniform1f(u("u_grout"), frame.grout);
    gl.uniform1f(u("u_relief"), frame.relief);
    gl.uniform3f(u("u_light"), frame.light[0], frame.light[1], frame.light[2]);
    gl.uniform1f(u("u_lightPower"), l.lightPower);
    gl.uniform1f(u("u_lightRadius"), l.lightRadius * diagonal);
    gl.uniform1f(u("u_lightSize"), l.lightSize);
    gl.uniform1f(u("u_specGain"), l.specGain);
    // scalar setters: nothing is converted or allocated per frame
    this.v3("u_key", l.key);
    this.v3("u_ambient", l.ambient);
    this.v3("u_groutColor", l.groutColor);
    this.v3("u_body", l.body);
    this.v3("u_envTop", l.envTop);
    this.v3("u_envBottom", l.envBottom);
    this.v3("u_windowColor", l.windowColor);
    gl.uniform4f(u("u_window"), l.window[0], l.window[1], l.window[2], l.window[3]);
    gl.uniform1f(u("u_motion"), frame.motion ? 1 : 0);
    gl.uniform1f(u("u_vignette"), l.vignette);
    gl.uniform1f(u("u_exposure"), l.exposure);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
    gl.bindVertexArray(null);
  }

  private v3(name: string, v: Vec3) {
    this.gl.uniform3f(this.u(name), v[0], v[1], v[2]);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.buffer);
    gl.deleteTexture(this.texture);
  }
}
