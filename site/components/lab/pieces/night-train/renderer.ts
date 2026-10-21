// WebGL2 plumbing for the night train: programs, buffers, render targets
// and the pass order (see shaders.ts for what each pass does). The valley
// is built once (world.ts) and uploaded once; per frame only the camera,
// the light and the cars change, carried by a uniform block per view.
// Nothing here allocates per frame.

import { createProgram } from "../../gl";
import { lookAt, multiply, ortho, type Mat4, type Vec3 } from "./math";
import {
  BEAM_FS,
  CAR_VS,
  carDepthFS,
  carFS,
  DEPTH_FS,
  DOWN_FS,
  FINAL_FS,
  POST_VS,
  SHADOW_CUT,
  SKY_FS,
  SKY_VS,
  STATIC_FS,
  STATIC_VS,
  TREE_FS,
  TREE_VS,
  UP_FS,
  WATER_FS,
  WATER_VS,
  type ShaderOptions,
} from "./shaders";
import type { Light } from "./sky";
import { MAX_CAR_LIGHTS, MAX_INSTANCES, type Timetable } from "./trains";
import {
  buildCars,
  buildPine,
  buildStatic,
  buildTrees,
  buildWater,
  CAR_INSTANCE,
  CAR_STRIDE,
  RECESS,
  STATIC_STRIDE,
  TRACK_LEN,
  TREE_INSTANCE,
  TREE_STRIDE,
  type StaticMesh,
} from "./world";

export type Quality = "tile" | "stage";

/** What the piece hands the renderer each frame. */
export type Frame = {
  viewProj: Mat4;
  invViewProj: Mat4;
  eye: Vec3;
  light: Light;
  timetable: Timetable;
  time: number;
  /** 0 freezes clouds, ripples, sway and twinkle (reduced motion / motion off) */
  motion: number;
  /** cloud drift (its own clock, so it can be frozen) */
  drift: number;
  /** the sun disc's size (1 = at rest; it swells while held) */
  sunScale: number;
  /** hamlet windows: share of them lit */
  windows: number;
  /** the train's interior light (0..1) */
  trainGlow: number;
  /** radians per internal pixel (for stars) */
  pixelAngle: number;
  bloom: number;
  grain: number;
};

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };

// the world is the same for every mount of a mode: build it once
const meshCache = new Map<Quality, { scenery: StaticMesh; trees: { data: Float32Array; count: number } }>();
let pineCache: StaticMesh | null = null;
let carCache: ReturnType<typeof buildCars> | null = null;
let waterCache: Float32Array | null = null;

function world(mode: Quality) {
  let entry = meshCache.get(mode);
  if (!entry) {
    entry = { scenery: buildStatic(mode), trees: buildTrees(mode) };
    meshCache.set(mode, entry);
  }
  pineCache ??= buildPine();
  carCache ??= buildCars();
  waterCache ??= buildWater();
  return { ...entry, pine: pineCache, cars: carCache, water: waterCache };
}

/** The part of the valley the shadow map covers. */
const SHADOW_BOX = { x0: -100, x1: 100, y0: -3, y1: 48, z0: 6, z1: SHADOW_CUT };
const S_LO = -RECESS;
const S_HI = TRACK_LEN + RECESS;

const FLOATS = 160;
const O = {
  viewProj: 0, invViewProj: 16, shadowMat: 32, cam: 48, keyDir: 52, keyCol: 56, sunDir: 60, sunCol: 64,
  moonDir: 68, moonCol: 72, zenith: 76, horizon: 80, glow: 84, skyAmb: 88, groundAmb: 92, haze: 96,
  cloudLit: 100, cloudShade: 104, headPos: 108, headDir: 112, head2Pos: 116, head2Dir: 120, carLights: 124, misc: 156,
} as const;

