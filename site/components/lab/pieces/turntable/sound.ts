// What you hear: the loop under the stylus, scratchable. Everything goes
// through the lab's shared AudioContext and master gain (so the lab mute
// applies) and starts only after a gesture has created that context.
//
//   stems (fwd or rev) → stem gains (the band's mix) → voice gain ─┐
//   crackle (surface noise) ───────────────────────────────────────┼→ needle gate → warmth → output
//
// A voice is one set of three looping sources reading the same position.
// The record's angular speed sets their playbackRate (1 at 33⅓, 1.35 at
// 45, whatever the hand does while scratching). Web Audio can't play a
// buffer backwards, so when the record turns the other way the forward
// voice fades out over a few milliseconds and a voice on the reversed
// buffers starts at the mirrored position. The needle gate closes while
// the stylus is up and as the record comes to a standstill, so a held
// record is silent the way a real one is.

import { audioReady, getAudio, noiseBuffer, type AudioKit } from "../../audio";
import type { LoopSet } from "./loop";

type Voice = {
  dir: 1 | -1;
  sources: AudioBufferSourceNode[];
  stems: GainNode[];
  gain: GainNode;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export type DeckSound = {
  /** Loop playback rate (negative is backwards). */
  rate: number;
  /** Loop position in seconds (any real number; wrapped here). */
  position: number;
  /** Stylus in the groove. */
  down: boolean;
  /** Stem levels for the band under the stylus (all 0 in a gap / run-out). */
  stems: readonly [number, number, number];
};

export class DeckAudio {
  private kit: AudioKit;
  private loop: LoopSet;
  private gate: GainNode;
  private warmth: BiquadFilterNode;
  private voice: Voice | null = null;
  private crackle: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode;
  private stemLevels: [number, number, number] = [0, 0, 0];
  private running = false;
  private disposed = false;

  constructor(kit: AudioKit, loop: LoopSet) {
    this.kit = kit;
    this.loop = loop;
    const { ctx, output } = kit;
    this.warmth = ctx.createBiquadFilter();
    this.warmth.type = "lowpass";
    this.warmth.frequency.value = 12500;
    this.warmth.Q.value = 0.4;
    this.gate = ctx.createGain();
    this.gate.gain.value = 0;
    this.gate.connect(this.warmth).connect(output);
    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.value = 0;
    this.crackleGain.connect(this.gate);
  }

  /** Called every frame with the deck's state. */
  update(state: DeckSound) {
    if (this.disposed) return;
    const { ctx } = this.kit;
    const now = ctx.currentTime;
    const speed = Math.abs(state.rate);
    const audible = state.down && this.running;

    // the gate: needle in the groove, and the record actually moving
    const motion = smooth(0.004, 0.07, speed);
    const target = audible ? motion : 0;
    this.gate.gain.setTargetAtTime(target, now, state.down ? 0.006 : 0.012);

    // stem mix (band changes cross-fade)
    for (let i = 0; i < 3; i++) {
      if (Math.abs(this.stemLevels[i] - state.stems[i]) > 1e-3) {
        this.stemLevels[i] = state.stems[i];
        if (this.voice) this.voice.stems[i].gain.setTargetAtTime(state.stems[i], now, 0.03);
      }
    }

    if (!audible) {
      if (this.voice) this.stopVoice(this.voice, 0.03);
      this.voice = null;
      this.crackleGain.gain.setTargetAtTime(0, now, 0.02);
      return;
    }

    // which way: keep the current direction near standstill (hysteresis)
    const want: 1 | -1 = state.rate >= 0 ? 1 : -1;
    if (!this.voice || (this.voice.dir !== want && speed > 0.025)) {
      if (this.voice) this.stopVoice(this.voice, 0.005);
      this.voice = this.startVoice(want, state.position, speed);
    }
    const rate = Math.max(1e-4, Math.min(6, speed));
    for (const source of this.voice.sources) source.playbackRate.setTargetAtTime(rate, now, 0.008);

    // surface noise follows the groove speed
    this.ensureCrackle();
    if (this.crackle) this.crackle.playbackRate.setTargetAtTime(Math.max(1e-4, Math.min(4, speed)), now, 0.01);
    this.crackleGain.gain.setTargetAtTime(0.55 + 0.45 * smooth(0, 1.2, speed), now, 0.03);
  }

  /** Start or stop the whole thing (the piece going off screen, unmount). */
  setRunning(on: boolean) {
    if (this.running === on || this.disposed) return;
    this.running = on;
    if (!on) {
      const { ctx } = this.kit;
      this.gate.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      if (this.voice) this.stopVoice(this.voice, 0.04);
      this.voice = null;
      this.stopCrackle();
    }
  }

  private startVoice(dir: 1 | -1, position: number, speed: number): Voice {
    const { ctx } = this.kit;
    const t = ctx.currentTime;
    const L = this.loop.duration;
    const p = mod(position, L);
    const offset = dir > 0 ? p : mod(L - p, L);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.005);
    gain.connect(this.gate);
    const stems: GainNode[] = [];
    const sources = this.loop.stems.map((stem, i) => {
      const g = ctx.createGain();
      g.gain.value = this.stemLevels[i];
      g.connect(gain);
      stems.push(g);
      const source = ctx.createBufferSource();
      source.buffer = dir > 0 ? stem.fwd : stem.rev;
      source.loop = true;
      source.playbackRate.value = Math.max(1e-4, Math.min(6, speed));
      source.connect(g);
      source.start(t, offset);
      return source;
    });
    return { dir, sources, stems, gain };
  }

  private stopVoice(voice: Voice, fade: number) {
    const { ctx } = this.kit;
    const t = ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, t);
    voice.gain.gain.linearRampToValueAtTime(0, t + fade);
    for (const source of voice.sources) {
      try {
        source.stop(t + fade + 0.01);
      } catch {}
    }
    window.setTimeout(() => voice.gain.disconnect(), (fade + 0.1) * 1000);
  }

  private ensureCrackle() {
    if (this.crackle) return;
    const { ctx } = this.kit;
    const source = ctx.createBufferSource();
    source.buffer = this.loop.crackle;
    source.loop = true;
    source.connect(this.crackleGain);
    source.start(ctx.currentTime, Math.random() * this.loop.crackle.duration);
    this.crackle = source;
  }

  private stopCrackle() {
    if (!this.crackle) return;
    try {
      this.crackle.stop(this.kit.ctx.currentTime + 0.05);
    } catch {}
    this.crackle = null;
  }

  dispose() {
    if (this.disposed) return;
    this.setRunning(false);
    this.disposed = true;
    window.setTimeout(() => {
      this.gate.disconnect();
      this.crackleGain.disconnect();
      this.warmth.disconnect();
    }, 200);
  }
}

