// Sound for the stage, synthesised on the lab's shared audio graph: nothing
// before a press or a key on the stage has created the context, nothing
// while the lab is muted.
//
// - water: a bed of filtered noise that only exists while the water moves.
//   Its level and brightness follow how hard the water is churning, with
//   a slow wobble, so a shake swishes and then hushes as the snow settles.
// - thunk: the walnut base set down on the table. A dull wooden knock (a
//   falling sine and a hollow mid), a soft click of the felt, and the glass
//   above it ringing faintly. Louder for a harder landing.
// - tap: a fingertip on the glass, a short high ring.
// - click: the cabin's light switched by hand.

import { audioReady, getAudio, noiseBuffer, type AudioKit } from "../../audio";

function kit(): AudioKit | null {
  if (!audioReady()) return null;
  return getAudio();
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
  gain.gain.linearRampToValueAtTime(level, at + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + decay + 0.03);
}

function noise(
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
  gain.gain.linearRampToValueAtTime(level, at + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  src.connect(filter).connect(gain).connect(out);
  src.start(at, Math.random() * 0.5, decay + 0.05);
}

/** The base landing on the table. `speed`: units / s at contact. */
export function thunk(speed: number, pan: number) {
  const audio = kit();
  if (!audio) return;
  const level = Math.min(1, Math.max(0, (speed - 0.35) / 3));
  if (level < 0.03) return;
  const { ctx, output } = audio;
  let out: AudioNode = output;
  if (typeof ctx.createStereoPanner === "function") {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-0.6, Math.min(0.6, pan));
    p.connect(output);
    out = p;
  }
  const now = ctx.currentTime;
  const j = 1 + (Math.random() - 0.5) * 0.06;
  tone(ctx, out, now, { freq: 150 * j, to: 82, level: 0.34 * level, decay: 0.16 });
  tone(ctx, out, now, { freq: 410 * j, to: 360 * j, level: 0.07 * level, decay: 0.08, type: "triangle" });
  noise(ctx, out, now, { type: "lowpass", freq: 1500, q: 0.8, level: 0.16 * level, decay: 0.035 });
  noise(ctx, out, now, { type: "bandpass", freq: 3200, q: 1.2, level: 0.025 * level, decay: 0.02 });
  // the glass and the water above it
  tone(ctx, out, now + 0.004, { freq: 2630 * j, level: 0.012 * level, decay: 0.5 });
  tone(ctx, out, now + 0.004, { freq: 4170 * j, level: 0.006 * level, decay: 0.32 });
}

/** A fingertip on the glass: a small, high, short ring over a soft knock. */
export function tap(pan: number) {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  let out: AudioNode = output;
  if (typeof ctx.createStereoPanner === "function") {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-0.6, Math.min(0.6, pan));
    p.connect(output);
    out = p;
  }
  const now = ctx.currentTime;
  const j = 1 + (Math.random() - 0.5) * 0.04;
  tone(ctx, out, now, { freq: 2480 * j, level: 0.03, decay: 0.42 });
  tone(ctx, out, now, { freq: 3910 * j, level: 0.014, decay: 0.26 });
  tone(ctx, out, now, { freq: 6020 * j, level: 0.006, decay: 0.12 });
  noise(ctx, out, now, { type: "bandpass", freq: 2200, q: 0.9, level: 0.05, decay: 0.012 });
  tone(ctx, out, now, { freq: 220, to: 160, level: 0.05, decay: 0.06 });
}

/** The cabin's light switched by hand. */
export function click(on: boolean) {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const now = ctx.currentTime;
  const pitch = on ? 1.05 : 0.95;
  noise(ctx, output, now, { type: "bandpass", freq: 3000 * pitch, q: 1.2, level: 0.09, decay: 0.02 });
  tone(ctx, output, now, { freq: 1250 * pitch, to: 1080 * pitch, level: 0.035, decay: 0.045, type: "triangle" });
  tone(ctx, output, now, { freq: 180 * pitch, to: 110, level: 0.08, decay: 0.05 });
}

/**
 * The water's swish: built on first use, kept quiet while still, stopped
 * after a quiet spell (and on dispose) so an idle stage holds no nodes.
 */
export class Water {
  private nodes: {
    src: AudioBufferSourceNode;
    band: BiquadFilterNode;
    low: BiquadFilterNode;
    gain: GainNode;
    ctx: AudioContext;
  } | null = null;
  private quiet = 0;
  private wobble = 0;

  /** level 0..~1.5 (the water's activity), dt seconds since the last call. */
  update(level: number, dt: number) {
    const target = Math.min(1, level);
    if (target < 0.02) {
      if (this.nodes) {
        const { ctx, gain } = this.nodes;
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
        this.quiet += dt;
        if (this.quiet > 1.2) this.stop();
      }
      return;
    }
    this.quiet = 0;
    if (!this.nodes) {
      const audio = kit();
      if (!audio) return;
      const { ctx, output } = audio;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 2);
      src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 600;
      band.Q.value = 0.9;
      const low = ctx.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 1800;
      low.Q.value = 0.4;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(band).connect(low).connect(gain).connect(output);
      src.start();
      this.nodes = { src, band, low, gain, ctx };
    }
    const { ctx, band, low, gain } = this.nodes;
    this.wobble += dt * (2.2 + target * 3);
    const now = ctx.currentTime;
    const sway = 0.75 + 0.25 * Math.sin(this.wobble) * Math.sin(this.wobble * 0.37 + 1);
    gain.gain.setTargetAtTime(0.11 * target * target * sway, now, 0.06);
    band.frequency.setTargetAtTime(380 + 900 * target * sway, now, 0.08);
    low.frequency.setTargetAtTime(1200 + 1600 * target, now, 0.1);
  }

  stop() {
    const n = this.nodes;
    if (!n) return;
    this.nodes = null;
    try {
      n.gain.gain.cancelScheduledValues(n.ctx.currentTime);
      n.gain.gain.setTargetAtTime(0, n.ctx.currentTime, 0.03);
      n.src.stop(n.ctx.currentTime + 0.15);
    } catch {}
    window.setTimeout(() => {
      try {
        n.src.disconnect();
        n.gain.disconnect();
      } catch {}
    }, 300);
  }
}