export class TrainRenderer {
  readonly hdr: boolean;
  private gl: WebGL2RenderingContext;
  private mode: Quality;
  private samples: number;
  private programs: WebGLProgram[] = [];
  private pStatic: WebGLProgram;
  private pTree: WebGLProgram;
  private pCar: WebGLProgram;
  private pStaticDepth: WebGLProgram;
  private pTreeDepth: WebGLProgram;
  private pCarDepth: WebGLProgram;
  private pSky: WebGLProgram;
  private pWater: WebGLProgram;
  private pBeam: WebGLProgram;
  private pDown: WebGLProgram;
  private pUp: WebGLProgram;
  private pFinal: WebGLProgram;
  private loc = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();

  private ubo: { main: WebGLBuffer; mirror: WebGLBuffer; shadow: WebGLBuffer };
  private data = new Float32Array(FLOATS);
  private buffers: WebGLBuffer[] = [];
  private vaoStatic: WebGLVertexArrayObject;
  private vaoTree: WebGLVertexArrayObject;
  private vaoCar: WebGLVertexArrayObject;
  private vaoWater: WebGLVertexArrayObject;
  private vaoEmpty: WebGLVertexArrayObject;
  private staticCount: number;
  private treeIndexCount: number;
  private treeCount: number;
  private carInstances: WebGLBuffer;
  private carStaging = new Float32Array(MAX_INSTANCES * CAR_INSTANCE);
  private coachRange: [number, number];
  private engineRange: [number, number];

  private shadowSize: number;
  private shadowTex: WebGLTexture;
  private shadowFbo: WebGLFramebuffer;
  private trainShadowTex: WebGLTexture;
  private trainShadowFbo: WebGLFramebuffer;
  private lightView: Mat4 = new Float32Array(16);
  private lightProj: Mat4 = new Float32Array(16);
  private lightVP: Mat4 = new Float32Array(16);
  // (not NaN: a comparison with NaN is false, and the first fit would never run)
  private lastKey: Vec3 = [9, 9, 9];
  private shadowTexel = 0.1;
  private shadowFresh = false;

  private w = 0;
  private h = 0;
  private msFbo: WebGLFramebuffer | null = null;
  private msColor: WebGLRenderbuffer | null = null;
  private msDepth: WebGLRenderbuffer | null = null;
  private scene: Target | null = null;
  private sceneDepth: WebGLTexture | null = null;
  private mirror: Target | null = null;
  private mirrorDepth: WebGLRenderbuffer | null = null;
  private beam: Target | null = null;
  private down: Target[] = [];
  private up: Target[] = [];

