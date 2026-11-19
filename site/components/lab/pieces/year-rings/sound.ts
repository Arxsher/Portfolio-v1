// Sounds for the slice, synthesised on the spot through the lab's shared
// audio graph. Nothing plays until a gesture on the stage has created the
// context (audio.ts), and nothing plays while the lab is muted.
//
// - tick: a dry little wooden tick, like a fingernail crossing the grain:
//   one per ring the loupe crosses (the faster you sweep, the softer and
//   brighter, so a quick pass is a fine zip rather than a clatter), and
//   one per ring as the tree grows, rising in pitch as the trunk widens.
// - knock: knocking on the slice (a tap on the wood): a short click over
//   three wooden body modes, lower near the heavy middle, higher toward
//   the bark.

import { audioReady, getAudio, noiseBuffer } from "../../audio";

let lastTick = 0;

/**
 * `level` 0..1 (loudness), `pitch` 0..1 (low to high), `pan` -1..1,
 * `minGap` the shortest time between ticks in ms.
 */
export function tick(level: number, pitch: number, pan = 0, minGap = 16) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const nowMs = performance.now();
  if (nowMs - lastTick < minGap) return;
  lastTick = nowMs;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const gain = Math.max(0, Math.min(1, level));
  if (gain < 0.02) return;
  const p = Math.max(0, Math.min(1, pitch));

  const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : null;
  if (panner) {
    panner.pan.value = Math.max(-0.7, Math.min(0.7, pan));
    panner.connect(output);
  }
  const bus: AudioNode = panner ?? output;

  // the scratch of the grain
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2400 + 2600 * p + Math.random() * 300;
  band.Q.value = 3.2;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0, now);
  nGain.gain.linearRampToValueAtTime(0.09 * gain, now + 0.0015);
  nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
  noise.connect(band).connect(nGain).connect(bus);
  noise.start(now, Math.random() * 0.8, 0.04);

  // the wood under it
  const tok = ctx.createOscillator();
  tok.type = "sine";
  const f = 620 + 900 * p;
  tok.frequency.setValueAtTime(f, now);
  tok.frequency.exponentialRampToValueAtTime(f * 0.82, now + 0.03);
  const tGain = ctx.createGain();
  tGain.gain.setValueAtTime(0, now);
  tGain.gain.linearRampToValueAtTime(0.05 * gain, now + 0.002);
  tGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  tok.connect(tGain).connect(bus);
  tok.start(now);
  tok.stop(now + 0.06);
}

/** A knock on the slice: `where` 0 at the pith … 1 at the bark, `strength` 0..1. */
export function knock(where: number, strength = 1, pan = 0) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const s = Math.max(0.2, Math.min(1, strength));
  const w = Math.max(0, Math.min(1, where));

  const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : null;
  if (panner) {
    panner.pan.value = Math.max(-0.6, Math.min(0.6, pan));
    panner.connect(output);
  }
  const out: AudioNode = panner ?? output;

  // the knuckle
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1500 + 700 * w;
  band.Q.value = 1.1;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0, now);
  nGain.gain.linearRampToValueAtTime(0.2 * s, now + 0.001);
  nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
  noise.connect(band).connect(nGain).connect(out);
  noise.start(now, Math.random() * 0.8, 0.03);

  // the slice ringing: three body modes
  const base = 170 + 90 * w;
  const modes: Array<[number, number, number]> = [
    [1, 0.24, 0.16],
    [2.31, 0.12, 0.08],
    [4.07, 0.05, 0.045],
  ];
  for (const [ratio, amp, decay] of modes) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const fr = base * ratio * (1 + (Math.random() - 0.5) * 0.02);
    osc.frequency.setValueAtTime(fr * 1.04, now);
    osc.frequency.exponentialRampToValueAtTime(fr, now + 0.02);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp * s, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(g).connect(out);
    osc.start(now);
    osc.stop(now + decay + 0.02);
  }
}
