// The record's music, synthesised once in an OfflineAudioContext: a
// four-bar loop at 90 BPM in D minor (Dm9 · G13 · Cmaj9 · A7♭13), laid back
// with swung sixteenths. Three stems are rendered side by side in one pass
// (one channel each for drums and bass, two for the keys) so the bands on
// the record can mix them; every stem also gets a reversed copy for
// scratching backwards. A crackle bed (surface noise and dust) is made
// directly in JS.
//
// Everything is original: plain oscillators, filtered noise and envelopes.
//   drums: a pitched-down sine kick with a click, a noise snare with a
//          triangle body and ghost notes, short and open hats
//   bass:  a round sine with a little triangle and soft saturation
//   keys:  a small FM electric piano (sine carrier, ratio-1 modulator
//          with a decaying index), tremolo, gentle chorus and a room

export type Stem = { fwd: AudioBuffer; rev: AudioBuffer };

export type LoopSet = {
  /** Loop length in seconds. */
  duration: number;
  /** drums, bass, keys */
  stems: readonly [Stem, Stem, Stem];
  /** Surface noise, forward only (it sounds the same either way). */
  crackle: AudioBuffer;
};

export const BPM = 90;
const BEAT = 60 / BPM;
const SIXTEENTH = BEAT / 4;
const BARS = 4;
export const LOOP_SECONDS = BARS * 4 * BEAT;
const SWING = 0.2; // of a sixteenth, on the off sixteenths
const TAIL = 2.5;

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

/** Sixteenth step (0..63 over the loop) to seconds, with swing. */
const at = (step: number) => step * SIXTEENTH + (Math.floor(step) % 2 === 1 ? SWING * SIXTEENTH : 0);

/* ---------------------------------------------------------------------- */
/* the score                                                               */
/* ---------------------------------------------------------------------- */

type Hit = { step: number; vel: number };

// drums, per bar (16 steps); bar 4 has a small fill
const KICK: Hit[][] = [
  [{ step: 0, vel: 1 }, { step: 6, vel: 0.7 }, { step: 10, vel: 0.85 }],
  [{ step: 0, vel: 1 }, { step: 7, vel: 0.6 }, { step: 10, vel: 0.85 }],
  [{ step: 0, vel: 1 }, { step: 6, vel: 0.7 }, { step: 10, vel: 0.85 }],
  [{ step: 0, vel: 1 }, { step: 6, vel: 0.7 }, { step: 9, vel: 0.55 }, { step: 11, vel: 0.8 }],
];
const SNARE: Hit[][] = [
  [{ step: 4, vel: 1 }, { step: 7, vel: 0.16 }, { step: 12, vel: 1 }, { step: 15, vel: 0.14 }],
  [{ step: 4, vel: 1 }, { step: 9, vel: 0.13 }, { step: 12, vel: 1 }],
  [{ step: 4, vel: 1 }, { step: 7, vel: 0.16 }, { step: 12, vel: 1 }, { step: 15, vel: 0.14 }],
  [{ step: 4, vel: 1 }, { step: 12, vel: 1 }, { step: 13, vel: 0.2 }, { step: 14, vel: 0.32 }, { step: 15, vel: 0.5 }],
];
const HAT_ACCENT = [0.9, 0.3, 0.55, 0.28, 0.85, 0.3, 0.55, 0.32, 0.9, 0.3, 0.55, 0.28, 0.85, 0.3, 0.6, 0.35];

// bass: [step within bar, length in steps, midi]
const BASS: Array<Array<[number, number, number]>> = [
  [[0, 5, 38], [6, 2, 38], [10, 3, 45], [14, 2, 48]],
  [[0, 5, 43], [6, 2, 43], [10, 3, 50], [14, 2, 53]],
  [[0, 5, 36], [6, 2, 36], [10, 3, 43], [14, 2, 47]],
  [[0, 5, 33], [6, 2, 33], [10, 3, 40], [13, 1, 43], [14, 2, 49]],
];

