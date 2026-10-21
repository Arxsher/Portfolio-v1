// WebGL2 plumbing for the tiny planet: programs, buffers and the pass
// order (see shaders.ts). Geometry is uploaded once; each frame sets a
// handful of uniforms and draws. Nothing here allocates per frame.

import { createProgram, uniformLocations } from "../../gl";
import {
  AIR_FS,
  AIR_VS,
  BACKDROP_FS,
  BACKDROP_VS,
  CLOUD_FS,
  CLOUD_VS,
  DOTS_FS,
  DOTS_VS,
  LAND_FS,
  LAND_VS,
  LIGHTS_FS,
  LIGHTS_VS,
  MOON_FS,
  MOON_VS,
  PINE_VS,
  SEA_FS,
  SEA_VS,
} from "./shaders";
import type { World } from "./world";

export type Frame = {
  viewProj: Float32Array;
  cam: Float32Array;
  sun: Float32Array;
  time: number;
  dark: number;
  /** Planet model → world (rotation × radius). */
  rot: Float32Array;
  /** Cloud layer model → world. */
  cloudRot: Float32Array;
  bulge: Float32Array;
  planetR: number;
  air: Float32Array;
  sway: number;
  wave: number;
  moon: Float32Array; // centre xyz, radius
  moonRot: Float32Array;
  banks: Float32Array;
  bankCount: number;
  lights: number;
  stars: number;
  glow: number;
  bg: Float32Array;
  /** CSS px: canvas size, planet centre and radius; and device px per CSS px. */
  width: number;
  height: number;
  cx: number;
  cy: number;
  radiusPx: number;
  dpr: number;
  /** Orbit axes × radius, and the dots' colour (sRGB + alpha). */
  orbitU: Float32Array;
  orbitV: Float32Array;
  dotColour: Float32Array;
  dotPx: number;
  lightPx: number;
};

export function newFrame(): Frame {
  return {
    viewProj: new Float32Array(16),
    cam: new Float32Array(3),
    sun: new Float32Array(3),
    time: 0,
    dark: 0,
    rot: new Float32Array(9),
    cloudRot: new Float32Array(9),
    bulge: new Float32Array([1, 1, 1]),
    planetR: 1,
    air: new Float32Array(3),
    sway: 0,
    wave: 0.0016,
    moon: new Float32Array(4),
    moonRot: new Float32Array(9),
    banks: new Float32Array(64),
    bankCount: 0,
    lights: 1,
    stars: 0,
    glow: 1,
    bg: new Float32Array([0.95, 0.95, 0.95]),
    width: 1,
    height: 1,
    cx: 0,
    cy: 0,
    radiusPx: 1,
    dpr: 1,
    orbitU: new Float32Array(3),
    orbitV: new Float32Array(3),
    dotColour: new Float32Array([0, 0, 0, 0.2]),
    dotPx: 2,
    lightPx: 4,
  };
}

const DOTS = 150;

type Program = { program: WebGLProgram; u: (name: string) => WebGLUniformLocation | null };

export class PlanetRenderer {
  private gl: WebGL2RenderingContext;
  private backdrop: Program;
  private land: Program;
  private pine: Program;
  private cloud: Program;
  private sea: Program;
  private moon: Program;
  private lights: Program;
  private dots: Program;
  private air: Program;
  private vaos: WebGLVertexArrayObject[] = [];
  private buffers: WebGLBuffer[] = [];
  private emptyVao: WebGLVertexArrayObject;
  private landVao: WebGLVertexArrayObject;
  private pineVao: WebGLVertexArrayObject;
  private cloudVao: WebGLVertexArrayObject;
  private seaVao: WebGLVertexArrayObject;
  private moonVao: WebGLVertexArrayObject;
  private lightsVao: WebGLVertexArrayObject;
  private dotsVao: WebGLVertexArrayObject;
  private airVao: WebGLVertexArrayObject;
  private world: World;
  private seaCount: number;
  private airCount: number;

