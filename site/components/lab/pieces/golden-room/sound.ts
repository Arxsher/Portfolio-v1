// Sounds for the golden hour room, made on the spot on the lab's shared
// audio graph (components/lab/audio.ts). Nothing plays until a gesture on
// the stage has created the context, and the lab-wide mute silences all
// of it.
//
// - tick: the wall clock's escapement as the sun passes each hour, a few
//   ms of filtered noise over a tiny woody knock, a touch brighter every
//   third hour. Rate-limited, and softer the faster you sweep, so a flick
//   through the afternoon is a light patter rather than a burst.
// - lampClick: the lamp's push switch (a short two-part click), and on the
//   way on, the faint glassy tink of a filament catching.
// - screenOn: the monitor waking, a soft low thump and a quiet two-note
//   chime high up, like a panel's backlight coming on.

import { audioReady, getAudio, noiseBuffer } from "../../audio";

let lastTick = 0;

function panner(ctx: AudioContext, pan: number): StereoPannerNode | null {
  if (typeof ctx.createStereoPanner !== "function") return null;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-0.8, Math.min(0.8, pan));
  return p;
}

/** One tick of the clock. `pan` -1..1, `speed` in hours per second. */
export function tick(hour: number, pan: number, speed: number) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const nowMs = performance.now();
  if (nowMs - lastTick < 55) return;
  lastTick = nowMs;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const hurry = Math.min(1, Math.max(0, (speed - 2) / 14));
  const accent = Math.round(hour) % 3 === 0 ? 1.25 : 1;
  const level = 0.11 * (1 - 0.55 * hurry) * accent;
  const out = panner(ctx, pan);
  const dest: AudioNode = out ? (out.connect(output), out) : output;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.playbackRate.value = 0.95 + Math.random() * 0.1;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = (accent > 1 ? 3400 : 2900) + Math.random() * 300;
  band.Q.value = 2.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(level, now + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  noise.connect(band).connect(g).connect(dest);
  noise.start(now, Math.random() * 0.5, 0.05);

  const knock = ctx.createOscillator();
  knock.type = "sine";
  knock.frequency.setValueAtTime(accent > 1 ? 1250 : 980, now);
  knock.frequency.exponentialRampToValueAtTime(520, now + 0.03);
  const kg = ctx.createGain();
  kg.gain.setValueAtTime(0, now);
  kg.gain.linearRampToValueAtTime(level * 0.5, now + 0.002);
  kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  knock.connect(kg).connect(dest);
  knock.start(now);
  knock.stop(now + 0.07);
}

/** The lamp's switch; `on` adds the filament's tink. */
export function lampClick(on: boolean, pan = 0.4) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const out = panner(ctx, pan);
  const dest: AudioNode = out ? (out.connect(output), out) : output;

  // the switch: a press and a release a few ms apart
  for (const [at, freq, level] of [
    [0, 2300, 0.2],
    [0.024, 1700, 0.13],
  ] as const) {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq;
    band.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + at);
    g.gain.linearRampToValueAtTime(level, now + at + 0.0012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.022);
    noise.connect(band).connect(g).connect(dest);
    noise.start(now + at, Math.random() * 0.5, 0.04);
  }
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(300, now);
  body.frequency.exponentialRampToValueAtTime(140, now + 0.05);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0, now);
  bg.gain.linearRampToValueAtTime(0.14, now + 0.003);
  bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  body.connect(bg).connect(dest);
  body.start(now);
  body.stop(now + 0.1);

  if (!on) return;
  // a filament catching: a faint, slightly detuned glassy ping
  for (const [ratio, level] of [
    [1, 0.022],
    [2.76, 0.008],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 3150 * ratio;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + 0.05);
    g.gain.linearRampToValueAtTime(level, now + 0.056);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.connect(g).connect(dest);
    osc.start(now + 0.05);
    osc.stop(now + 0.55);
  }
}

/** The monitor waking up. */
export function screenOn(pan = 0.2) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const out = panner(ctx, pan);
  const dest: AudioNode = out ? (out.connect(output), out) : output;

  const thump = ctx.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(120, now);
  thump.frequency.exponentialRampToValueAtTime(70, now + 0.12);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0, now);
  tg.gain.linearRampToValueAtTime(0.1, now + 0.01);
  tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  thump.connect(tg).connect(dest);
  thump.start(now);
  thump.stop(now + 0.22);

  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 5200;
  tone.connect(dest);
  for (const [at, freq] of [
    [0.06, 1318.5],
    [0.16, 1975.5],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + at);
    g.gain.linearRampToValueAtTime(0.026, now + at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.7);
    osc.connect(g).connect(tone);
    osc.start(now + at);
    osc.stop(now + at + 0.75);
  }
}
