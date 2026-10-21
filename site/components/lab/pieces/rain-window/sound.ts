// Sound for the stage, made in the browser on the lab's shared audio
// graph: nothing until a press or a key on the window has created the
// context, nothing while the lab is muted.
//
// - Rain: what rain on a window sounds like from inside, a soft muffled
//   hiss, a low hush of the heavier rain on the roof, and a patter of
//   single drops ticking on the glass, spread left to right (rendered once
//   into a four-second stereo loop, so it costs nothing per drop). Its level
//   follows the rain control; it rolls in over a couple of seconds.
// - Wipe: a fingertip on wet glass: a soft rub that follows the speed of
//   the stroke, a little brighter where the glass is wet with fog.
// - Knock: a knuckle on a window pane: a dull knock and a short glassy ring.
// - Thunder: a crack for a near strike, then a long low rumble that rolls
//   and fades, the pane buzzing faintly at its loudest. It arrives after
//   the flash, later for a far strike.

import { audioReady, getAudio, noiseBuffer, type AudioKit } from "../../audio";

function kit(): AudioKit | null {
  if (!audioReady()) return null;
  return getAudio();
}

const patterCache = new WeakMap<AudioContext, AudioBuffer>();

/** Four seconds of drops ticking on glass, stereo. */
function patterBuffer(ctx: AudioContext): AudioBuffer {
  const cached = patterCache.get(ctx);
  if (cached) return cached;
  const seconds = 4;
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  let seed = 0x1f2e3d4c;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  // about 46 drops a second, most faint, a few close and bright
  let t = 0;
  while (true) {
    t += -Math.log(1 - rnd() * 0.999) / 46;
    const start = Math.floor(t * rate);
    if (start >= length) break;
    const big = rnd();
    const amp = 0.05 + 0.5 * big * big * big;
    const tau = (0.002 + 0.006 * rnd()) * rate;
    const pan = rnd();
    const gl = Math.cos(pan * Math.PI * 0.5);
    const gr = Math.sin(pan * Math.PI * 0.5);
    // a tick: noise through a one-pole high-pass, with a short ring
    const ring = 2 * Math.PI * (1800 + 2600 * rnd());
    let prev = 0;
    let hp = 0;
    const n = Math.min(length - start, Math.floor(tau * 6));
    for (let i = 0; i < n; i++) {
      const env = Math.exp(-i / tau);
      const white = rnd() * 2 - 1;
      hp = 0.82 * (hp + white - prev);
      prev = white;
      const s = amp * env * (hp * 0.7 + 0.35 * Math.sin((ring * i) / rate));
      const k = (start + i) % length;
      left[k] += s * gl;
      right[k] += s * gr;
    }
  }
  patterCache.set(ctx, buffer);
  return buffer;
}

function noiseLoop(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2);
  src.loop = true;
  return src;
}

/** Rain level: 0 drizzle, 1 rain, 2 storm. */
const LEVELS = [
  { hiss: 0.05, hush: 0.05, patter: 0.32 },
  { hiss: 0.09, hush: 0.09, patter: 0.5 },
  { hiss: 0.15, hush: 0.16, patter: 0.62 },
] as const;

export class RainSound {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private hiss: GainNode | null = null;
  private hush: GainNode | null = null;
  private patter: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  // the fingertip
  private rub: GainNode | null = null;
  private rubFilter: BiquadFilterNode | null = null;
  private squeak: GainNode | null = null;
  private squeakFilter: BiquadFilterNode | null = null;
  playing = false;

