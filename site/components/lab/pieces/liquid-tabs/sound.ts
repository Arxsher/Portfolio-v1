// Sounds of a liquid, synthesised on the spot through the lab's shared
// audio graph. Nothing plays until a gesture on the stage has created the
// context, and nothing plays while the lab is muted.
//
// - plip: a drop landing. A small air cavity ringing: a sine that sweeps
//   up fast as it closes, with a short tail. Ink is low and round, water
//   the classic bright plip, mercury a tiny metallic tink. Pitched by the
//   tab, so walking across the bar plays a little scale.
// - pinch: the string snapping, a dry high tick.
// - join: the remnant rejoining, a soft low "blup".
// - tick: the detent you feel scrubbing across a tab.
// - thud: a fling squashed against the end of the channel.

import { audioReady, getAudio, noiseBuffer } from "../../audio";
import type { MaterialId } from "./engine";

let lastPlip = 0;
let lastPinch = 0;
let lastTick = 0;
let lastJoin = 0;

/** Pentatonic steps for the tabs. */
const STEPS = [0, 2, 4, 7, 9, 12, 14];

function kit() {
  if (!audioReady()) return null;
  return getAudio();
}

function panner(ctx: AudioContext, pan: number): AudioNode | null {
  if (typeof ctx.createStereoPanner !== "function") return null;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-0.7, Math.min(0.7, pan));
  return p;
}

export function plip(material: MaterialId, index: number, strength: number, pan = 0) {
  const k = kit();
  if (!k) return;
  const nowMs = performance.now();
  if (nowMs - lastPlip < 55) return;
  lastPlip = nowMs;
  const { ctx, output } = k;
  const now = ctx.currentTime;
  const level = 0.05 + 0.13 * Math.max(0, Math.min(1, strength));
  const step = STEPS[Math.max(0, Math.min(STEPS.length - 1, index))];
  const base = (material === "mercury" ? 980 : material === "water" ? 620 : 430) * Math.pow(2, step / 24);
  const sweep = material === "mercury" ? 1.35 : material === "water" ? 2.1 : 1.7;
  const tail = material === "mercury" ? 0.07 : material === "water" ? 0.09 : 0.12;

  const out = ctx.createGain();
  out.gain.value = 1;
  const pn = panner(ctx, pan);
  if (pn) out.connect(pn).connect(output);
  else out.connect(output);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * sweep, now + 0.035);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, now + tail);
  osc.connect(g).connect(out);
  osc.start(now);
  osc.stop(now + tail + 0.03);

  if (material === "mercury") {
    // the metal's inharmonic shimmer
    const ping = ctx.createOscillator();
    ping.type = "sine";
    ping.frequency.value = base * 2.76;
    const pg = ctx.createGain();
    pg.gain.setValueAtTime(0, now);
    pg.gain.linearRampToValueAtTime(level * 0.35, now + 0.002);
    pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    ping.connect(pg).connect(out);
    ping.start(now);
    ping.stop(now + 0.2);
  } else {
    // the wet contact: a whisper of filtered noise
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = material === "water" ? 2600 : 1700;
    bp.Q.value = 1.1;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, now);
    ng.gain.linearRampToValueAtTime(level * 0.28, now + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
    n.connect(bp).connect(ng).connect(out);
    n.start(now, Math.random() * 0.5, 0.05);
  }
}

export function pinch(strength: number, pan = 0) {
  const k = kit();
  if (!k) return;
  const nowMs = performance.now();
  if (nowMs - lastPinch < 50) return;
  lastPinch = nowMs;
  const { ctx, output } = k;
  const now = ctx.currentTime;
  const level = 0.04 + 0.06 * Math.max(0, Math.min(1, strength));
  const pn = panner(ctx, pan);
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = "bandpass";
  hp.frequency.value = 3800 + Math.random() * 500;
  hp.Q.value = 2.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
  const chain = n.connect(hp).connect(g);
  if (pn) chain.connect(pn).connect(output);
  else chain.connect(output);
  n.start(now, Math.random() * 0.5, 0.03);

  const blip = ctx.createOscillator();
  blip.type = "sine";
  blip.frequency.setValueAtTime(2300, now);
  blip.frequency.exponentialRampToValueAtTime(1500, now + 0.02);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0, now);
  bg.gain.linearRampToValueAtTime(level * 0.5, now + 0.001);
  bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  blip.connect(bg).connect(output);
  blip.start(now);
  blip.stop(now + 0.04);
}

export function join(material: MaterialId, strength: number, pan = 0) {
  const k = kit();
  if (!k) return;
  const nowMs = performance.now();
  if (nowMs - lastJoin < 70) return;
  lastJoin = nowMs;
  const { ctx, output } = k;
  const now = ctx.currentTime;
  const level = 0.05 + 0.09 * Math.max(0, Math.min(1, strength));
  const f0 = material === "mercury" ? 360 : material === "water" ? 260 : 200;
  const pn = panner(ctx, pan);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f0, now);
  osc.frequency.exponentialRampToValueAtTime(f0 * 1.6, now + 0.045);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  const chain = osc.connect(g).connect(lp);
  if (pn) chain.connect(pn).connect(output);
  else chain.connect(output);
  osc.start(now);
  osc.stop(now + 0.17);
}

export function tick(index: number, strength: number) {
  const k = kit();
  if (!k) return;
  const nowMs = performance.now();
  if (nowMs - lastTick < 28) return;
  lastTick = nowMs;
  const { ctx, output } = k;
  const now = ctx.currentTime;
  const level = 0.025 + 0.03 * Math.max(0, Math.min(1, strength));
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1900 * Math.pow(2, STEPS[Math.max(0, Math.min(STEPS.length - 1, index))] / 24);
  bp.Q.value = 3;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);
  n.connect(bp).connect(g).connect(output);
  n.start(now, Math.random() * 0.5, 0.03);
}

export function thud(strength: number, pan = 0) {
  const k = kit();
  if (!k) return;
  const { ctx, output } = k;
  const now = ctx.currentTime;
  const level = 0.05 + 0.08 * Math.max(0, Math.min(1, strength));
  const pn = panner(ctx, pan);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(85, now + 0.07);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  const chain = osc.connect(g);
  if (pn) chain.connect(pn).connect(output);
  else chain.connect(output);
  osc.start(now);
  osc.stop(now + 0.12);
}
