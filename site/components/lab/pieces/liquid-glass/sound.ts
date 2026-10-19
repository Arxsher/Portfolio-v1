// Sound for the liquid glass stage, made in the browser on the shared lab
// audio graph (components/lab/audio.ts): the context is only created from
// a gesture (`wake()` inside pointerdown / keydown / click), and every sound
// is silent while the lab is muted.
//
//   plip(size, pan)   a drop of water: a sine that rises fast as the bubble
//                     closes, with a soft wet click under it
//   merge(pan)        the droplet joining the dock: a lower, rounder blob
//                     and a faint glassy shimmer
//   pinch(pan)        pinching off: a short bright pop
//   tap(pan)          a fingertip on glass for the tabs: two inharmonic
//                     partials that ring for a moment

import { ensureAudio, getAudio, isMuted, noiseBuffer, type AudioKit } from "../../audio";

/** Call from a gesture: creates or resumes the shared context. */
export function wake() {
  if (!isMuted()) ensureAudio();
}

function kit(): AudioKit | null {
  if (isMuted()) return null;
  const audio = getAudio();
  if (!audio || audio.ctx.state === "closed") return null;
  return audio;
}

function out(ctx: AudioContext, output: AudioNode, pan: number): AudioNode {
  if (typeof ctx.createStereoPanner !== "function") return output;
  const node = ctx.createStereoPanner();
  node.pan.value = Math.max(-1, Math.min(1, pan));
  node.connect(output);
  return node;
}

function bubble(audio: AudioKit, at: number, from: number, to: number, length: number, gain: number, pan: number) {
  const { ctx, output } = audio;
  const dest = out(ctx, output, pan);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length * 1.9);
  osc.connect(env).connect(dest);
  osc.start(at);
  osc.stop(at + length * 2 + 0.02);
}

function click(audio: AudioKit, at: number, freq: number, gain: number, pan: number) {
  const { ctx, output } = audio;
  const dest = out(ctx, output, pan);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx, 0.25);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = 2.2;
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, at);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.022);
  noise.connect(band).connect(env).connect(dest);
  noise.start(at, Math.random() * 0.2, 0.03);
}

function ring(audio: AudioKit, at: number, freq: number, gain: number, decay: number, pan: number) {
  const { ctx, output } = audio;
  const dest = out(ctx, output, pan);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.008);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(env).connect(dest);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

/** A water drop; `size` 0..1 lowers it. */
export function plip(size: number, pan: number) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.003;
  const base = 520 - size * 180 + Math.random() * 40;
  bubble(audio, at, base, base * 2.6, 0.05, 0.16, pan);
  click(audio, at, 3200, 0.05, pan);
}

export function merge(pan: number) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.003;
  const base = 300 + Math.random() * 30;
  bubble(audio, at, base, base * 2.1, 0.075, 0.15, pan);
  ring(audio, at + 0.01, 2350 + Math.random() * 120, 0.018, 0.22, pan);
  ring(audio, at + 0.01, 3710 + Math.random() * 160, 0.01, 0.16, pan);
}

export function pinch(pan: number) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.003;
  const base = 760 + Math.random() * 80;
  bubble(audio, at, base, base * 2.3, 0.032, 0.11, pan);
  click(audio, at, 4200, 0.035, pan);
}

export function tap(pan: number) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.003;
  ring(audio, at, 2960 + Math.random() * 60, 0.04, 0.12, pan);
  ring(audio, at, 4620 + Math.random() * 80, 0.022, 0.08, pan);
  click(audio, at, 5200, 0.03, pan);
}