  start(audio: AudioKit, level: number) {
    if (this.playing) return;
    const { ctx, output } = audio;
    this.ctx = ctx;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(1, now + 2.4);
    out.connect(output);
    this.out = out;

    // the hiss, muffled by the glass
    const n1 = noiseLoop(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 380;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2600;
    lp.Q.value = 0.3;
    this.hiss = ctx.createGain();
    n1.connect(hp).connect(lp).connect(this.hiss).connect(out);
    // the hush on the roof
    const n2 = noiseLoop(ctx);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 260;
    this.hush = ctx.createGain();
    n2.connect(low).connect(this.hush).connect(out);
    n2.playbackRate.value = 0.83;
    // the patter
    const p = ctx.createBufferSource();
    p.buffer = patterBuffer(ctx);
    p.loop = true;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 5200;
    this.patter = ctx.createGain();
    p.connect(tone).connect(this.patter).connect(out);

    // the rub, silent until a stroke
    const n3 = noiseLoop(ctx);
    n3.playbackRate.value = 1.13;
    this.rubFilter = ctx.createBiquadFilter();
    this.rubFilter.type = "bandpass";
    this.rubFilter.frequency.value = 700;
    this.rubFilter.Q.value = 0.9;
    this.rub = ctx.createGain();
    this.rub.gain.value = 0;
    n3.connect(this.rubFilter).connect(this.rub).connect(out);
    this.squeakFilter = ctx.createBiquadFilter();
    this.squeakFilter.type = "bandpass";
    this.squeakFilter.frequency.value = 2300;
    this.squeakFilter.Q.value = 7;
    this.squeak = ctx.createGain();
    this.squeak.gain.value = 0;
    n3.connect(this.squeakFilter).connect(this.squeak).connect(out);

    const offset = Math.random();
    n1.start(now, offset);
    n2.start(now, offset * 1.7);
    p.start(now, Math.random() * 3.5);
    n3.start(now, offset * 0.5);
    this.sources = [n1, n2, p, n3];
    this.playing = true;
    this.setLevel(level, true);
  }

  setLevel(level: number, immediate = false) {
    const ctx = this.ctx;
    if (!ctx || !this.hiss || !this.hush || !this.patter) return;
    const l = LEVELS[Math.max(0, Math.min(2, level))];
    const now = ctx.currentTime;
    const tc = immediate ? 0.01 : 0.6;
    this.hiss.gain.setTargetAtTime(l.hiss, now, tc);
    this.hush.gain.setTargetAtTime(l.hush, now, tc);
    this.patter.gain.setTargetAtTime(l.patter, now, tc);
  }

  /** The fingertip: speed in px/s (0 when lifted), wet 0 … 1. */
  setRub(speed: number, wet: number) {
    const ctx = this.ctx;
    if (!ctx || !this.rub || !this.rubFilter || !this.squeak || !this.squeakFilter) return;
    const now = ctx.currentTime;
    const s = Math.min(1, speed / 1400);
    const level = s > 0.01 ? 0.05 + 0.32 * Math.sqrt(s) * (0.55 + 0.45 * wet) : 0;
    this.rub.gain.setTargetAtTime(level, now, 0.03);
    this.rubFilter.frequency.setTargetAtTime(520 + 900 * s, now, 0.05);
    // glass squeaks only under a quick finger where it is already wet-clean
    const sq = s > 0.35 ? (s - 0.35) * 0.05 * (1 - wet * 0.7) : 0;
    this.squeak.gain.setTargetAtTime(sq, now, 0.04);
    this.squeakFilter.frequency.setTargetAtTime(1900 + 900 * s, now, 0.08);
  }

  stop() {
    if (!this.playing || !this.ctx || !this.out) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this.out;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(0, now + 0.5);
    for (const s of this.sources) {
      try {
        s.stop(now + 0.55);
      } catch {}
    }
    window.setTimeout(() => out.disconnect(), 700);
    this.sources = [];
    this.out = null;
    this.hiss = this.hush = this.patter = this.rub = this.squeak = null;
    this.rubFilter = this.squeakFilter = null;
    this.playing = false;
  }
}

function panner(ctx: AudioContext, output: AudioNode, pan: number): AudioNode {
  if (typeof ctx.createStereoPanner !== "function") return output;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-0.8, Math.min(0.8, pan));
  p.connect(output);
  return p;
}

