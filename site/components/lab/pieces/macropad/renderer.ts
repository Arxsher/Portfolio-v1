// WebGL2 plumbing for the macropad: the four meshes from scene.ts, the
// surface shader, and a small bloom chain (the glow is drawn again, alone,
// at a quarter of the resolution, blurred at two radii and added on top).
// Nothing here knows about React.

import { createProgram, FULLSCREEN_VERTEX, uniformLocations } from "../../gl";
import type { Mat4, Vec3 } from "./math";
import { buildCap, buildCase, buildGround, buildKnob, FLOATS_PER_VERTEX, KEYS, KNOB, KNOB_BASE_Y, PLATE_Y, SKIRT_REST, TRAVEL, type Mesh } from "./scene";
import { BLUR, COMPOSITE, FRAGMENT, FRAGMENT_EMISSIVE, MAX_RIPPLES, VERTEX } from "./shaders";

/** Everything the shader needs to know about the room and the materials. */
export type Look = {
  keyDir: Vec3;
  keyColor: Vec3;
  sky: Vec3;
  horizon: Vec3;
  floor: Vec3;
  softbox: Vec3;
  strip: Vec3;
  ambient: number;
  exposure: number;
  caseAlbedo: Vec3;
  caseF0: Vec3;
  caseRough: number;
  caseMetal: number;
  edgeF0: Vec3;
  plateAlbedo: Vec3;
  knobF0: Vec3;
  engrave: Vec3;
  /** Ground shadow: contact, soft. */
  shadow: [number, number];
  glowGain: number;
  /** Where the LED light starts to roll off, keeping its hue (lower by day). */
  emitKnee: number;
  bloom: number;
};

export type Caps = { albedo: Vec3; legend: Vec3 };

/** One allocation per size: the glow at 1/4 and the two blur radii (1/4, 1/8). */
type Targets = { glow: Target; a: Target; b: Target; c: Target; d: Target };

export type Frame = {
  viewProj: Mat4;
  camPos: Vec3;
  fit: [number, number, number, number];
  look: Look;
  caps: Caps;
  /** Per key: travel 0..1. */
  travel: Float32Array;
  /** Per key: LED colour × intensity (9 × 3). */
  glow: Float32Array;
  /** MAX_RIPPLES × (x, z, radius, amplitude). */
  ripples: Float32Array;
  /** MAX_RIPPLES × rgb. */
  rippleColors: Float32Array;
  /** How many ripples are live (they come first; the shader stops there). */
  rippleCount: number;
  knobAngle: number;
  knobLight: Vec3;
  /** Fine texture strength (1 stage, ~0.4 tiles). */
  detail: number;
  /** Bloom on/off (tiles may skip it). */
  bloom: boolean;
};

type GpuMesh = { vao: WebGLVertexArrayObject; vbo: WebGLBuffer; ibo: WebGLBuffer; count: number };

type Target = { fbo: WebGLFramebuffer; tex: WebGLTexture; width: number; height: number; depth?: WebGLRenderbuffer };

const IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