// keys: voicings per bar, and when they're struck: [step, length, velocity]
const CHORDS: number[][] = [
  [53, 57, 60, 64], // Dm9: F A C E over D
  [53, 57, 59, 64], // G13: F A B E over G
  [52, 55, 59, 62], // Cmaj9: E G B D over C
  [55, 59, 61, 65], // A7♭13: G B C# F over A
];
const COMP: Array<[number, number, number]> = [
  [0, 9, 0.8],
  [10, 5, 0.55],
];

/* ---------------------------------------------------------------------- */
/* voices                                                                  */
/* ---------------------------------------------------------------------- */

function noise(ctx: BaseAudioContext, seconds: number, seed = 1): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let s = seed * 0x9e3779b1;
  for (let i = 0; i < length; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    data[i] = ((s >>> 0) / 4294967296) * 2 - 1;
  }
  return buffer;
}

/** A room: decaying stereo noise, darker as it fades. */
function room(ctx: BaseAudioContext, seconds: number, channels: 1 | 2): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(channels, length, ctx.sampleRate);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    let s = 0x1234567 + c * 977;
    let low = 0;
    for (let i = 0; i < length; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      const white = ((s >>> 0) / 4294967296) * 2 - 1;
      const t = i / length;
      // one-pole lowpass whose cutoff falls with time
      const k = 0.55 - 0.42 * t;
      low += (white - low) * k;
      const early = i < ctx.sampleRate * 0.012 ? 0 : 1;
      data[i] = low * Math.exp(-6.2 * t) * early * 0.6;
    }
  }
  return buffer;
}

function curve(drive: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const out = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    out[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return out;
}

type Ctx = OfflineAudioContext;

function kick(ctx: Ctx, out: AudioNode, t: number, vel: number, click: AudioBuffer) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(52, t + 0.06);
  osc.frequency.exponentialRampToValueAtTime(44, t + 0.32);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.95 * vel, t + 0.003);
  g.gain.setTargetAtTime(0, t + 0.03, 0.11);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.7);

  const src = ctx.createBufferSource();
  src.buffer = click;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 3200;
  band.Q.value = 0.8;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.28 * vel, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
  src.connect(band).connect(cg).connect(out);
  src.start(t, 0.1, 0.03);
}

function snare(ctx: Ctx, out: AudioNode, send: AudioNode, t: number, vel: number, buf: AudioBuffer) {
  const ghost = vel < 0.4;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 900;
  const band = ctx.createBiquadFilter();
  band.type = "peaking";
  band.frequency.value = 2400;
  band.gain.value = 5;
  band.Q.value = 0.8;
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = ghost ? 5200 : 8200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.55 * vel, t + 0.002);
  g.gain.setTargetAtTime(0, t + 0.012, ghost ? 0.03 : 0.065);
  src.connect(high).connect(band).connect(low).connect(g);
  g.connect(out);
  if (!ghost) g.connect(send);
  src.start(t, (t * 7.31) % 0.5, 0.5);

  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(205, t);
  body.frequency.exponentialRampToValueAtTime(168, t + 0.05);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0, t);
  bg.gain.linearRampToValueAtTime(0.5 * vel, t + 0.002);
  bg.gain.setTargetAtTime(0, t + 0.01, 0.035);
  body.connect(bg).connect(out);
  body.start(t);
  body.stop(t + 0.3);
}

function hat(ctx: Ctx, out: AudioNode, t: number, vel: number, open: boolean, buf: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 7200;
  const peak = ctx.createBiquadFilter();
  peak.type = "peaking";
  peak.frequency.value = 10500;
  peak.gain.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.22 * vel, t + 0.001);
  g.gain.setTargetAtTime(0, t + 0.004, open ? 0.09 : 0.014);
  src.connect(high).connect(peak).connect(g).connect(out);
  src.start(t, (t * 3.17) % 0.6, open ? 0.6 : 0.12);
}

