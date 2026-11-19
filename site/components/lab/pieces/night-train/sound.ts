// Sounds for the night train, made on the spot on the lab's shared audio
// graph (components/lab/audio.ts). Nothing plays until a press or a key on
// the stage has created the context, and the lab-wide mute silences all of
// it. Everything is heard from the river bank, about ninety metres short
// of the viaduct: soft, a little dull, with the valley's echo.
//
// - horn: a two-tone horn from inside the tunnel when a train is sent,
//   muffled by the hill, with the valley answering a quarter second later.
// - beat: one wheel over one rail joint. Two axles of a bogie make the
//   "clack-clack"; the timetable reports each one with where in the frame
//   it fell, so the rhythm stays exact whatever the frame rate.
// - Valley: a continuous bed: the river, the train's low rumble while one
//   is out on the viaduct (louder and brighter in the middle, where it is
//   nearest), and crickets once it is dark.

import { getAudio, isMuted, noiseBuffer, type AudioKit } from "../../audio";

function panner(ctx: AudioContext, pan: number): StereoPannerNode | null {
  if (typeof ctx.createStereoPanner !== "function") return null;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-0.85, Math.min(0.85, pan));
  return p;
}

function ready(): AudioKit | null {
  const kit = getAudio();
  if (!kit || kit.ctx.state !== "running" || isMuted()) return null;
  return kit;
}

/**
 * The horn of a train leaving the tunnel on the left (pan −1) or right
 * (+1). The first press may still be resuming the context: then it sounds
 * once that is done.
 */
export function horn(pan: number, delay = 0.35) {
  const kit = getAudio();
  if (!kit || isMuted() || kit.ctx.state === "closed") return;
  if (kit.ctx.state !== "running") {
    void kit.ctx
      .resume()
      .then(() => {
        if (kit.ctx.state === "running" && !isMuted()) playHorn(kit, pan, delay);
      })
      .catch(() => {});
    return;
  }
  playHorn(kit, pan, delay);
}

function playHorn(kit: AudioKit, pan: number, delay: number) {
  const { ctx, output } = kit;
  const t0 = ctx.currentTime + delay;
  const out = panner(ctx, pan * 0.7);
  const dest: AudioNode = out ? (out.connect(output), out) : output;
  // muffled by the tunnel, and a soft echo off the far side of the valley
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 1150;
  tone.Q.value = 0.6;
  const dry = ctx.createGain();
  dry.gain.value = 0.11;
  tone.connect(dry).connect(dest);
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.27;
  const echoTone = ctx.createBiquadFilter();
  echoTone.type = "lowpass";
  echoTone.frequency.value = 650;
  const echoGain = ctx.createGain();
  echoGain.gain.value = 0.045;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  tone.connect(echo);
  echo.connect(echoTone).connect(echoGain).connect(output);
  echoTone.connect(feedback).connect(echo);

  // high, then low: two notes a minor third apart
  const notes: Array<[number, number, number]> = [
    [0, 0.46, 370],
    [0.52, 0.7, 311],
  ];
  for (const [at, len, f] of notes) {
    const start = t0 + at;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(1, start + 0.07);
    g.gain.setValueAtTime(1, start + len - 0.12);
    g.gain.linearRampToValueAtTime(0, start + len);
    g.connect(tone);
    for (const detune of [-6, 5]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f * 1.012, start);
      o.frequency.exponentialRampToValueAtTime(f, start + 0.12);
      o.detune.value = detune;
      const og = ctx.createGain();
      og.gain.value = 0.5;
      o.connect(og).connect(g);
      o.start(start);
      o.stop(start + len + 0.05);
    }
    // a fifth below, faint: the second trumpet of the horn
    const sub = ctx.createOscillator();
    sub.type = "square";
    sub.frequency.value = f * 0.5;
    const sg = ctx.createGain();
    sg.gain.value = 0.12;
    sub.connect(sg).connect(g);
    sub.start(start);
    sub.stop(start + len + 0.05);
  }
  // let the echo ring out, then drop the graph
  window.setTimeout(() => {
    try {
      feedback.disconnect();
      echo.disconnect();
      out?.disconnect();
    } catch {}
  }, (delay + 3.5) * 1000);
}

/**
 * One wheel over a joint at audio time `when`. `level` 0..1 (distance and
 * the tunnel already folded in), `muffle` 0 open air … 1 deep in the hill.
 */