  constructor(gl: WebGL2RenderingContext, mode: Quality) {
    this.gl = gl;
    this.mode = mode;
    this.hdr = Boolean(gl.getExtension("EXT_color_buffer_float"));
    const maxSamples = (gl.getParameter(gl.MAX_SAMPLES) as number) || 0;
    this.samples = Math.min(4, maxSamples);
    const o: ShaderOptions = { hdr: this.hdr, tile: mode === "tile" };

    const make = (vs: string, fs: string) => {
      const p = createProgram(gl, vs, fs);
      this.programs.push(p);
      const block = gl.getUniformBlockIndex(p, "Frame");
      if (block !== gl.INVALID_INDEX) gl.uniformBlockBinding(p, block, 0);
      return p;
    };
    this.pStatic = make(STATIC_VS(o), STATIC_FS(o));
    this.pTree = make(TREE_VS(o), TREE_FS(o));
    this.pCar = make(CAR_VS(o), carFS(o, S_LO, S_HI));
    this.pStaticDepth = make(STATIC_VS(o), DEPTH_FS(o));
    this.pTreeDepth = make(TREE_VS(o), DEPTH_FS(o));
    this.pCarDepth = make(CAR_VS(o), carDepthFS(o, S_LO, S_HI));
    this.pSky = make(SKY_VS(o), SKY_FS(o));
    this.pWater = make(WATER_VS(o), WATER_FS(o));
    this.pBeam = make(POST_VS(o), BEAM_FS(o));
    this.pDown = make(POST_VS(o), DOWN_FS(o));
    this.pUp = make(POST_VS(o), UP_FS(o));
    this.pFinal = make(POST_VS(o), FINAL_FS(o));

    const buffer = (target: number, data: ArrayBufferView, usage: number) => {
      const b = gl.createBuffer();
      if (!b) throw new Error("night-train: no buffer");
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, usage);
      this.buffers.push(b);
      return b;
    };
    const ubo = () => {
      const b = gl.createBuffer();
      if (!b) throw new Error("night-train: no uniform buffer");
      gl.bindBuffer(gl.UNIFORM_BUFFER, b);
      gl.bufferData(gl.UNIFORM_BUFFER, FLOATS * 4, gl.DYNAMIC_DRAW);
      this.buffers.push(b);
      return b;
    };
    this.ubo = { main: ubo(), mirror: ubo(), shadow: ubo() };
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    const vao = () => {
      const v = gl.createVertexArray();
      if (!v) throw new Error("night-train: no vertex array");
      return v;
    };
    const attr = (loc: number, size: number, stride: number, offset: number, divisor = 0) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, offset * 4);
      gl.vertexAttribDivisor(loc, divisor);
    };

    const { scenery, trees, pine, cars, water } = world(mode);

    // the scenery
    this.vaoStatic = vao();
    gl.bindVertexArray(this.vaoStatic);
    buffer(gl.ARRAY_BUFFER, scenery.vertices, gl.STATIC_DRAW);
    attr(0, 3, STATIC_STRIDE, 0);
    attr(1, 3, STATIC_STRIDE, 3);
    attr(2, 1, STATIC_STRIDE, 6);
    attr(3, 4, STATIC_STRIDE, 7);
    buffer(gl.ELEMENT_ARRAY_BUFFER, scenery.indices, gl.STATIC_DRAW);
    this.staticCount = scenery.indices.length;

    // pines: one tree, many instances
    this.vaoTree = vao();
    gl.bindVertexArray(this.vaoTree);
    buffer(gl.ARRAY_BUFFER, pine.vertices, gl.STATIC_DRAW);
    attr(0, 3, TREE_STRIDE, 0);
    attr(1, 3, TREE_STRIDE, 3);
    attr(2, 1, TREE_STRIDE, 6);
    attr(3, 1, TREE_STRIDE, 7);
    buffer(gl.ARRAY_BUFFER, trees.data, gl.STATIC_DRAW);
    attr(4, 4, TREE_INSTANCE, 0, 1);
    attr(5, 4, TREE_INSTANCE, 4, 1);
    buffer(gl.ELEMENT_ARRAY_BUFFER, pine.indices, gl.STATIC_DRAW);
    this.treeIndexCount = pine.indices.length;
    this.treeCount = trees.count;

    // the cars: two shapes, instances written each frame
    this.vaoCar = vao();
    gl.bindVertexArray(this.vaoCar);
    buffer(gl.ARRAY_BUFFER, cars.vertices, gl.STATIC_DRAW);
    attr(0, 3, CAR_STRIDE, 0);
    attr(1, 3, CAR_STRIDE, 3);
    attr(2, 1, CAR_STRIDE, 6);
    attr(3, 2, CAR_STRIDE, 7);
    this.carInstances = buffer(gl.ARRAY_BUFFER, this.carStaging, gl.DYNAMIC_DRAW);
    attr(4, 4, CAR_INSTANCE, 0, 1);
    attr(5, 4, CAR_INSTANCE, 4, 1);
    attr(6, 4, CAR_INSTANCE, 8, 1);
    buffer(gl.ELEMENT_ARRAY_BUFFER, cars.indices, gl.STATIC_DRAW);
    this.coachRange = cars.coach;
    this.engineRange = cars.engine;

    this.vaoWater = vao();
    gl.bindVertexArray(this.vaoWater);
    buffer(gl.ARRAY_BUFFER, water, gl.STATIC_DRAW);
    attr(0, 3, 3, 0);

    this.vaoEmpty = vao();
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // the shadow maps: the valley's own (redrawn only when the light moves)
    // and a copy of it with the cars added (each frame a train is out)
    this.shadowSize = mode === "stage" ? 2048 : 1024;
    const depthMap = () => {
      const tex = gl.createTexture();
      const fbo = gl.createFramebuffer();
      if (!tex || !fbo) throw new Error("night-train: no shadow map");
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, this.shadowSize, this.shadowSize);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
      gl.drawBuffers([gl.NONE]);
      gl.readBuffer(gl.NONE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fbo };
    };
    const still = depthMap();
    const moving = depthMap();
    this.shadowTex = still.tex;
    this.shadowFbo = still.fbo;
    this.trainShadowTex = moving.tex;
    this.trainShadowFbo = moving.fbo;
  }

  /* -------------------------------------------------------------------- */
  /* targets                                                               */
  /* -------------------------------------------------------------------- */

  private colorTexture(w: number, h: number): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error("night-train: no texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, this.hdr ? gl.RGBA16F : gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  private target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = this.colorTexture(w, h);
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("night-train: no framebuffer");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h };
  }

  private freeTarget(t: Target | null) {
    if (!t) return;
    this.gl.deleteTexture(t.tex);
    this.gl.deleteFramebuffer(t.fbo);
  }

  private freeTargets() {
    const gl = this.gl;
    this.freeTarget(this.scene);
    this.freeTarget(this.mirror);
    this.freeTarget(this.beam);
    for (const t of this.down) this.freeTarget(t);
    for (const t of this.up) this.freeTarget(t);
    this.down = [];
    this.up = [];
    if (this.sceneDepth) gl.deleteTexture(this.sceneDepth);
    if (this.mirrorDepth) gl.deleteRenderbuffer(this.mirrorDepth);
    if (this.msFbo) gl.deleteFramebuffer(this.msFbo);
    if (this.msColor) gl.deleteRenderbuffer(this.msColor);
    if (this.msDepth) gl.deleteRenderbuffer(this.msDepth);
    this.scene = this.mirror = this.beam = null;
    this.sceneDepth = null;
    this.mirrorDepth = null;
    this.msFbo = null;
    this.msColor = this.msDepth = null;
  }

  /** The internal size (the final pass scales it to the canvas). */
  setSize(w: number, h: number) {
    const gl = this.gl;
    w = Math.max(4, Math.round(w));
    h = Math.max(4, Math.round(h));
    if (w === this.w && h === this.h && this.scene) return;
    this.w = w;
    this.h = h;
    this.freeTargets();

    // the resolved scene, with a depth texture the beams read
    this.scene = this.target(w, h);
    const depth = gl.createTexture();
    if (!depth) throw new Error("night-train: no depth texture");
    gl.bindTexture(gl.TEXTURE_2D, depth);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
    this.sceneDepth = depth;

    // multisampled, resolved into the above
    if (this.samples > 1) {
      const fbo = gl.createFramebuffer();
      const color = gl.createRenderbuffer();
      const dep = gl.createRenderbuffer();
      if (fbo && color && dep) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, color);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, this.hdr ? gl.RGBA16F : gl.RGBA8, w, h);
        gl.bindRenderbuffer(gl.RENDERBUFFER, dep);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dep);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
          this.msFbo = fbo;
          this.msColor = color;
          this.msDepth = dep;
        } else {
          gl.deleteFramebuffer(fbo);
          gl.deleteRenderbuffer(color);
          gl.deleteRenderbuffer(dep);
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      }
    }

    // the river's mirror, at half size
    const mw = Math.max(2, Math.round(w / 2));
    const mh = Math.max(2, Math.round(h / 2));
    this.mirror = this.target(mw, mh);
    const md = gl.createRenderbuffer();
    if (!md) throw new Error("night-train: no renderbuffer");
    gl.bindRenderbuffer(gl.RENDERBUFFER, md);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mw, mh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.mirror.fbo);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, md);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    this.mirrorDepth = md;

    this.beam = this.target(mw, mh);

    // bloom chain
    const levels = this.mode === "stage" ? 6 : 4;
    let bw = mw;
    let bh = mh;
    for (let i = 0; i < levels; i++) {
      this.down.push(this.target(bw, bh));
      this.up.push(this.target(bw, bh));
      bw = Math.max(1, Math.round(bw / 2));
      bh = Math.max(1, Math.round(bh / 2));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  get width() {
    return this.w;
  }
  get height() {
    return this.h;
  }

  /* -------------------------------------------------------------------- */
  /* per frame                                                             */
  /* -------------------------------------------------------------------- */

  private u(p: WebGLProgram, name: string): WebGLUniformLocation | null {
    let m = this.loc.get(p);
    if (!m) {
      m = new Map();
      this.loc.set(p, m);
    }
    if (!m.has(name)) m.set(name, this.gl.getUniformLocation(p, name));
    return m.get(name) ?? null;
  }

  /** Fit the shadow map to the valley as seen from the key light. */
  private fitShadow(key: Vec3) {
    const B = SHADOW_BOX;
    const cx = (B.x0 + B.x1) / 2;
    const cy = (B.y0 + B.y1) / 2;
    const cz = (B.z0 + B.z1) / 2;
    const eye: Vec3 = [cx + key[0] * 400, cy + key[1] * 400, cz + key[2] * 400];
    const up: Vec3 = Math.abs(key[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
    lookAt(this.lightView, eye, [cx, cy, cz], up);
    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    const m = this.lightView;
    for (let i = 0; i < 8; i++) {
      const x = i & 1 ? B.x1 : B.x0;
      const y = i & 2 ? B.y1 : B.y0;
      const z = i & 4 ? B.z1 : B.z0;
      const vx = m[0] * x + m[4] * y + m[8] * z + m[12];
      const vy = m[1] * x + m[5] * y + m[9] * z + m[13];
      const vz = m[2] * x + m[6] * y + m[10] * z + m[14];
      minX = Math.min(minX, vx); maxX = Math.max(maxX, vx);
      minY = Math.min(minY, vy); maxY = Math.max(maxY, vy);
      minZ = Math.min(minZ, vz); maxZ = Math.max(maxZ, vz);
    }
    ortho(this.lightProj, minX, maxX, minY, maxY, -maxZ - 5, -minZ + 5);
    multiply(this.lightVP, this.lightProj, this.lightView);
    this.shadowTexel = Math.max(maxX - minX, maxY - minY) / this.shadowSize;
  }

  /** Fill and upload one view's uniform block. */
  private writeBlock(buffer: WebGLBuffer, f: Frame, view: "main" | "mirror" | "shadow", key: Vec3, keyCol: Vec3) {
    const d = this.data;
    const L = f.light;
    const T = f.timetable;
    if (view === "shadow") d.set(this.lightVP, O.viewProj);
    else d.set(f.viewProj, O.viewProj);
    d.set(f.invViewProj, O.invViewProj);
    d.set(this.lightVP, O.shadowMat);
    const put = (o: number, x: number, y: number, z: number, w: number) => {
      d[o] = x;
      d[o + 1] = y;
      d[o + 2] = z;
      d[o + 3] = w;
    };
    const ey = view === "mirror" ? -f.eye[1] : f.eye[1];
    put(O.cam, f.eye[0], ey, f.eye[2], f.time);
    put(O.keyDir, key[0], key[1], key[2], this.shadowTexel);
    put(O.keyCol, keyCol[0], keyCol[1], keyCol[2], view === "mirror" ? 1 : 0);
    put(O.sunDir, L.sunDir[0], L.sunDir[1], L.sunDir[2], f.sunScale);
    put(O.sunCol, L.sun[0], L.sun[1], L.sun[2], L.el);
    put(O.moonDir, L.moonDir[0], L.moonDir[1], L.moonDir[2], L.night);
    put(O.moonCol, L.moon[0], L.moon[1], L.moon[2], L.dark);
    put(O.zenith, L.zenith[0], L.zenith[1], L.zenith[2], L.stars);
    put(O.horizon, L.horizon[0], L.horizon[1], L.horizon[2], L.mist);
    put(O.glow, L.glow[0], L.glow[1], L.glow[2], L.density);
    put(O.skyAmb, L.skyAmb[0], L.skyAmb[1], L.skyAmb[2], f.windows);
    put(O.groundAmb, L.groundAmb[0], L.groundAmb[1], L.groundAmb[2], view === "mirror" ? f.pixelAngle * 2 : f.pixelAngle);
    put(O.haze, L.haze[0], L.haze[1], L.haze[2], f.drift);
    put(O.cloudLit, L.cloudLit[0], L.cloudLit[1], L.cloudLit[2], view === "shadow" ? 0 : f.motion);
    put(O.cloudShade, L.cloudShade[0], L.cloudShade[1], L.cloudShade[2], 0);
    put(O.headPos, T.headPos[0], T.headPos[1], T.headPos[2], T.head);
    put(O.headDir, T.headDir[0], T.headDir[1], T.headDir[2], 0);
    put(O.head2Pos, T.head2Pos[0], T.head2Pos[1], T.head2Pos[2], T.head2);
    put(O.head2Dir, T.head2Dir[0], T.head2Dir[1], T.head2Dir[2], 0);
    const n = Math.min(MAX_CAR_LIGHTS, T.carLightCount);
    d.fill(0, O.carLights, O.carLights + 32);
    for (let i = 0; i < n * 4; i++) d[O.carLights + i] = T.carLights[i] * (i % 4 === 3 ? f.trainGlow : 1);
    put(O.misc, n, f.trainGlow, 0, 0);
    const gl = this.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, d);
  }

  /** Engines first, then coaches (each shape is one instanced draw). */
  private uploadCars(T: Timetable): [number, number] {
    const src = T.instances;
    const dst = this.carStaging;
    let engines = 0;
    let k = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < T.instanceCount; i++) {
        const kind = src[i * CAR_INSTANCE + 7];
        if ((pass === 0) !== (kind < 0.5)) continue;
        for (let j = 0; j < CAR_INSTANCE; j++) dst[k * CAR_INSTANCE + j] = src[i * CAR_INSTANCE + j];
        k++;
      }
      if (pass === 0) engines = k;
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.carInstances);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, dst, 0, Math.max(1, k) * CAR_INSTANCE);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return [engines, k - engines];
  }

  private drawCars(engines: number, coaches: number) {
    const gl = this.gl;
    if (!engines && !coaches) return;
    gl.bindVertexArray(this.vaoCar);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.carInstances);
    const point = (first: number) => {
      const base = first * CAR_INSTANCE * 4;
      gl.vertexAttribPointer(4, 4, gl.FLOAT, false, CAR_INSTANCE * 4, base);
      gl.vertexAttribPointer(5, 4, gl.FLOAT, false, CAR_INSTANCE * 4, base + 16);
      gl.vertexAttribPointer(6, 4, gl.FLOAT, false, CAR_INSTANCE * 4, base + 32);
    };
    if (engines) {
      point(0);
      gl.drawElementsInstanced(gl.TRIANGLES, this.engineRange[1], gl.UNSIGNED_INT, this.engineRange[0] * 4, engines);
    }
    if (coaches) {
      point(engines);
      gl.drawElementsInstanced(gl.TRIANGLES, this.coachRange[1], gl.UNSIGNED_INT, this.coachRange[0] * 4, coaches);
    }
    point(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private drawScenery(depthOnly: boolean, cars: [number, number], withScenery = true, withCars = true) {
    const gl = this.gl;
    if (!withScenery) {
      gl.useProgram(depthOnly ? this.pCarDepth : this.pCar);
      if (!depthOnly) gl.uniform1i(this.u(this.pCar, "uShadow"), 1);
      this.drawCars(cars[0], cars[1]);
      return;
    }
    gl.useProgram(depthOnly ? this.pStaticDepth : this.pStatic);
    if (!depthOnly) gl.uniform1i(this.u(this.pStatic, "uShadow"), 1);
    gl.bindVertexArray(this.vaoStatic);
    gl.drawElements(gl.TRIANGLES, this.staticCount, gl.UNSIGNED_INT, 0);
    gl.useProgram(depthOnly ? this.pTreeDepth : this.pTree);
    if (!depthOnly) gl.uniform1i(this.u(this.pTree, "uShadow"), 1);
    gl.bindVertexArray(this.vaoTree);
    gl.drawElementsInstanced(gl.TRIANGLES, this.treeIndexCount, gl.UNSIGNED_INT, 0, this.treeCount);
    if (!withCars) return;
    gl.useProgram(depthOnly ? this.pCarDepth : this.pCar);
    if (!depthOnly) gl.uniform1i(this.u(this.pCar, "uShadow"), 1);
    this.drawCars(cars[0], cars[1]);
  }

  private drawSky() {
    const gl = this.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(this.pSky);
    gl.bindVertexArray(this.vaoEmpty);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
  }

  private fullscreen(target: Target | null, w: number, h: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(this.vaoEmpty);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * Draw a frame to the canvas (canvasW × canvasH device px). `beams`
   * skips the beam pass when nothing would show.
   */
  draw(f: Frame, canvasW: number, canvasH: number, beams: boolean) {
    const gl = this.gl;
    const scene = this.scene;
    const mirror = this.mirror;
    if (!scene || !mirror || !this.beam || !this.sceneDepth) return;
    const L = f.light;
    const T = f.timetable;

    // the key light: the sun until it is down, then the moon
    const sunKey = L.el > -0.9;
    const key = sunKey ? L.sunDir : L.moonDir;
    const keyCol = sunKey ? L.sun : L.moon;
    const keyMoved =
      Math.abs(key[0] - this.lastKey[0]) > 1e-4 || Math.abs(key[1] - this.lastKey[1]) > 1e-4 || Math.abs(key[2] - this.lastKey[2]) > 1e-4;
    if (keyMoved) {
      this.lastKey[0] = key[0];
      this.lastKey[1] = key[1];
      this.lastKey[2] = key[2];
      this.fitShadow(key);
    }
    const cars = this.uploadCars(T);
    const carsShown = cars[0] + cars[1] > 0;

    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // 1. the shadow maps: the valley's when the light moved; with a train
    //    out, a copy of it with the cars drawn in
    const size = this.shadowSize;
    if (keyMoved || !this.shadowFresh) {
      this.writeBlock(this.ubo.shadow, f, "shadow", key, keyCol);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.ubo.shadow);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFbo);
      gl.viewport(0, 0, size, size);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.6, 3.0);
      this.drawScenery(true, cars, true, false);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      this.shadowFresh = true;
    }
    let shadowMap = this.shadowTex;
    if (carsShown) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.shadowFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.trainShadowFbo);
      gl.blitFramebuffer(0, 0, size, size, 0, 0, size, size, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      if (!keyMoved) {
        this.writeBlock(this.ubo.shadow, f, "shadow", key, keyCol);
      }
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.ubo.shadow);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.trainShadowFbo);
      gl.viewport(0, 0, size, size);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.6, 3.0);
      this.drawScenery(true, cars, false, true);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      shadowMap = this.trainShadowTex;
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    gl.activeTexture(gl.TEXTURE0);

    // 2. the mirror
    this.writeBlock(this.ubo.mirror, f, "mirror", key, keyCol);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.ubo.mirror);
    gl.bindFramebuffer(gl.FRAMEBUFFER, mirror.fbo);
    gl.viewport(0, 0, mirror.w, mirror.h);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    this.drawSky();
    this.drawScenery(false, cars);

    // 3. the scene
    this.writeBlock(this.ubo.main, f, "main", key, keyCol);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.ubo.main);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFbo ?? scene.fbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    this.drawSky();
    this.drawScenery(false, cars);
    gl.useProgram(this.pWater);
    gl.uniform1i(this.u(this.pWater, "uShadow"), 1);
    gl.uniform1i(this.u(this.pWater, "uMirror"), 2);
    gl.uniform2f(this.u(this.pWater, "uViewport"), this.w, this.h);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, mirror.tex);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(this.vaoWater);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (this.msFbo) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, scene.fbo);
      gl.blitFramebuffer(0, 0, this.w, this.h, 0, 0, this.w, this.h, gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }
    gl.disable(gl.DEPTH_TEST);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);

    // 4. the beams in the air
    const showBeams = beams && (T.head > 0 || T.head2 > 0) && L.dark > 0.01;
    if (showBeams) {
      gl.useProgram(this.pBeam);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.sceneDepth);
      gl.uniform1i(this.u(this.pBeam, "uDepth"), 0);
      this.fullscreen(this.beam, this.beam.w, this.beam.h);
    }

    // 5. bloom: down the chain, then back up
    gl.useProgram(this.pDown);
    gl.uniform1i(this.u(this.pDown, "uSrc"), 0);
    let src = scene;
    for (let i = 0; i < this.down.length; i++) {
      const dst = this.down[i];
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform2f(this.u(this.pDown, "uTexel"), 1 / src.w, 1 / src.h);
      gl.uniform1f(this.u(this.pDown, "uFirst"), i === 0 ? 1 : 0);
      gl.uniform1f(this.u(this.pDown, "uThreshold"), 1.05 / L.exposure);
      this.fullscreen(dst, dst.w, dst.h);
      src = dst;
    }
    gl.useProgram(this.pUp);
    gl.uniform1i(this.u(this.pUp, "uSrc"), 0);
    gl.uniform1i(this.u(this.pUp, "uBase"), 1);
    const last = this.down.length - 1;
    // the smallest level starts the climb as itself
    let from: Target = this.down[last];
    for (let i = last - 1; i >= 0; i--) {
      const dst = this.up[i];
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.down[i].tex);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, from.tex);
      gl.uniform2f(this.u(this.pUp, "uTexel"), 1 / from.w, 1 / from.h);
      gl.uniform1f(this.u(this.pUp, "uWeight"), 1);
      this.fullscreen(dst, dst.w, dst.h);
      from = dst;
    }

    // 6. to the canvas
    gl.useProgram(this.pFinal);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, from.tex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.beam.tex);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.u(this.pFinal, "uScene"), 0);
    gl.uniform1i(this.u(this.pFinal, "uBloom"), 1);
    gl.uniform1i(this.u(this.pFinal, "uBeam"), 2);
    gl.uniform1f(this.u(this.pFinal, "uExposure"), L.exposure);
    gl.uniform1f(this.u(this.pFinal, "uBloomMix"), f.bloom / this.down.length);
    gl.uniform1f(this.u(this.pFinal, "uTime"), f.time);
    gl.uniform1f(this.u(this.pFinal, "uGrain"), f.grain);
    gl.uniform1f(this.u(this.pFinal, "uBeamOn"), showBeams ? 1 : 0);
    const lift = 0.0018 * L.night;
    gl.uniform3f(this.u(this.pFinal, "uLift"), lift * 0.8, lift * 0.95, lift * 1.4);
    this.fullscreen(null, canvasW, canvasH);

    // leave clean state behind
    for (let unit = 2; unit >= 0; unit--) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.bindVertexArray(null);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, null);
  }

  dispose() {
    const gl = this.gl;
    this.freeTargets();
    gl.deleteTexture(this.shadowTex);
    gl.deleteFramebuffer(this.shadowFbo);
    gl.deleteTexture(this.trainShadowTex);
    gl.deleteFramebuffer(this.trainShadowFbo);
    for (const p of this.programs) gl.deleteProgram(p);
    for (const b of this.buffers) gl.deleteBuffer(b);
    gl.deleteVertexArray(this.vaoStatic);
    gl.deleteVertexArray(this.vaoTree);
    gl.deleteVertexArray(this.vaoCar);
    gl.deleteVertexArray(this.vaoWater);
    gl.deleteVertexArray(this.vaoEmpty);
  }
}