function bassNote(ctx: Ctx, out: AudioNode, t: number, length: number, note: number) {
  const f = midi(note);
  const a = ctx.createOscillator();
  a.type = "sine";
  a.frequency.value = f;
  const b = ctx.createOscillator();
  b.type = "triangle";
  b.frequency.value = f;
  const bg = ctx.createGain();
  bg.gain.value = 0.32;
  const g = ctx.createGain();
  const end = t + length;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.7, t + 0.012);
  g.gain.setTargetAtTime(0.5, t + 0.02, 0.25);
  g.gain.setTargetAtTime(0, end, 0.035);
  a.connect(g);
  b.connect(bg).connect(g);
  g.connect(out);
  a.start(t);
  b.start(t);
  a.stop(end + 0.3);
  b.stop(end + 0.3);
}

function epNote(ctx: Ctx, out: AudioNode, t: number, length: number, note: number, vel: number, detune: number) {
  const f = midi(note);
  const carrier = ctx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.value = f;
  carrier.detune.value = detune;
  const mod = ctx.createOscillator();
  mod.type = "sine";
  mod.frequency.value = f;
  mod.detune.value = detune;
  const index = ctx.createGain();
  // the "bark" of the tine: a bright attack that mellows
  index.gain.setValueAtTime(f * (1.6 + vel * 1.4), t);
  index.gain.setTargetAtTime(f * 0.35, t + 0.005, 0.18);
  mod.connect(index).connect(carrier.frequency);

  const tine = ctx.createOscillator();
  tine.type = "sine";
  tine.frequency.value = f * 4.02;
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0.05 * vel, t);
  tg.gain.setTargetAtTime(0, t + 0.002, 0.05);

  const g = ctx.createGain();
  const end = t + length;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.16 * vel, t + 0.005);
  g.gain.setTargetAtTime(0.09 * vel, t + 0.01, 0.4);
  g.gain.setTargetAtTime(0, end, 0.16);
  carrier.connect(g).connect(out);
  tine.connect(tg).connect(out);
  for (const o of [carrier, mod, tine]) {
    o.start(t);
    o.stop(end + 1);
  }
}

/* ---------------------------------------------------------------------- */
/* render                                                                  */
/* ---------------------------------------------------------------------- */

function reversed(buffer: AudioBuffer): AudioBuffer {
  const out = new AudioBuffer({ length: buffer.length, numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = out.getChannelData(c);
    for (let i = 0, n = src.length; i < n; i++) dst[i] = src[n - 1 - i];
  }
  return out;
}

/** Copies channels [from, from + count) of a rendered buffer, folding the tail into the start. */
function slice(rendered: AudioBuffer, from: number, count: number, length: number, gain: number): AudioBuffer {
  const out = new AudioBuffer({ length, numberOfChannels: count, sampleRate: rendered.sampleRate });
  for (let c = 0; c < count; c++) {
    const src = rendered.getChannelData(from + c);
    const dst = out.getChannelData(c);
    for (let i = 0; i < length; i++) dst[i] = src[i] * gain;
    // whatever rang past the end of bar 4 belongs to the start of bar 1
    for (let i = length; i < src.length; i++) dst[i - length] += src[i] * gain;
  }
  return out;
}

/** Surface noise and dust: a bed of hiss with ticks and the odd pop. */
function crackle(sampleRate: number, seconds = 7): AudioBuffer {
  const length = Math.floor(sampleRate * seconds);
  const buffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate });
  const data = buffer.getChannelData(0);
  let s = 0x2468ace;
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  // hiss: band-limited, very low
  let lp = 0;
  let hp = 0;
  for (let i = 0; i < length; i++) {
    const w = rand() * 2 - 1;
    lp += (w - lp) * 0.35;
    hp += (lp - hp) * 0.02;
    data[i] = (lp - hp) * 0.0045;
  }
  // ticks: a Poisson stream, mostly tiny, now and then a pop
  const rate = 16; // a second
  let t = 0;
  while (true) {
    t += -Math.log(1 - rand()) / rate;
    const start = Math.floor(t * sampleRate);
    if (start >= length) break;
    const big = rand() < 0.05;
    const amp = big ? 0.12 + rand() * 0.14 : 0.012 + rand() ** 3 * 0.06;
    const decay = (big ? 0.0016 : 0.00035 + rand() * 0.0005) * sampleRate;
    const span = Math.floor(decay * 6);
    const sign = rand() < 0.5 ? -1 : 1;
    let prev = 0;
    for (let k = 0; k < span; k++) {
      const env = Math.exp(-k / decay);
      const v = sign * amp * env * (big ? Math.sin(k * 0.18) : 1);
      // a first difference keeps the ticks bright and centred
      const idx = (start + k) % length;
      data[idx] += v - prev * 0.6;
      prev = v;
    }
  }
  return buffer;
}

