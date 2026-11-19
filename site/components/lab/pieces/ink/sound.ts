// The ink's sounds, synthesised: a watery swish (looped noise through a
// moving band-pass) that follows how fast you stir, and a "plip" for a drop
// landing (a sine falling fast in pitch, with a second, smaller bubble).

import { noiseBuffer, type AudioKit } from "../../audio";

export class Swish {
  private nodes: { src: AudioBufferSourceNode; band: BiquadFilterNode; gain: GainNode } | null = null;

  /** Start the (silent) loop; call from a gesture. */
  start(kit: AudioKit) {
    if (this.nodes) return;
    const { ctx, output } = kit;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 2);
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 600;
    band.Q.value = 1.1;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 2200;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(band).connect(low).connect(gain).connect(output);
    src.start();
    this.nodes = { src, band, gain };
  }

  /** How hard the water is being stirred, 0…1. */
  set(kit: AudioKit | null, amount: number) {
    if (!this.nodes || !kit) return;
    const t = kit.ctx.currentTime;
    const a = Math.min(1, Math.max(0, amount));
    this.nodes.gain.gain.setTargetAtTime(a * a * 0.12, t, a > 0.02 ? 0.05 : 0.18);
    this.nodes.band.frequency.setTargetAtTime(420 + 1100 * a, t, 0.08);
  }

  stop() {
    if (!this.nodes) return;
    try {
      this.nodes.src.stop();
    } catch {}
    this.nodes.src.disconnect();
    this.nodes.gain.disconnect();
    this.nodes = null;
  }
}

/** A drop landing (`size` 0…1: a bead … a big drop). */
export function plip(kit: AudioKit, size = 0.5) {
  const { ctx, output } = kit;
  const t = ctx.currentTime + 0.005;
  const bubble = (start: number, from: number, to: number, level: number, length: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + length * 0.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(output);
    osc.start(start);
    osc.stop(start + length + 0.02);
  };
  const pitch = 1 - size * 0.45;
  bubble(t, 1500 * pitch, 520 * pitch, 0.22, 0.11);
  bubble(t + 0.045, 2300 * pitch, 900 * pitch, 0.07, 0.06);
  // the splash under it
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 1);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2500;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05 + size * 0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(hp).connect(gain).connect(output);
  src.start(t, Math.random() * 0.5, 0.09);
}

/** The dish rinsed: a long low wash. */
export function rinse(kit: AudioKit) {
  const { ctx, output } = kit;
  const t = ctx.currentTime + 0.005;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(900, t);
  band.frequency.exponentialRampToValueAtTime(260, t + 1.1);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.16, t + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  src.connect(band).connect(gain).connect(output);
  src.start(t, 0, 1.4);
}
