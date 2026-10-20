// Sounds, synthesised (no samples), through the lab's shared audio graph,
// so they only ever play after a gesture and the lab mute silences them.
//
//   tension  while you hold: a soft, rising creak of pressure (narrow
//            band-passed noise that tightens and climbs), gone the moment
//            you let go
//   drip     a drop of molten wax landing on the paper: a soft, dull pat
//   thunk    the stamp landing: a low body thump, the knock of wood on
//            brass and a short wet squeeze of wax
//   set down the stamp put back on the table: a small hollow knock
//   crack    breaking the seal: three dry snaps a few ms apart over a small
//            low knock; then a tick for each shard that lands
//   paper    the flap and the letter sliding: a soft breath of noise

import { audioReady, getAudio, noiseBuffer } from "../../audio";

type Kit = NonNullable<ReturnType<typeof getAudio>>;

function kit(): Kit | null {
  const audio = getAudio();
  return audio && audioReady() ? audio : null;
}

function burst(
  audio: Kit,
  at: number,
  {
    gain,
    length,
    type,
    frequency,
    q = 0.8,
    sweepTo,
    attack = 0.001,
  }: { gain: number; length: number; type: BiquadFilterType; frequency: number; q?: number; sweepTo?: number; attack?: number },
) {
  const { ctx, output } = audio;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, at);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, at + length);
  filter.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  source.connect(filter).connect(env).connect(output);
  source.start(at, Math.random() * 0.8, length + 0.05);
  source.stop(at + length + 0.05);
}

function tone(audio: Kit, at: number, { from, to, gain, length, type = "sine" }: { from: number; to: number; gain: number; length: number; type?: OscillatorType }) {
  const { ctx, output } = audio;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(env).connect(output);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/* ---------------------------------------------------------------------- */

/** The held-pressure creak. `set(progress)` every frame, `stop()` on release. */
export class Tension {
  private nodes: { source: AudioBufferSourceNode; band: BiquadFilterNode; gain: GainNode; hum: OscillatorNode; humGain: GainNode } | null = null;

  start() {
    const audio = kit();
    if (!audio || this.nodes) return;
    const { ctx, output } = audio;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 2);
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 220;
    band.Q.value = 7;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(band).connect(gain).connect(output);
    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 62;
    const humGain = ctx.createGain();
    humGain.gain.value = 0;
    hum.connect(humGain).connect(output);
    source.start();
    hum.start();
    this.nodes = { source, band, gain, hum, humGain };
  }

  set(progress: number) {
    const audio = getAudio();
    const nodes = this.nodes;
    if (!audio || !nodes) return;
    const t = audio.ctx.currentTime;
    const p = Math.max(0, Math.min(1, progress));
    nodes.band.frequency.setTargetAtTime(220 + p * p * 760, t, 0.05);
    nodes.band.Q.setTargetAtTime(7 + p * 9, t, 0.05);
    nodes.gain.gain.setTargetAtTime(0.055 * p * p + 0.008 * p, t, 0.04);
    nodes.hum.frequency.setTargetAtTime(62 + p * 30, t, 0.05);
    nodes.humGain.gain.setTargetAtTime(0.05 * p * p * p, t, 0.05);
  }

  stop(fast = false) {
    const audio = getAudio();
    const nodes = this.nodes;
    this.nodes = null;
    if (!audio || !nodes) return;
    const t = audio.ctx.currentTime;
    const tau = fast ? 0.012 : 0.06;
    nodes.gain.gain.cancelScheduledValues(t);
    nodes.gain.gain.setTargetAtTime(0, t, tau);
    nodes.humGain.gain.cancelScheduledValues(t);
    nodes.humGain.gain.setTargetAtTime(0, t, tau);
    nodes.source.stop(t + tau * 8);
    nodes.hum.stop(t + tau * 8);
  }
}

/** The stamp landing in the wax. */
export function thunk(level = 1) {
  const audio = kit();
  if (!audio) return;
  const t = audio.ctx.currentTime + 0.005;
  tone(audio, t, { from: 128, to: 46, gain: 0.62 * level, length: 0.24 });
  tone(audio, t, { from: 240, to: 150, gain: 0.12 * level, length: 0.06, type: "triangle" });
  burst(audio, t, { gain: 0.3 * level, length: 0.05, type: "lowpass", frequency: 900, q: 0.7 });
  burst(audio, t + 0.002, { gain: 0.08 * level, length: 0.016, type: "bandpass", frequency: 3200, q: 1.2 });
  // the wax squeezing out under the face
  burst(audio, t + 0.012, { gain: 0.05 * level, length: 0.14, type: "bandpass", frequency: 1400, sweepTo: 520, q: 3, attack: 0.02 });
}

/** A drop of wax landing (the later ones a touch lower and fuller). */
export function drip(index = 0) {
  const audio = kit();
  if (!audio) return;
  const t = audio.ctx.currentTime + 0.003;
  burst(audio, t, { gain: 0.06 + index * 0.012, length: 0.045, type: "lowpass", frequency: 700 - index * 90, q: 0.9 });
  tone(audio, t, { from: 300 - index * 30, to: 170, gain: 0.035, length: 0.05 });
}

/** The stamp set back down on the table. */
export function setDown() {
  const audio = kit();
  if (!audio) return;
  const t = audio.ctx.currentTime + 0.004;
  tone(audio, t, { from: 210, to: 120, gain: 0.16, length: 0.09 });
  tone(audio, t, { from: 520, to: 380, gain: 0.04, length: 0.035, type: "triangle" });
  burst(audio, t, { gain: 0.07, length: 0.025, type: "bandpass", frequency: 1800, q: 1.4 });
}

/** The seal breaking. */
export function crackle() {
  const audio = kit();
  if (!audio) return;
  const t = audio.ctx.currentTime + 0.004;
  const snaps = [0, 0.026 + Math.random() * 0.01, 0.052 + Math.random() * 0.02];
  snaps.forEach((at, i) => {
    burst(audio, t + at, { gain: (0.38 - i * 0.08) * (0.85 + Math.random() * 0.3), length: 0.012 + Math.random() * 0.01, type: "highpass", frequency: 1900 + Math.random() * 900, q: 0.9 });
    burst(audio, t + at, { gain: 0.12, length: 0.02, type: "bandpass", frequency: 3800 + Math.random() * 1600, q: 4 });
  });
  tone(audio, t, { from: 190, to: 90, gain: 0.16, length: 0.07 });
}

/** A shard landing on the paper (quieter for the later ones). */
export function tick(level = 1) {
  const audio = kit();
  if (!audio) return;
  const t = audio.ctx.currentTime + 0.002;
  const f = 2600 + Math.random() * 2400;
  burst(audio, t, { gain: 0.07 * level, length: 0.01 + Math.random() * 0.006, type: "bandpass", frequency: f, q: 3 });
  tone(audio, t, { from: f * 0.9, to: f * 0.7, gain: 0.015 * level, length: 0.02, type: "triangle" });
}

/** Paper moving: the flap opening, the letter sliding out (or back in). */
export function rustle(length = 0.4, level = 1, rising = true) {
  const audio = kit();
  if (!audio) return;
  const t = audio.ctx.currentTime + 0.005;
  burst(audio, t, {
    gain: 0.05 * level,
    length,
    type: "bandpass",
    frequency: rising ? 900 : 2400,
    sweepTo: rising ? 2600 : 900,
    q: 0.9,
    attack: length * 0.35,
  });
  burst(audio, t + length * 0.2, { gain: 0.025 * level, length: length * 0.6, type: "highpass", frequency: 4200, q: 0.5, attack: length * 0.2 });
}
