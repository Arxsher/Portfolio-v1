// Event horizon's sounds, synthesised: a low drone (two detuned sines and a
// rumble of filtered noise) that swells while you fly round the hole, and a
// rising rush with a faint ring when a clump of gas is dropped in.

import { noiseBuffer, type AudioKit } from "../../audio";

export class Drone {
  private nodes: { oscs: OscillatorNode[]; src: AudioBufferSourceNode; gain: GainNode; low: BiquadFilterNode } | null =
    null;

  start(kit: AudioKit) {
    if (this.nodes) return;
    const { ctx, output } = kit;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 180;
    low.Q.value = 0.7;
    low.connect(gain).connect(output);
    const oscs = [41.2, 41.9, 82.4].map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? "triangle" : "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.25 : 0.6;
      osc.connect(g).connect(low);
      osc.start();
      return osc;
    });
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 2);
    src.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.35;
    src.connect(ng).connect(low);
    src.start();
    this.nodes = { oscs, src, gain, low };
  }

  /** Swell (0…1) with how fast the view is moving; below 0 it fades out. */
  set(kit: AudioKit | null, amount: number) {
    if (!this.nodes || !kit) return;
    const t = kit.ctx.currentTime;
    const a = Math.min(1, Math.max(0, amount));
    this.nodes.gain.gain.setTargetAtTime(amount < 0 ? 0 : 0.05 + a * 0.12, t, amount < 0 ? 1.2 : 0.25);
    this.nodes.low.frequency.setTargetAtTime(150 + a * 260, t, 0.3);
  }

  stop() {
    if (!this.nodes) return;
    for (const osc of this.nodes.oscs) {
      try {
        osc.stop();
      } catch {}
    }
    try {
      this.nodes.src.stop();
    } catch {}
    this.nodes.gain.disconnect();
    this.nodes = null;
  }
}

export function rush(kit: AudioKit) {
  const { ctx, output } = kit;
  const t = ctx.currentTime + 0.01;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.4;
  band.frequency.setValueAtTime(180, t);
  band.frequency.exponentialRampToValueAtTime(1400, t + 1.2);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.14, t + 0.9);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
  src.connect(band).connect(gain).connect(output);
  src.start(t, 0, 2.1);
  const ring = ctx.createOscillator();
  ring.type = "sine";
  ring.frequency.setValueAtTime(880, t + 0.8);
  ring.frequency.exponentialRampToValueAtTime(660, t + 2.4);
  const rg = ctx.createGain();
  rg.gain.setValueAtTime(0, t + 0.8);
  rg.gain.linearRampToValueAtTime(0.05, t + 0.85);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
  ring.connect(rg).connect(output);
  ring.start(t + 0.8);
  ring.stop(t + 2.7);
}
