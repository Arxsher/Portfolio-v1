// Sounds for the stage, synthesised through the lab's shared audio graph:
// nothing plays before a press or a key on the stage has created the
// context, and nothing plays while the lab is muted.
//
// - click: the switch going over. A hard little transient (band-passed
//   noise) over the switch body's knock and a short metallic ring; a shade
//   higher switching on than off, louder for a quicker pull.
// - rearm: the cord running home into the switch, a softer, duller tick.
// - rasp: the braid sliding through the grommet, a breath of filtered noise
//   that follows how fast the cord moves in or out.
// - clink: the porcelain pull knocking the shade (enamel) or the bulb (glass).
// - knock: a tap on the shade, a hollow enamel tonk.
// - filament: a faint tink as a cold filament takes the current.

import { audioReady, getAudio, noiseBuffer } from "../../audio";

function kit() {
  if (!audioReady()) return null;
  return getAudio();
}

function noiseBurst(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  { type, freq, q, level, decay }: { type: BiquadFilterType; freq: number; q: number; level: number; decay: number },
) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level, at + 0.0012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  src.connect(filter).connect(gain).connect(out);
  src.start(at, Math.random() * 0.6, decay + 0.03);
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  { freq, to, level, decay, type = "sine" }: { freq: number; to?: number; level: number; decay: number; type?: OscillatorType },
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + decay);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level, at + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

/** The switch clicking over. `speed`: how fast the cord was coming out (units / s). */
export function click(on: boolean, speed: number) {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const now = ctx.currentTime;
  const level = 0.55 + 0.45 * Math.min(1, Math.max(0, speed / 260));
  const pitch = on ? 1.06 : 0.94;
  noiseBurst(ctx, output, now, { type: "bandpass", freq: 3300 * pitch, q: 1.1, level: 0.2 * level, decay: 0.022 });
  noiseBurst(ctx, output, now + 0.004, { type: "highpass", freq: 6500, q: 0.7, level: 0.07 * level, decay: 0.012 });
  tone(ctx, output, now, { freq: 1180 * pitch, to: 1040 * pitch, level: 0.06 * level, decay: 0.05, type: "triangle" });
  tone(ctx, output, now, { freq: 4870 * pitch, level: 0.012 * level, decay: 0.07 });
  tone(ctx, output, now, { freq: 165 * pitch, to: 90, level: 0.2 * level, decay: 0.07 });
}

/** The cord running back home into the switch. */
export function rearm(speed: number) {
  const audio = kit();
  if (!audio) return;
  const level = Math.min(1, Math.max(0, (speed - 20) / 300));
  if (level < 0.05) return;
  const { ctx, output } = audio;
  const now = ctx.currentTime;
  noiseBurst(ctx, output, now, { type: "bandpass", freq: 1900, q: 1.4, level: 0.08 * level, decay: 0.018 });
  tone(ctx, output, now, { freq: 620, to: 480, level: 0.04 * level, decay: 0.04, type: "triangle" });
}

/** The pull knocking the shade or the bulb. */
export function clink(speed: number, part: "shade" | "bulb") {
  const audio = kit();
  if (!audio) return;
  const level = Math.min(1, Math.max(0, (speed - 80) / 700));
  if (level < 0.03) return;
  const { ctx, output } = audio;
  const now = ctx.currentTime;
  const jitter = 1 + (Math.random() - 0.5) * 0.06;
  if (part === "bulb") {
    tone(ctx, output, now, { freq: 3950 * jitter, level: 0.05 * level, decay: 0.12 });
    tone(ctx, output, now, { freq: 6100 * jitter, level: 0.025 * level, decay: 0.07 });
  } else {
    tone(ctx, output, now, { freq: 2350 * jitter, level: 0.06 * level, decay: 0.18 });
    tone(ctx, output, now, { freq: 3720 * jitter, level: 0.03 * level, decay: 0.1 });
  }
  noiseBurst(ctx, output, now, { type: "bandpass", freq: 4200, q: 2, level: 0.05 * level, decay: 0.01 });
}

/** A tap on the shade: hollow enamel. */
export function knock(strength: number) {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const now = ctx.currentTime;
  const level = 0.5 + 0.5 * Math.min(1, strength);
  tone(ctx, output, now, { freq: 410, to: 360, level: 0.12 * level, decay: 0.32 });
  tone(ctx, output, now, { freq: 1130, level: 0.035 * level, decay: 0.2 });
  tone(ctx, output, now, { freq: 2210, level: 0.015 * level, decay: 0.12 });
  noiseBurst(ctx, output, now, { type: "lowpass", freq: 1800, q: 0.7, level: 0.08 * level, decay: 0.03 });
}

/** A faint tink as the filament takes the current. */
export function filament() {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const now = ctx.currentTime + 0.012;
  tone(ctx, output, now, { freq: 7400, level: 0.008, decay: 0.05 });
  tone(ctx, output, now, { freq: 120, to: 100, level: 0.02, decay: 0.16 });
}

/**
 * The braid rasping through the grommet: one looping noise voice whose
 * level follows the cord's speed. Create it from a gesture; set() is cheap
 * to call every frame (it only touches the graph when the level moves).
 */
export class Rasp {
  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private level = 0;

  start() {
    if (this.gain) return;
    const audio = getAudio();
    if (!audio) return;
    const { ctx, output } = audio;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 2);
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 2600;
    band.Q.value = 0.6;
    const high = ctx.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(band).connect(high).connect(gain).connect(output);
    source.start();
    this.source = source;
    this.gain = gain;
  }

  /** `speed`: the cord's speed through the grommet (units / s). */
  set(speed: number) {
    const gain = this.gain;
    if (!gain || !Number.isFinite(speed)) return;
    const target = Math.min(1, Math.max(0, (Math.abs(speed) - 15) / 420)) * 0.06;
    if (Math.abs(target - this.level) < 0.0015) return;
    this.level = target;
    gain.gain.setTargetAtTime(target, gain.context.currentTime, 0.02);
  }

  stop() {
    const { gain, source } = this;
    this.gain = null;
    this.source = null;
    this.level = 0;
    if (!gain || !source) return;
    const now = gain.context.currentTime;
    gain.gain.setTargetAtTime(0, now, 0.02);
    try {
      source.stop(now + 0.12);
    } catch {}
    window.setTimeout(() => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
    }, 200);
  }
}
