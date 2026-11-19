// The bubbles' sounds, synthesised: a pop (a click of high noise and a tiny
// falling blip, lower for bigger bubbles) and the breath while one is blown.

import { noiseBuffer, type AudioKit } from "../../audio";

export function pop(kit: AudioKit, radius: number) {
  const { ctx, output } = kit;
  const t = ctx.currentTime + 0.003;
  const size = Math.min(1, Math.max(0, (radius - 8) / 80));
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 1);
  const hp = ctx.createBiquadFilter();
  hp.type = "bandpass";
  hp.frequency.value = 3800 - size * 1800;
  hp.Q.value = 0.9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + size * 0.03);
  src.connect(hp).connect(g).connect(output);
  src.start(t, Math.random() * 0.8, 0.09);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  const f = 1900 - size * 1000;
  osc.frequency.setValueAtTime(f, t);
  osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.05);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.06, t + 0.003);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.connect(og).connect(output);
  osc.start(t);
  osc.stop(t + 0.08);
}

export class Breath {
  private nodes: { src: AudioBufferSourceNode; band: BiquadFilterNode; gain: GainNode } | null = null;

  start(kit: AudioKit) {
    if (this.nodes) return;
    const { ctx, output } = kit;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 2);
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(band).connect(gain).connect(output);
    src.start();
    this.nodes = { src, band, gain };
  }

  /** Blowing (0…1: how hard). */
  set(kit: AudioKit | null, amount: number) {
    if (!this.nodes || !kit) return;
    const t = kit.ctx.currentTime;
    const a = Math.min(1, Math.max(0, amount));
    this.nodes.gain.gain.setTargetAtTime(a * 0.05, t, a > 0 ? 0.08 : 0.15);
    this.nodes.band.frequency.setTargetAtTime(700 + a * 700, t, 0.1);
  }

  stop() {
    if (!this.nodes) return;
    try {
      this.nodes.src.stop();
    } catch {}
    this.nodes.gain.disconnect();
    this.nodes = null;
  }
}