export class PadRenderer {
  private gl: WebGL2RenderingContext;
  private main: WebGLProgram;
  private emissive: WebGLProgram;
  private blur: WebGLProgram;
  private composite: WebGLProgram;
  private uMain: (name: string) => WebGLUniformLocation | null;
  private uEmissive: (name: string) => WebGLUniformLocation | null;
  private uBlur: (name: string) => WebGLUniformLocation | null;
  private uComposite: (name: string) => WebGLUniformLocation | null;
  private meshes: { case: GpuMesh; cap: GpuMesh; knob: GpuMesh; ground: GpuMesh };
  private empty: WebGLVertexArrayObject;
  private atlas: WebGLTexture;
  private targets: Targets | null = null;
  private targetsW = 0;
  private targetsH = 0;
  private model = new Float32Array(16);

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.main = createProgram(gl, VERTEX, FRAGMENT);
    this.emissive = createProgram(gl, VERTEX, FRAGMENT_EMISSIVE);
    this.blur = createProgram(gl, FULLSCREEN_VERTEX, BLUR);
    this.composite = createProgram(gl, FULLSCREEN_VERTEX, COMPOSITE);
    this.uMain = uniformLocations(gl, this.main);
    this.uEmissive = uniformLocations(gl, this.emissive);
    this.uBlur = uniformLocations(gl, this.blur);
    this.uComposite = uniformLocations(gl, this.composite);
    this.meshes = {
      case: this.upload(buildCase()),
      cap: this.upload(buildCap()),
      knob: this.upload(buildKnob()),
      ground: this.upload(buildGround()),
    };
    const empty = gl.createVertexArray();
    const atlas = gl.createTexture();
    if (!empty || !atlas) throw new Error("macropad: could not allocate GL objects");
    this.empty = empty;
    this.atlas = atlas;
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  }

  private upload(mesh: Mesh): GpuMesh {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    if (!vao || !vbo || !ibo) throw new Error("macropad: could not allocate a mesh");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    const stride = FLOATS_PER_VERTEX * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, vbo, ibo, count: mesh.indices.length };
  }

  /** The legends and the engraving (a 4 × 4 atlas, see atlas.ts). */
  setAtlas(canvas: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
  }

  private target(width: number, height: number, depth: boolean, previous?: Target): Target {
    const gl = this.gl;
    if (previous && previous.width === width && previous.height === height) return previous;
    if (previous) this.freeTarget(previous);
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) throw new Error("macropad: could not allocate a render target");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let rb: WebGLRenderbuffer | undefined;
    if (depth) {
      rb = gl.createRenderbuffer() ?? undefined;
      if (rb) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, width, height, depth: rb };
  }

  private freeTarget(t: Target) {
    const gl = this.gl;
    gl.deleteFramebuffer(t.fbo);
    gl.deleteTexture(t.tex);
    if (t.depth) gl.deleteRenderbuffer(t.depth);
  }

  private ensureTargets(width: number, height: number): Targets {
    const t = this.targets;
    if (t && this.targetsW === width && this.targetsH === height) return t;
    const qw = Math.max(1, Math.round(width / 4));
    const qh = Math.max(1, Math.round(height / 4));
    const ew = Math.max(1, Math.round(width / 8));
    const eh = Math.max(1, Math.round(height / 8));
    this.targetsW = width;
    this.targetsH = height;
    this.targets = {
      glow: this.target(qw, qh, true, t?.glow),
      a: this.target(qw, qh, false, t?.a),
      b: this.target(qw, qh, false, t?.b),
      c: this.target(ew, eh, false, t?.c),
      d: this.target(ew, eh, false, t?.d),
    };
    return this.targets;
  }

  /** One blur pass from src into dst along (dx, dy) texels. */
  private blurPass(src: Target, dst: Target, dx: number, dy: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, dst.width, dst.height);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform2f(this.uBlur("uStep"), dx / src.width, dy / src.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private setShared(u: (name: string) => WebGLUniformLocation | null, frame: Frame) {
    const gl = this.gl;
    gl.uniformMatrix4fv(u("uViewProj"), false, frame.viewProj);
    gl.uniform4f(u("uFit"), frame.fit[0], frame.fit[1], frame.fit[2], frame.fit[3]);
    gl.uniform3fv(u("uCamPos"), frame.camPos);
    gl.uniform3fv(u("uGlow"), frame.glow);
    gl.uniform1fv(u("uPress"), frame.travel);
    gl.uniform4fv(u("uRipple"), frame.ripples);
    gl.uniform3fv(u("uRippleColor"), frame.rippleColors);
    gl.uniform1i(u("uRippleCount"), frame.rippleCount);
    gl.uniform3fv(u("uKnobLight"), frame.knobLight);
    gl.uniform1f(u("uGlowGain"), frame.look.glowGain);
    gl.uniform1f(u("uEmitKnee"), frame.look.emitKnee);
  }

  private setLook(u: (name: string) => WebGLUniformLocation | null, frame: Frame) {
    const gl = this.gl;
    const l = frame.look;
    gl.uniform3fv(u("uKeyDir"), l.keyDir);
    gl.uniform3fv(u("uKeyColor"), l.keyColor);
    gl.uniform3fv(u("uSky"), l.sky);
    gl.uniform3fv(u("uHorizon"), l.horizon);
    gl.uniform3fv(u("uFloor"), l.floor);
    gl.uniform3fv(u("uSoftbox"), l.softbox);
    gl.uniform3fv(u("uStrip"), l.strip);
    gl.uniform1f(u("uAmbient"), l.ambient);
    gl.uniform1f(u("uExposure"), l.exposure);
    gl.uniform3fv(u("uCaseAlbedo"), l.caseAlbedo);
    gl.uniform3fv(u("uCaseF0"), l.caseF0);
    gl.uniform1f(u("uCaseRough"), l.caseRough);
    gl.uniform1f(u("uCaseMetal"), l.caseMetal);
    gl.uniform3fv(u("uEdgeF0"), l.edgeF0);
    gl.uniform3fv(u("uPlateAlbedo"), l.plateAlbedo);
    gl.uniform3fv(u("uCapAlbedo"), frame.caps.albedo);
    gl.uniform3fv(u("uLegend"), frame.caps.legend);
    gl.uniform3fv(u("uEngrave"), l.engrave);
    gl.uniform3fv(u("uKnobF0"), l.knobF0);
    gl.uniform2f(u("uShadow"), l.shadow[0], l.shadow[1]);
    gl.uniform1f(u("uDetail"), frame.detail);
    gl.uniform1i(u("uAtlas"), 0);
  }

  private drawMesh(mesh: GpuMesh) {
    const gl = this.gl;
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
  }

  private translate(x: number, y: number, z: number) {
    const m = this.model;
    m.set(IDENTITY);
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m;
  }

  private knobModel(angle: number) {
    // rotate about +Y by -angle (clockwise seen from above), then place
    const m = this.model;
    const c = Math.cos(-angle);
    const s = Math.sin(-angle);
    m.set(IDENTITY);
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    m[12] = KNOB.x;
    m[13] = KNOB_BASE_Y;
    m[14] = KNOB.z;
    return m;
  }

  /** The pad itself (no ground), with whichever program is bound. */
  private drawPad(u: (name: string) => WebGLUniformLocation | null, frame: Frame) {
    const gl = this.gl;
    gl.uniformMatrix4fv(u("uModel"), false, this.translate(0, 0, 0));
    gl.uniform1i(u("uKey"), -1);
    gl.uniform1f(u("uTravel"), 0);
    this.drawMesh(this.meshes.case);
    gl.uniformMatrix4fv(u("uModel"), false, this.knobModel(frame.knobAngle));
    this.drawMesh(this.meshes.knob);
    for (const key of KEYS) {
      const travel = frame.travel[key.index];
      gl.uniformMatrix4fv(u("uModel"), false, this.translate(key.x, PLATE_Y + SKIRT_REST - travel * TRAVEL, key.z));
      gl.uniform1i(u("uKey"), key.index);
      gl.uniform1f(u("uTravel"), travel);
      this.drawMesh(this.meshes.cap);
    }
  }

  draw(frame: Frame) {
    const gl = this.gl;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.disable(gl.CULL_FACE);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);

    const bloom = frame.bloom && frame.look.bloom > 0.001;
    if (bloom) {
      const t = this.ensureTargets(width, height);
      // 1. the glow alone, occluded by the pad
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.glow.fbo);
      gl.viewport(0, 0, t.glow.width, t.glow.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.useProgram(this.emissive);
      this.setShared(this.uEmissive, frame);
      this.drawPad(this.uEmissive, frame);
      gl.disable(gl.DEPTH_TEST);

      // 2. blur: near radius at 1/4, far radius at 1/8
      gl.useProgram(this.blur);
      gl.bindVertexArray(this.empty);
      gl.uniform1i(this.uBlur("uSource"), 0);
      this.blurPass(t.glow, t.a, 1, 0);
      this.blurPass(t.a, t.b, 0, 1);
      this.blurPass(t.b, t.c, 1.5, 0);
      this.blurPass(t.c, t.d, 0, 1.5);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    }

    // 3. the frame
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.main);
    this.setShared(this.uMain, frame);
    this.setLook(this.uMain, frame);

    // ground shadow: premultiplied black, no depth
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniformMatrix4fv(this.uMain("uModel"), false, this.translate(0, 0, 0));
    gl.uniform1i(this.uMain("uKey"), -1);
    this.drawMesh(this.meshes.ground);
    gl.disable(gl.BLEND);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    this.drawPad(this.uMain, frame);
    gl.disable(gl.DEPTH_TEST);

    // 4. bloom on top, as added light
    if (bloom) {
      const t = this.targets!;
      gl.useProgram(this.composite);
      gl.bindVertexArray(this.empty);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, t.b.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, t.d.tex);
      gl.uniform1i(this.uComposite("uNear"), 0);
      gl.uniform1i(this.uComposite("uFar"), 1);
      gl.uniform1f(this.uComposite("uStrength"), frame.look.bloom);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0);
    }
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    for (const mesh of Object.values(this.meshes)) {
      gl.deleteVertexArray(mesh.vao);
      gl.deleteBuffer(mesh.vbo);
      gl.deleteBuffer(mesh.ibo);
    }
    if (this.targets) Object.values(this.targets).forEach((t) => this.freeTarget(t));
    this.targets = null;
    this.targetsW = this.targetsH = 0;
    gl.deleteVertexArray(this.empty);
    gl.deleteTexture(this.atlas);
    gl.deleteProgram(this.main);
    gl.deleteProgram(this.emissive);
    gl.deleteProgram(this.blur);
    gl.deleteProgram(this.composite);
  }
}

export { MAX_RIPPLES };
