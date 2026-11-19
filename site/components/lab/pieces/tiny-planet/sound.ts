// Sounds for the tiny planet, made on the spot on the lab's shared audio
// graph (components/lab/audio.ts). Nothing plays until a gesture on the
// stage has created the context, and the lab-wide mute silences all of it.
//
// - Whirr: the air around a spinning globe. One looping noise voice through
//   a band-pass whose level and pitch follow the spin, silent at the idle
//   day, rising to a soft rush when flicked hard.
// - Tick: a small wooden tick each time a day goes by (the counter in the
//   tray), rate limited and softer the faster it spins, so a hard flick is
//   a light patter rather than a burst.
// - Catch: grabbing a planet that is still spinning, a low soft thump that
//   grows with the speed it was caught at.
// - Tink: the moon nudged along, a small glassy note.

import { audioReady, getAudio, noiseBuffer } from "../../audio";

let lastTick = 0;

export class Whirr {
  private gain: GainNode | null = null;
  private band: BiquadFilterNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private level = 0;
  private pitch = 0;

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
    band.frequency.value = 260;
    band.Q.value = 1.4;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(band).connect(low).connect(gain).connect(output);
    source.start();
    this.source = source;
    this.band = band;
    this.gain = gain;
  }

  /** `speed`: how fast the planet turns (rad/s, any axis). */
  set(speed: number) {
    const gain = this.gain;
    const band = this.band;
    if (!gain || !band || !Number.isFinite(speed)) return;
    const k = Math.min(1, Math.max(0, (speed - 1.2) / 14));
    const target = k * k * (3 - 2 * k) * 0.075;
    const pitch = 210 + speed * 46;
    const now = gain.context.currentTime;
    if (Math.abs(target - this.level) > 0.001) {
      this.level = target;
      gain.gain.setTargetAtTime(target, now, 0.06);
    }
    if (Math.abs(pitch - this.pitch) > 6) {
      this.pitch = pitch;
      band.frequency.setTargetAtTime(pitch, now, 0.08);
    }
  }

  stop() {
    const { gain, source } = this;
    this.gain = null;
    this.band = null;
    this.source = null;
    this.level = 0;
    this.pitch = 0;
    if (!gain || !source) return;
    const now = gain.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0, now, 0.04);
    try {
      source.stop(now + 0.25);
    } catch {}
    window.setTimeout(() => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
    }, 400);
  }
}

function panner(ctx: AudioContext, pan: number): StereoPannerNode | null {
  if (typeof ctx.createStereoPanner !== "function") return null;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-0.8, Math.min(0.8, pan));
  return p;
}

/** A day went by. `speed` in rad/s. */
export function tick(speed: number) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const nowMs = performance.now();
  if (nowMs - lastTick < 70) return;
  lastTick = nowMs;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const hurry = Math.min(1, Math.max(0, (speed - 2) / 16));
  const level = 0.085 * (1 - 0.6 * hurry);

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2400 + Math.random() * 300;
  band.Q.value = 2.4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  noise.connect(band).connect(g).connect(output);
  noise.start(now, Math.random() * 0.5, 0.05);

  const knock = ctx.createOscillator();
  knock.type = "sine";
  knock.frequency.setValueAtTime(880, now);
  knock.frequency.exponentialRampToValueAtTime(480, now + 0.03);
  const kg = ctx.createGain();
  kg.gain.setValueAtTime(0, now);
  kg.gain.linearRampToValueAtTime(level * 0.55, now + 0.002);
  kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  knock.connect(kg).connect(output);
  knock.start(now);
  knock.stop(now + 0.08);
}

/** Grabbing a moving planet: a soft thump scaled by how fast it was turning (rad/s). */
export function caught(speed: number, pan = 0) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const k = Math.min(1, Math.max(0, (speed - 0.8) / 10));
  if (k <= 0) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const out = panner(ctx, pan);
  const dest: AudioNode = out ? (out.connect(output), out) : output;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(62, now + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.16 * k, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(g).connect(dest);
  osc.start(now);
  osc.stop(now + 0.25);

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 700;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, now);
  ng.gain.linearRampToValueAtTime(0.05 * k, now + 0.004);
  ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  noise.connect(low).connect(ng).connect(dest);
  noise.start(now, Math.random() * 0.5, 0.12);
}

/** The moon nudged: a small glassy note, a little higher the faster it goes. */
export function tink(speed: number, pan = 0) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const out = panner(ctx, pan);
  const dest: AudioNode = out ? (out.connect(output), out) : output;
  const base = 1320 * Math.pow(2, Math.min(1, Math.abs(speed) / 8) * 0.5);
  for (const [ratio, level, decay] of [
    [1, 0.05, 0.5],
    [2.76, 0.016, 0.22],
    [5.4, 0.006, 0.1],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = base * ratio;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(level, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(g).connect(dest);
    osc.start(now);
    osc.stop(now + decay + 0.05);
  }
}