  constructor(gl: WebGL2RenderingContext, world: World) {
    this.gl = gl;
    this.world = world;
    const make = (vs: string, fs: string): Program => {
      const program = createProgram(gl, vs, fs);
      return { program, u: uniformLocations(gl, program) };
    };
    this.backdrop = make(BACKDROP_VS, BACKDROP_FS);
    this.land = make(LAND_VS, LAND_FS);
    this.pine = make(PINE_VS, LAND_FS);
    this.cloud = make(CLOUD_VS, CLOUD_FS);
    this.sea = make(SEA_VS, SEA_FS);
    this.moon = make(MOON_VS, MOON_FS);
    this.lights = make(LIGHTS_VS, LIGHTS_FS);
    this.dots = make(DOTS_VS, DOTS_FS);
    this.air = make(AIR_VS, AIR_FS);

    this.emptyVao = this.vao();

    // land: position, normal, colour
    this.landVao = this.vao();
    this.buffer(gl.ARRAY_BUFFER, world.terrain);
    this.attrib(0, 3, 36, 0);
    this.attrib(1, 3, 36, 12);
    this.attrib(2, 3, 36, 24);

    // pines: mesh + instances
    this.pineVao = this.vao();
    this.buffer(gl.ARRAY_BUFFER, world.treeMesh);
    this.attrib(0, 3, 28, 0);
    this.attrib(1, 3, 28, 12);
    this.attrib(2, 1, 28, 24);
    this.buffer(gl.ARRAY_BUFFER, world.trees);
    this.attrib(3, 4, 32, 0, 1);
    this.attrib(4, 4, 32, 16, 1);

    // clouds: puff mesh + instances
    this.cloudVao = this.vao();
    this.buffer(gl.ARRAY_BUFFER, world.puffMesh);
    this.attrib(0, 3, 24, 0);
    this.attrib(1, 3, 24, 12);
    this.buffer(gl.ARRAY_BUFFER, world.puffs);
    this.attrib(2, 4, 32, 0, 1);
    this.attrib(3, 4, 32, 16, 1);

    // sea: indexed sphere with depth
    this.seaVao = this.vao();
    this.buffer(gl.ARRAY_BUFFER, world.ocean);
    this.attrib(0, 3, 16, 0);
    this.attrib(1, 1, 16, 12);
    this.buffer(gl.ELEMENT_ARRAY_BUFFER, world.oceanIndices);
    this.seaCount = world.oceanIndices.length;

    // moon
    this.moonVao = this.vao();
    this.buffer(gl.ARRAY_BUFFER, world.moon);
    this.attrib(0, 3, 36, 0);
    this.attrib(1, 3, 36, 12);
    this.attrib(2, 3, 36, 24);

    // town lights
    this.lightsVao = this.vao();
    this.buffer(gl.ARRAY_BUFFER, world.lights);
    this.attrib(0, 3, 24, 0);
    this.attrib(1, 3, 24, 12);

    // orbit dots
    this.dotsVao = this.vao();
    const angles = new Float32Array(DOTS);
    for (let i = 0; i < DOTS; i++) angles[i] = (i / DOTS) * Math.PI * 2;
    this.buffer(gl.ARRAY_BUFFER, angles);
    this.attrib(0, 1, 4, 0);

    // atmosphere shell
    this.airVao = this.vao();
    this.buffer(gl.ARRAY_BUFFER, world.shell);
    this.attrib(0, 3, 12, 0);
    this.buffer(gl.ELEMENT_ARRAY_BUFFER, world.shellIndices);
    this.airCount = world.shellIndices.length;

    gl.bindVertexArray(null);
  }

  private vao(): WebGLVertexArrayObject {
    const vao = this.gl.createVertexArray();
    if (!vao) throw new Error("tiny-planet: no vertex array");
    this.vaos.push(vao);
    this.gl.bindVertexArray(vao);
    return vao;
  }

