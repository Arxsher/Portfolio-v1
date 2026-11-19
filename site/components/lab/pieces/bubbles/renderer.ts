// Draws the bubbles: the backdrop, the bubbles (one instanced quad each,
// premultiplied alpha), then the droplets.

import { createProgram, FULLSCREEN_VERTEX, uniformLocations } from "../../gl";
import { BACKDROP, BUBBLE, BUBBLE_VERTEX, DROP, DROP_VERTEX } from "./shaders";
import { MAX_BUBBLES, type Froth } from "./sim";

const MAX_DROPS = 256;

export class BubbleRenderer {
  private gl: WebGL2RenderingContext;
  private back: WebGLProgram;
  private bubble: WebGLProgram;
  private drop: WebGLProgram;
  private ub: (name: string) => WebGLUniformLocation | null;
  private uu: (name: string) => WebGLUniformLocation | null;
  private ud: (name: string) => WebGLUniformLocation | null;
  private empty: WebGLVertexArrayObject | null;
  private bubbleVao: WebGLVertexArrayObject | null;
  private dropVao: WebGLVertexArrayObject | null;
  private quad: WebGLBuffer | null;
  private bubbleBuf: WebGLBuffer | null;
  private dropBuf: WebGLBuffer | null;
  private bubbleData = new Float32Array(MAX_BUBBLES * 12);
  private dropData = new Float32Array(MAX_DROPS * 4);

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.back = createProgram(gl, FULLSCREEN_VERTEX, BACKDROP);
    this.bubble = createProgram(gl, BUBBLE_VERTEX, BUBBLE);
    this.drop = createProgram(gl, DROP_VERTEX, DROP);
    this.ub = uniformLocations(gl, this.back);
    this.uu = uniformLocations(gl, this.bubble);
    this.ud = uniformLocations(gl, this.drop);
    this.empty = gl.createVertexArray();

    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // bubbles: corner + three vec4s per instance
    this.bubbleVao = gl.createVertexArray();
    gl.bindVertexArray(this.bubbleVao);
    this.corner(this.bubble);
    this.bubbleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bubbleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.bubbleData.byteLength, gl.DYNAMIC_DRAW);
    ["iA", "iB", "iC"].forEach((name, i) => {
      const loc = gl.getAttribLocation(this.bubble, name);
      if (loc < 0) return;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 48, i * 16);
      gl.vertexAttribDivisor(loc, 1);
    });

    // droplets: corner + one vec4 per instance
    this.dropVao = gl.createVertexArray();
    gl.bindVertexArray(this.dropVao);
    this.corner(this.drop);
    this.dropBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dropBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.dropData.byteLength, gl.DYNAMIC_DRAW);
    const loc = gl.getAttribLocation(this.drop, "iD");
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 16, 0);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindVertexArray(null);
  }

  private corner(program: WebGLProgram) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(program, "aCorner");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  draw(froth: Froth, night: number, time: number) {
    const gl = this.gl;
    const cw = gl.drawingBufferWidth;
    const ch = gl.drawingBufferHeight;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    gl.disable(gl.BLEND);

    gl.useProgram(this.back);
    gl.uniform1f(this.ub("uNight"), night);
    gl.uniform2f(this.ub("uRes"), cw, ch);
    gl.bindVertexArray(this.empty);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // bubbles, smallest last so they sit in front
    const list = froth.bubbles;
    const count = Math.min(list.length, MAX_BUBBLES);
    const data = this.bubbleData;
    const order = list.slice(0, count).sort((a, b) => b.r - a.r);
    for (let i = 0; i < count; i++) {
      const b = order[i];
      const o = i * 12;
      data[o] = b.x;
      data[o + 1] = b.y;
      data[o + 2] = b.r;
      data[o + 3] = b.seed;
      data[o + 4] = b.a2;
      data[o + 5] = b.a3;
      data[o + 6] = b.p2;
      data[o + 7] = b.p3;
      data[o + 8] = Math.min(1, b.age / b.life);
      data[o + 9] = 0;
      data[o + 10] = b.pop;
      data[o + 11] = b.popAngle;
    }
    if (count > 0) {
      gl.useProgram(this.bubble);
      gl.uniform2f(this.uu("uView"), froth.w, froth.h);
      gl.uniform1f(this.uu("uTime"), time);
      gl.uniform1f(this.uu("uNight"), night);
      gl.bindVertexArray(this.bubbleVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bubbleBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * 12);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    }

    const drops = froth.drops;
    const dc = Math.min(drops.length, MAX_DROPS);
    if (dc > 0) {
      const dd = this.dropData;
      for (let i = 0; i < dc; i++) {
        const d = drops[i];
        dd[i * 4] = d.x;
        dd[i * 4 + 1] = d.y;
        dd[i * 4 + 2] = d.size;
        dd[i * 4 + 3] = 1 - d.age / d.life;
      }
      gl.useProgram(this.drop);
      gl.uniform2f(this.ud("uView"), froth.w, froth.h);
      gl.uniform1f(this.ud("uNight"), night);
      gl.bindVertexArray(this.dropVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dropBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, dd, 0, dc * 4);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, dc);
    }
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.back);
    gl.deleteProgram(this.bubble);
    gl.deleteProgram(this.drop);
    gl.deleteVertexArray(this.empty);
    gl.deleteVertexArray(this.bubbleVao);
    gl.deleteVertexArray(this.dropVao);
    gl.deleteBuffer(this.quad);
    gl.deleteBuffer(this.bubbleBuf);
    gl.deleteBuffer(this.dropBuf);
  }
}