/* ---------------------------------------------------------------------- */
/* one-shots                                                               */
/* ---------------------------------------------------------------------- */

function out(pan = 0): { ctx: AudioContext; node: AudioNode } | null {
  const kit = getAudio();
  if (!kit || !audioReady()) return null;
  const { ctx, output } = kit;
  if (pan && typeof ctx.createStereoPanner === "function") {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    panner.connect(output);
    return { ctx, node: panner };
  }
  return { ctx, node: output };
}

function burst(ctx: AudioContext, node: AudioNode, t: number, opts: { type: BiquadFilterType; freq: number; q?: number; gain: number; decay: number }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type;
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q ?? 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain, t + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  src.connect(filter).connect(g).connect(node);
  src.start(t, Math.random() * 0.8, opts.decay + 0.05);
}

function thud(ctx: AudioContext, node: AudioNode, t: number, freq: number, gain: number, decay: number) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.6, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.02);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  osc.connect(g).connect(node);
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

/** The stylus landing in the groove: a soft low bump and a brush of noise. */
export function needleDrop(strength: number, spinning: boolean) {
  const o = out(0.25);
  if (!o) return;
  const { ctx, node } = o;
  const t = ctx.currentTime + 0.002;
  const s = Math.min(1, Math.max(0.35, strength));
  thud(ctx, node, t, 48, 0.32 * s, 0.16);
  burst(ctx, node, t, { type: "bandpass", freq: 1300, q: 0.6, gain: 0.05 * s, decay: 0.05 });
  if (spinning) burst(ctx, node, t + 0.01, { type: "highpass", freq: 2500, gain: 0.025, decay: 0.12 });
}

/** The stylus leaving the groove. */
export function needleLift() {
  const o = out(0.25);
  if (!o) return;
  const { ctx, node } = o;
  const t = ctx.currentTime + 0.002;
  thud(ctx, node, t, 70, 0.08, 0.06);
  burst(ctx, node, t, { type: "bandpass", freq: 2200, gain: 0.025, decay: 0.03 });
}

/** The locked groove at the end of the side: a click once a turn. */
export function lockClick() {
  const o = out(0.2);
  if (!o) return;
  const { ctx, node } = o;
  const t = ctx.currentTime + 0.002;
  thud(ctx, node, t, 58, 0.12, 0.08);
  burst(ctx, node, t, { type: "bandpass", freq: 1800, q: 1.2, gain: 0.06, decay: 0.02 });
}

/** A deck button or the cue lever. */
export function buttonClick(kind: "start" | "speed" | "cue" | "rest", pan = 0) {
  const o = out(pan);
  if (!o) return;
  const { ctx, node } = o;
  const t = ctx.currentTime + 0.002;
  if (kind === "start") {
    burst(ctx, node, t, { type: "bandpass", freq: 2600, q: 1.4, gain: 0.12, decay: 0.018 });
    thud(ctx, node, t, 120, 0.14, 0.05);
    burst(ctx, node, t + 0.055, { type: "bandpass", freq: 3100, q: 1.6, gain: 0.05, decay: 0.012 });
  } else if (kind === "speed") {
    burst(ctx, node, t, { type: "bandpass", freq: 3400, q: 1.8, gain: 0.08, decay: 0.012 });
    thud(ctx, node, t, 180, 0.05, 0.03);
  } else if (kind === "cue") {
    burst(ctx, node, t, { type: "bandpass", freq: 1900, q: 1.1, gain: 0.07, decay: 0.022 });
    thud(ctx, node, t, 140, 0.05, 0.04);
  } else {
    thud(ctx, node, t, 95, 0.1, 0.06);
    burst(ctx, node, t, { type: "bandpass", freq: 1500, q: 0.9, gain: 0.04, decay: 0.03 });
  }
}