let cache: Promise<LoopSet> | null = null;

/** Renders the loop once per page (later calls share the promise). */
export function renderLoop(sampleRate = 44100): Promise<LoopSet> {
  if (cache) return cache;
  cache = build(sampleRate).catch((error) => {
    cache = null;
    throw error;
  });
  return cache;
}

async function build(sampleRate: number): Promise<LoopSet> {
  const Offline = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Offline) throw new Error("turntable: no OfflineAudioContext");
  const loopLength = Math.round(LOOP_SECONDS * sampleRate);
  const total = loopLength + Math.round(TAIL * sampleRate);
  const ctx = new Offline({ numberOfChannels: 4, length: total, sampleRate });
  ctx.destination.channelCount = 4;
  ctx.destination.channelInterpretation = "discrete";

  const merger = ctx.createChannelMerger(4);
  merger.connect(ctx.destination);

  // drums → channel 0
  const drums = ctx.createGain();
  drums.channelCount = 1;
  drums.channelCountMode = "explicit";
  const drumTone = ctx.createBiquadFilter();
  drumTone.type = "lowpass";
  drumTone.frequency.value = 11000;
  const drumGlue = ctx.createWaveShaper();
  drumGlue.curve = curve(1.25);
  drums.connect(drumGlue).connect(drumTone).connect(merger, 0, 0);
  const drumRoom = ctx.createConvolver();
  drumRoom.normalize = false;
  drumRoom.buffer = room(ctx, 0.7, 1);
  const drumSend = ctx.createGain();
  drumSend.gain.value = 0.22;
  drumSend.connect(drumRoom).connect(drums);

  // bass → channel 1
  const bass = ctx.createGain();
  bass.channelCount = 1;
  bass.channelCountMode = "explicit";
  const bassLow = ctx.createBiquadFilter();
  bassLow.type = "lowpass";
  bassLow.frequency.value = 900;
  bassLow.Q.value = 0.5;
  const bassDrive = ctx.createWaveShaper();
  bassDrive.curve = curve(1.8);
  bass.connect(bassDrive).connect(bassLow).connect(merger, 0, 1);

  // keys → channels 2, 3 (tremolo, two slightly detuned sides, a room)
  const keysL = ctx.createGain();
  const keysR = ctx.createGain();
  const keysBus = ctx.createChannelMerger(2);
  keysL.connect(keysBus, 0, 0);
  keysR.connect(keysBus, 0, 1);
  const keysTone = ctx.createBiquadFilter();
  keysTone.type = "lowpass";
  keysTone.frequency.value = 3800;
  const trem = ctx.createGain();
  trem.gain.value = 0.82;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4.4;
  const depth = ctx.createGain();
  depth.gain.value = 0.16;
  lfo.connect(depth).connect(trem.gain);
  lfo.start(0);
  const keysRoom = ctx.createConvolver();
  keysRoom.normalize = false;
  keysRoom.buffer = room(ctx, 1.6, 2);
  const keysSend = ctx.createGain();
  keysSend.gain.value = 0.3;
  const keysOut = ctx.createGain();
  keysBus.connect(keysTone).connect(trem).connect(keysOut);
  trem.connect(keysSend).connect(keysRoom).connect(keysOut);
  const split = ctx.createChannelSplitter(2);
  keysOut.connect(split);
  split.connect(merger, 0, 2);
  split.connect(merger, 1, 3);

  const snareNoise = noise(ctx, 1, 7);
  const hatNoise = noise(ctx, 1, 11);
  const click = noise(ctx, 0.2, 3);
  const human = (step: number, salt: number) => {
    const x = Math.sin(step * 12.9898 + salt * 78.233) * 43758.5453;
    return (x - Math.floor(x)) * 0.005;
  };

  for (let bar = 0; bar < BARS; bar++) {
    const base = bar * 16;
    for (const h of KICK[bar]) kick(ctx, drums, at(base + h.step) + human(base + h.step, 1), h.vel, click);
    for (const h of SNARE[bar]) snare(ctx, drums, drumSend, at(base + h.step) + 0.006 + human(base + h.step, 2), h.vel, snareNoise);
    for (let s = 0; s < 16; s += 1) {
      const eighth = s % 2 === 0;
      const extra = (bar === 1 && s === 11) || (bar === 3 && (s === 7 || s === 15));
      if (!eighth && !extra) continue;
      const open = bar === 3 && s === 14;
      hat(ctx, drums, at(base + s) + human(base + s, 3), HAT_ACCENT[s] * (open ? 0.8 : 1), open, hatNoise);
    }
    for (const [step, len, note] of BASS[bar]) bassNote(ctx, bass, at(base + step) + 0.004, len * SIXTEENTH * 0.92, note);
    for (const [step, len, vel] of COMP) {
      // strum a hair: low to high
      CHORDS[bar].forEach((note, i) => {
        const t = at(base + step) + i * 0.007 + human(base + step + i, 4);
        epNote(ctx, keysL, t, len * SIXTEENTH, note, vel, -4);
        epNote(ctx, keysR, t + 0.003, len * SIXTEENTH, note, vel * 0.96, 5);
      });
    }
    // a lone high note answering in bar 2 and 4
    if (bar % 2 === 1) {
      const note = bar === 1 ? 69 : 68;
      epNote(ctx, keysL, at(base + 14), SIXTEENTH * 2.5, note, 0.45, -3);
      epNote(ctx, keysR, at(base + 14) + 0.003, SIXTEENTH * 2.5, note, 0.42, 4);
    }
  }

  const rendered = await ctx.startRendering();

  // level the mix: the loudest moment of all stems together at about -2 dBFS
  let peak = 0;
  const ch = [0, 1, 2, 3].map((c) => rendered.getChannelData(c));
  for (let i = 0; i < rendered.length; i += 2) {
    const l = Math.abs(ch[0][i] + ch[1][i] + ch[2][i]);
    const r = Math.abs(ch[0][i] + ch[1][i] + ch[3][i]);
    peak = Math.max(peak, l, r);
  }
  const gain = peak > 0 ? 0.78 / peak : 1;

  const drumsBuf = slice(rendered, 0, 1, loopLength, gain);
  const bassBuf = slice(rendered, 1, 1, loopLength, gain);
  const keysBuf = slice(rendered, 2, 2, loopLength, gain);
  return {
    duration: loopLength / sampleRate,
    stems: [
      { fwd: drumsBuf, rev: reversed(drumsBuf) },
      { fwd: bassBuf, rev: reversed(bassBuf) },
      { fwd: keysBuf, rev: reversed(keysBuf) },
    ],
    crackle: crackle(sampleRate),
  };
}