  private buffer(target: number, data: ArrayBufferView) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("tiny-planet: no buffer");
    this.buffers.push(buffer);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.STATIC_DRAW);
  }

  private attrib(location: number, size: number, stride: number, offset: number, divisor = 0) {
    const gl = this.gl;
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
    if (divisor) gl.vertexAttribDivisor(location, divisor);
  }

  /** Uniforms every surface pass shares. */
  private shared(p: Program, f: Frame) {
    const gl = this.gl;
    const u = p.u;
    gl.uniformMatrix4fv(u("uViewProj"), false, f.viewProj);
    gl.uniformMatrix3fv(u("uRot"), false, f.rot);
    gl.uniform3fv(u("uBulge"), f.bulge);
    gl.uniform3fv(u("uSun"), f.sun);
    gl.uniform3fv(u("uCam"), f.cam);
    gl.uniform1f(u("uTime"), f.time);
    gl.uniform1f(u("uDark"), f.dark);
    gl.uniform4fv(u("uMoon"), f.moon);
    gl.uniform4fv(u("uBanks"), f.banks);
    gl.uniform1i(u("uBankCount"), f.bankCount);
  }

  draw(f: Frame, pixelWidth: number, pixelHeight: number) {
    const gl = this.gl;
    const w = this.world;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    // backdrop
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.backdrop.program);
    {
      const u = this.backdrop.u;
      gl.uniform3fv(u("uBg"), f.bg);
      gl.uniform2f(u("uRes"), f.width, f.height);
      gl.uniform2f(u("uCenter"), f.cx, f.cy);
      gl.uniform1f(u("uRadius"), f.radiusPx);
      gl.uniform1f(u("uDark"), f.dark);
      gl.uniform1f(u("uTime"), f.time);
      gl.uniform1f(u("uStars"), f.stars);
    }
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // land
    gl.useProgram(this.land.program);
    this.shared(this.land, f);
    gl.bindVertexArray(this.landVao);
    gl.drawArrays(gl.TRIANGLES, 0, w.terrainVertices);

    // pines
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.pine.program);
    this.shared(this.pine, f);
    gl.uniform3fv(this.pine.u("uAir"), f.air);
    gl.uniform1f(this.pine.u("uSway"), f.sway);
    gl.bindVertexArray(this.pineVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, w.treeMeshVertices, w.treeCount);
    gl.enable(gl.CULL_FACE);

    // moon
    gl.useProgram(this.moon.program);
    this.shared(this.moon, f);
    gl.uniformMatrix3fv(this.moon.u("uMoonRot"), false, f.moonRot);
    gl.uniform1f(this.moon.u("uPlanetR"), f.planetR);
    gl.bindVertexArray(this.moonVao);
    gl.drawArrays(gl.TRIANGLES, 0, w.moonVertices);

    // clouds
    gl.useProgram(this.cloud.program);
    this.shared(this.cloud, f);
    gl.uniformMatrix3fv(this.cloud.u("uCloudRot"), false, f.cloudRot);
    gl.bindVertexArray(this.cloudVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, w.puffMeshVertices, w.puffCount);

    // sea over the sea floor
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.sea.program);
    this.shared(this.sea, f);
    gl.uniform1f(this.sea.u("uWave"), f.wave);
    gl.bindVertexArray(this.seaVao);
    gl.drawElements(gl.TRIANGLES, this.seaCount, gl.UNSIGNED_SHORT, 0);

    gl.depthMask(false);

    // the moon's orbit
    gl.useProgram(this.dots.program);
    {
      const u = this.dots.u;
      gl.uniformMatrix4fv(u("uViewProj"), false, f.viewProj);
      gl.uniform3fv(u("uU"), f.orbitU);
      gl.uniform3fv(u("uV"), f.orbitV);
      gl.uniform4fv(u("uMoon"), f.moon);
      gl.uniform1f(u("uDot"), f.dotPx);
      gl.uniform1f(u("uPlanetR"), f.planetR);
      gl.uniform4fv(u("uColour"), f.dotColour);
    }
    gl.bindVertexArray(this.dotsVao);
    gl.drawArrays(gl.POINTS, 0, DOTS);

    // town lights, added
    if (f.lights > 0.001) {
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.lights.program);
      this.shared(this.lights, f);
      gl.uniform1f(this.lights.u("uPx"), f.lightPx);
      gl.uniform1f(this.lights.u("uLights"), f.lights);
      gl.bindVertexArray(this.lightsVao);
      gl.drawArrays(gl.POINTS, 0, w.lightCount);
    }

    // the air
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.air.program);
    {
      const u = this.air.u;
      gl.uniformMatrix4fv(u("uViewProj"), false, f.viewProj);
      gl.uniform1f(u("uShell"), f.planetR * 1.34);
      gl.uniform3fv(u("uSun"), f.sun);
      gl.uniform3fv(u("uCam"), f.cam);
      gl.uniform1f(u("uPlanetR"), f.planetR);
      gl.uniform1f(u("uDark"), f.dark);
      gl.uniform1f(u("uGlow"), f.glow);
    }
    gl.bindVertexArray(this.airVao);
    gl.drawElements(gl.TRIANGLES, this.airCount, gl.UNSIGNED_SHORT, 0);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    for (const p of [this.backdrop, this.land, this.pine, this.cloud, this.sea, this.moon, this.lights, this.dots, this.air]) {
      gl.deleteProgram(p.program);
    }
    for (const vao of this.vaos) gl.deleteVertexArray(vao);
    for (const buffer of this.buffers) gl.deleteBuffer(buffer);
    this.vaos = [];
    this.buffers = [];
  }
}