/** A knuckle on the pane. `pan` −1 … 1. */
export function knock(strength: number, pan: number) {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const out = panner(ctx, output, pan);
  const now = ctx.currentTime;
  const level = Math.max(0.3, Math.min(1, strength));
  const j = 1 + (Math.random() - 0.5) * 0.08;
  // the knock: a falling low tone
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(170 * j, now);
  osc.frequency.exponentialRampToValueAtTime(92 * j, now + 0.11);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.4 * level, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(g).connect(out);
  osc.start(now);
  osc.stop(now + 0.2);
  // the knuckle's click on the glass
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1500 * j;
  bp.Q.value = 1.3;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, now);
  ng.gain.linearRampToValueAtTime(0.24 * level, now + 0.002);
  ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  src.connect(bp).connect(ng).connect(out);
  src.start(now, Math.random() * 0.5, 0.08);
  // and the pane rings, briefly
  for (const [f, a, d] of [
    [2870, 0.022, 0.22],
    [4310, 0.012, 0.14],
  ] as const) {
    const r = ctx.createOscillator();
    r.frequency.value = f * j;
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0, now);
    rg.gain.linearRampToValueAtTime(a * level, now + 0.004);
    rg.gain.exponentialRampToValueAtTime(0.0001, now + d);
    r.connect(rg).connect(out);
    r.start(now);
    r.stop(now + d + 0.05);
  }
}

/**
 * Thunder `delay` seconds from now. `close` 0 (far) … 1 (overhead): louder,
 * with a crack, and sooner.
 */
export function thunder(close: number, delay: number, pan: number) {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const at = ctx.currentTime + Math.max(0, delay);
  const out = panner(ctx, output, pan * 0.6);
  const length = 6 + 3 * (1 - close);
  // the crack
  if (close > 0.35) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 1);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.22 * close, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    src.connect(hp).connect(g).connect(out);
    src.start(at, Math.random() * 0.4, 0.5);
  }
  // the rumble: low noise, rolling
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2);
  src.loop = true;
  src.playbackRate.value = 0.5;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(1100 * (0.4 + close * 0.6), at);
  lp.frequency.exponentialRampToValueAtTime(120, at + length * 0.6);
  const lp2 = ctx.createBiquadFilter();
  lp2.type = "lowpass";
  lp2.frequency.value = 900;
  const g = ctx.createGain();
  const peak = 0.55 * (0.45 + 0.55 * close);
  // a rolling envelope: a swell, a dip, a second swell, a long tail
  const steps = 48;
  const curve = new Float32Array(steps);
  let swell = 0;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    swell += (Math.random() - 0.5) * 0.35;
    swell *= 0.85;
    const attack = Math.min(1, t / (close > 0.5 ? 0.03 : 0.1));
    const body = Math.exp(-t * 3.2) * (1 + 0.6 * Math.sin(t * 14 + 1.3) * Math.exp(-t * 2)) + swell * 0.25 * Math.exp(-t * 2);
    curve[i] = Math.max(0, peak * attack * body);
  }
  curve[steps - 1] = 0;
  g.gain.setValueAtTime(0, at);
  g.gain.setValueCurveAtTime(curve, at + 0.001, length);
  src.connect(lp).connect(lp2).connect(g).connect(out);
  src.start(at, Math.random() * 1.5);
  src.stop(at + length + 0.2);
  // the pane buzzing at the loudest
  const buzz = ctx.createBufferSource();
  buzz.buffer = noiseBuffer(ctx, 1);
  buzz.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 180;
  bp.Q.value = 3;
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0, at);
  bg.gain.linearRampToValueAtTime(0.05 * close, at + 0.25);
  bg.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
  const am = ctx.createOscillator();
  am.frequency.value = 23;
  const amg = ctx.createGain();
  amg.gain.value = 0.5;
  am.connect(amg).connect(bg.gain);
  buzz.connect(bp).connect(bg).connect(out);
  buzz.start(at);
  buzz.stop(at + 1.7);
  am.start(at);
  am.stop(at + 1.7);
}

/** A long, soft breath on the glass. */
export function exhale() {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1100, now);
  bp.frequency.exponentialRampToValueAtTime(650, now + 1.1);
  bp.Q.value = 0.7;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2400;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.12, now + 0.22);
  g.gain.setTargetAtTime(0, now + 0.45, 0.28);
  src.connect(bp).connect(lp).connect(g).connect(output);
  src.start(now, Math.random() * 0.5, 1.8);
}