export function beat(when: number, pan: number, level: number, muffle: number, lead: boolean) {
  const kit = ready();
  if (!kit || level < 0.01) return;
  const { ctx, output } = kit;
  const t = Math.max(ctx.currentTime + 0.005, when);
  const out = panner(ctx, pan);
  const dest: AudioNode = out ? (out.connect(output), out) : output;
  const g0 = level * (lead ? 1 : 0.8);

  // the clack: a few ms of filtered noise
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.playbackRate.value = 0.9 + Math.random() * 0.2;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = (lead ? 1900 : 1650) * (1 - 0.55 * muffle);
  band.Q.value = 1.4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.09 * g0, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  noise.connect(band).connect(g).connect(dest);
  noise.start(t, Math.random() * 0.6, 0.07);

  // the thud of the wheel landing
  const thud = ctx.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(92, t);
  thud.frequency.exponentialRampToValueAtTime(48, t + 0.06);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0, t);
  tg.gain.linearRampToValueAtTime(0.12 * g0, t + 0.003);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  thud.connect(tg).connect(dest);
  thud.start(t);
  thud.stop(t + 0.11);
}

/** The continuous sounds of the valley: river, rumble, crickets. */
export class Valley {
  private kit: AudioKit | null = null;
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private river: GainNode | null = null;
  private rumble: GainNode | null = null;
  private rumbleTone: BiquadFilterNode | null = null;
  private rumblePan: StereoPannerNode | null = null;
  private nextChirp = 0;
  playing = false;

  start(kit: AudioKit) {
    if (this.playing) return;
    this.kit = kit;
    const { ctx, output } = kit;
    const now = ctx.currentTime;
    const buffer = noiseBuffer(ctx, 2);

    // the river: brown-ish noise, low and steady
    const rs = ctx.createBufferSource();
    rs.buffer = buffer;
    rs.loop = true;
    const rl = ctx.createBiquadFilter();
    rl.type = "lowpass";
    rl.frequency.value = 520;
    const rh = ctx.createBiquadFilter();
    rh.type = "highpass";
    rh.frequency.value = 90;
    const river = ctx.createGain();
    river.gain.setValueAtTime(0, now);
    river.gain.linearRampToValueAtTime(0.016, now + 2.5);
    rs.connect(rl).connect(rh).connect(river).connect(output);
    rs.start(now, Math.random());

    // the train's rumble: low noise, opened up while a train is near
    const ts = ctx.createBufferSource();
    ts.buffer = buffer;
    ts.loop = true;
    ts.playbackRate.value = 0.7;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 160;
    tone.Q.value = 0.9;
    const rumble = ctx.createGain();
    rumble.gain.value = 0;
    const pan = panner(ctx, 0);
    ts.connect(tone).connect(rumble);
    if (pan) rumble.connect(pan).connect(output);
    else rumble.connect(output);
    ts.start(now, Math.random());

    this.river = river;
    this.rumble = rumble;
    this.rumbleTone = tone;
    this.rumblePan = pan;
    this.sources = [rs, ts];
    this.nodes = [rl, rh, river, tone, rumble, ...(pan ? [pan] : [])];
    this.nextChirp = now + 1;
    this.playing = true;
  }

  /**
   * Per frame: `train` 0..1 how loud the rumble is (nearness), `pan` where
   * it is, `night` 0..1 for the crickets.
   */
  update(train: number, pan: number, night: number) {
    const kit = this.kit;
    if (!this.playing || !kit) return;
    const { ctx, output } = kit;
    const now = ctx.currentTime;
    this.rumble?.gain.setTargetAtTime(0.11 * train, now, 0.12);
    this.rumbleTone?.frequency.setTargetAtTime(120 + 160 * train, now, 0.2);
    this.rumblePan?.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, pan)), now, 0.15);
    // crickets: a few short chirps at a time, here and there, once it is dark
    if (night > 0.25 && now >= this.nextChirp) {
      const pulses = 2 + Math.floor(Math.random() * 3);
      const f = 4300 + Math.random() * 600;
      const out = panner(ctx, Math.random() * 1.6 - 0.8);
      const dest: AudioNode = out ? (out.connect(output), out) : output;
      const level = 0.006 * night * (0.5 + Math.random() * 0.5);
      for (let i = 0; i < pulses; i++) {
        const t = now + 0.02 + i * 0.045;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(level, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        o.connect(g).connect(dest);
        o.start(t);
        o.stop(t + 0.04);
      }
      this.nextChirp = now + 0.35 + Math.random() * 0.9 / (0.4 + night);
    }
  }

  stop() {
    if (!this.playing || !this.kit) return;
    const { ctx } = this.kit;
    const now = ctx.currentTime;
    this.river?.gain.cancelScheduledValues(now);
    this.river?.gain.setTargetAtTime(0, now, 0.15);
    this.rumble?.gain.cancelScheduledValues(now);
    this.rumble?.gain.setTargetAtTime(0, now, 0.1);
    const sources = this.sources;
    const nodes = this.nodes;
    window.setTimeout(() => {
      for (const s of sources) {
        try {
          s.stop();
          s.disconnect();
        } catch {}
      }
      for (const n of nodes) {
        try {
          n.disconnect();
        } catch {}
      }
    }, 700);
    this.sources = [];
    this.nodes = [];
    this.river = this.rumble = null;
    this.rumbleTone = null;
    this.rumblePan = null;
    this.playing = false;
  }
}
