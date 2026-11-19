// Small WebGL2 helpers for the lab pieces (use with useWebGL2 in hooks.ts).
//
//   onContext: (gl) => {
//     const program = createProgram(gl, FULLSCREEN_VERTEX, fragmentSource);
//     const u = uniformLocations(gl, program);
//     const vao = gl.createVertexArray();
//     …
//     return () => { gl.deleteProgram(program); gl.deleteVertexArray(vao); };
//   }
//   // per frame:
//   gl.useProgram(program); gl.uniform2f(u("uResolution"), w, h); drawFullscreen(gl, vao);

/**
 * A vertex shader for full-screen passes: one triangle that covers the
 * viewport, generated from gl_VertexID (no buffers). Gives the fragment
 * shader `vUv` (0..1, y up).
 */
export const FULLSCREEN_VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("lab/gl: could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`lab/gl: shader failed to compile\n${log}`);
  }
  return shader;
}

/** Compile and link a program; throws with the info log on failure. */
export function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!program) throw new Error("lab/gl: could not create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`lab/gl: program failed to link\n${log}`);
  }
  return program;
}

/** Cached uniform lookup: `const u = uniformLocations(gl, program); gl.uniform1f(u("uTime"), t)`. */
export function uniformLocations(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const cache = new Map<string, WebGLUniformLocation | null>();
  return (name: string): WebGLUniformLocation | null => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
    return cache.get(name) ?? null;
  };
}

/** Draw the FULLSCREEN_VERTEX triangle (bind any empty VAO first, or pass one). */
export function drawFullscreen(gl: WebGL2RenderingContext, vao?: WebGLVertexArrayObject | null) {
  if (vao !== undefined) gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/** "#1d9bf0" or "rgb(29 155 240)" → [r, g, b] in 0..1 (linear-ish: no gamma change). */
export function rgb(color: string): [number, number, number] {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  const parts = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [(parts[0] ?? 0) / 255, (parts[1] ?? 0) / 255, (parts[2] ?? 0) / 255];
}
