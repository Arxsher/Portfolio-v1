// Two small paper sounds, synthesised (no files): a crinkle for each fold
// and a soft whoosh for the throw. They go through the lab's shared audio
// graph (components/lab/audio.ts), so the site-wide mute applies, and they
// only ever play after a press created or resumed the audio context.
//
// That module belongs to the lab and may change under us. It is read
// through a loose view below and every use is checked and wrapped, so a
// rename or a new signature over there can only silence the planes, never
// break the build or the send flow. What we rely on:
//   ensureAudio() / getAudio()  → { ctx: AudioContext, output: AudioNode } | null
//   isMuted()                   → boolean (missing = treated as muted)
//   noiseBuffer(ctx, seconds?)  → AudioBuffer (missing = our own below)

import * as lab from "@/components/lab/audio";

type Kit = { ctx: AudioContext; output: AudioNode };

const shared = lab as unknown as Partial<{
  ensureAudio: () => Kit | null;
  getAudio: () => Kit | null;
  isMuted: () => boolean;
  noiseBuffer: (ctx: AudioContext, seconds?: number) => AudioBuffer;
}>;

/** Call inside the press that starts folding, so later sounds may play. */
export function primePaperSound() {
  try {
    if (typeof shared.ensureAudio === "function") shared.ensureAudio();
  } catch {
    // no sound, that's all
  }
}

function kit(): Kit | null {
  try {
    if (typeof shared.isMuted !== "function" || shared.isMuted()) return null;
    if (typeof shared.getAudio !== "function") return null;
    const audio = shared.getAudio();
    if (!audio || !audio.ctx || !audio.output || audio.ctx.state !== "running") return null;
    return audio;
  } catch {
    return null;
  }
}

const ownNoise = new WeakMap<AudioContext, Map<number, AudioBuffer>>();

/** White noise to filter: the lab's shared buffer, or one of our own. */
function noise(ctx: AudioContext, seconds = 1): AudioBuffer {
  try {
    if (typeof shared.noiseBuffer === "function") {
      const buffer = shared.noiseBuffer(ctx, seconds);
      if (buffer && typeof buffer.getChannelData === "function") return buffer;
    }
  } catch {
    // fall through to our own
  }
  let cache = ownNoise.get(ctx);
  if (!cache) {
    cache = new Map();
    ownNoise.set(ctx, cache);
  }
  let buffer = cache.get(seconds);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * seconds)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    cache.set(seconds, buffer);
  }
  return buffer;
}

/** A dry paper crinkle: a few tiny bursts of filtered noise and a soft crease thump. */
export function foldSound(strength = 1) {
  const audio = kit();
  if (!audio) return;
  try {
    const { ctx, output } = audio;
    const now = ctx.currentTime;
    const buffer = noise(ctx);
    const grains = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < grains; i++) {
      const at = now + i * (0.012 + Math.random() * 0.02);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 2600 + Math.random() * 3200;
      band.Q.value = 0.9 + Math.random() * 1.2;
      const gain = ctx.createGain();
      const peak = (0.05 + Math.random() * 0.05) * strength;
      const length = 0.008 + Math.random() * 0.022;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(peak, at + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      source.connect(band).connect(gain).connect(output);
      source.start(at, Math.random() * 0.8, length + 0.02);
    }
    // the crease settling
    const thump = ctx.createBufferSource();
    thump.buffer = buffer;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 420;
    const body = ctx.createGain();
    const at = now + 0.05;
    body.gain.setValueAtTime(0, at);
    body.gain.linearRampToValueAtTime(0.09 * strength, at + 0.006);
    body.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
    thump.connect(low).connect(body).connect(output);
    thump.start(at, Math.random() * 0.5, 0.1);
  } catch {
    // a sound is never worth an error
  }
}

/** Air past a thrown plane; `speed` 0…1, `pan` −1 (left) … 1 (right). */
export function throwSound(speed = 0.6, pan = 0.3) {
  const audio = kit();
  if (!audio) return;
  try {
    const { ctx, output } = audio;
    const now = ctx.currentTime;
    const length = 0.55 + speed * 0.35;
    const source = ctx.createBufferSource();
    source.buffer = noise(ctx, 2);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.75;
    band.frequency.setValueAtTime(420, now);
    band.frequency.exponentialRampToValueAtTime(1500 + speed * 900, now + length * 0.35);
    band.frequency.exponentialRampToValueAtTime(520, now + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06 + speed * 0.06, now + length * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    let node: AudioNode = gain;
    if (typeof ctx.createStereoPanner === "function") {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, -pan * 0.3)), now);
      panner.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, pan)), now + length);
      gain.connect(panner);
      node = panner;
    }
    source.connect(band).connect(gain);
    node.connect(output);
    source.start(now, Math.random() * 0.8, length + 0.05);
  } catch {
    // a sound is never worth an error
  }
}
