// The clack, synthesised (no samples). A flap hitting its stop is three
// things at once: a dry burst of plastic noise (band-passed, a few ms
// long), a bright tick from the flap's edge, and a small low knock from
// the drum's body. Every clack is varied a little (pitch, filter, length,
// level) so a row reads as a mechanism, and panned by column so a ripple
// runs across the speakers.
//
// A full board can drop hundreds of flaps a second, far more than anyone
// needs to hear, so landings are pooled per frame and turned into at most
// a couple of clacks, louder when more flaps fell together, with a floor
// on the spacing between them.

import { audioReady, getAudio, noiseBuffer } from "../../audio";

let lastAt = 0;

type Clack = { gain: number; pan: number; delay?: number; bright?: number };

function clack({ gain, pan, delay = 0, bright = 1 }: Clack) {
  const kit = getAudio();
  if (!kit || !audioReady()) return;
  const { ctx, output } = kit;
  const t = ctx.currentTime + 0.004 + delay;
  const r = Math.random;

  let out: AudioNode = output;
  if (typeof ctx.createStereoPanner === "function") {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan * 0.7 + (r() - 0.5) * 0.1));
    panner.connect(output);
    out = panner;
  }

  // 1. the plastic burst
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = (2300 + r() * 1300) * bright;
  band.Q.value = 0.9 + r() * 0.6;
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 700;
  const burst = ctx.createGain();
  const length = 0.016 + r() * 0.012;
  burst.gain.setValueAtTime(0.0001, t);
  burst.gain.exponentialRampToValueAtTime(gain, t + 0.0007);
  burst.gain.exponentialRampToValueAtTime(0.0001, t + length);
  noise.connect(high).connect(band).connect(burst).connect(out);
  noise.start(t, r() * 0.9, 0.05);
  noise.stop(t + 0.05);

  // 2. the edge tick
  const tick = ctx.createOscillator();
  tick.type = "triangle";
  const pitch = (2900 + r() * 900) * bright;
  tick.frequency.setValueAtTime(pitch, t);
  tick.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + 0.008);
  const tickGain = ctx.createGain();
  tickGain.gain.setValueAtTime(0.0001, t);
  tickGain.gain.exponentialRampToValueAtTime(gain * 0.22, t + 0.0004);
  tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.007);
  tick.connect(tickGain).connect(out);
  tick.start(t);
  tick.stop(t + 0.02);

  // 3. the knock of the drum
  const knock = ctx.createOscillator();
  knock.type = "sine";
  const low = 150 + r() * 50;
  knock.frequency.setValueAtTime(low, t);
  knock.frequency.exponentialRampToValueAtTime(low * 0.6, t + 0.03);
  const knockGain = ctx.createGain();
  knockGain.gain.setValueAtTime(0.0001, t);
  knockGain.gain.exponentialRampToValueAtTime(gain * 0.5, t + 0.002);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  knock.connect(knockGain).connect(out);
  knock.start(t);
  knock.stop(t + 0.05);
}

/**
 * Called once a frame with the flaps that landed in it. `level` scales the
 * whole thing (quieter for the board ticking over on its own).
 */
export function playLandings(landings: number, pan: number, level = 1) {
  if (landings <= 0 || !audioReady()) return;
  const now = performance.now();
  // Never closer than 14 ms: past that it is a rattle, not more information.
  if (now - lastAt < 14) return;
  lastAt = now;
  const swell = Math.min(1, 0.42 + 0.16 * Math.log2(1 + landings));
  const gain = 0.32 * swell * level * (0.85 + Math.random() * 0.3);
  clack({ gain, pan });
  // A crowd of flaps in one frame: a second, softer one a few ms behind.
  if (landings > 6) clack({ gain: gain * 0.6, pan: -pan * 0.5 + (Math.random() - 0.5) * 0.6, delay: 0.006 + Math.random() * 0.006, bright: 0.85 });
}
