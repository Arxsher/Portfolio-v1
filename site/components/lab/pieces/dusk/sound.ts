// The sea, synthesised on the lab's shared audio graph (components/lab/
// audio.ts). It only starts from a press or a key on the picture (never
// from the trays), rolls in over about three seconds, fades out when the
// piece pauses, and the lab-wide mute silences it.
//
//   surf    two loops of noise, one each side, through low-pass filters.
//           Every six to nine seconds a swell is scheduled on one side: the
//           level and the filter rise as it comes in, a short fizz of
//           high noise as it breaks, then a long hiss back down.
//   gulls   now and then, while there is light, a distant call: a few
//           falling "kyow"s, a sawtooth through a formant band, panned out
//           to one side and softened with a little echo.

import { noiseBuffer, type AudioKit } from "../../audio";

type Side = {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  fizzFilter: BiquadFilterNode;
  fizz: GainNode;
};

const BED = 0.16; // the resting surf level (white noise, before a ~400 Hz low-pass)
const LOOKAHEAD = 2; // seconds of swells scheduled ahead
const FADE_IN = 2.8; // seconds for the sea to come in

export class Shore {
  private kit: AudioKit | null = null;
  private out: GainNode | null = null;
  private echo: { delay: DelayNode; feedback: GainNode; wet: GainNode } | null = null;
  private sides: Side[] = [];
  private timer = 0;
  private nextSwell = 0;
  private nextGull = 0;
  private side = 0;
  /** 0..1: how much daylight is left for gulls. */
  daylight = 1;

  get playing(): boolean {
    return Boolean(this.out);
  }

  start(kit: AudioKit) {
    if (this.out) return;
    const { ctx, output } = kit;
    this.kit = kit;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    // the sea rolls in over ~3 s rather than switching on: almost nothing
    // for the first beat, then a long rise (the first swell lands as it ends)
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(0.22, now + FADE_IN * 0.45);
    out.gain.linearRampToValueAtTime(1, now + FADE_IN);
    out.connect(output);
    this.out = out;

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.23;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 2200;
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(wet).connect(out);
    this.echo = { delay, feedback, wet };

    const buffer = noiseBuffer(ctx, 4);
    this.sides = [-0.55, 0.55].map((pan, i) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = i ? 0.93 : 1;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;
      filter.Q.value = 0.4;
      const gain = ctx.createGain();
      gain.gain.value = BED;
      const fizzFilter = ctx.createBiquadFilter();
      fizzFilter.type = "bandpass";
      fizzFilter.frequency.value = 5200;
      fizzFilter.Q.value = 0.6;
      const fizz = ctx.createGain();
      fizz.gain.value = 0;
      let node: AudioNode = out;
      if (typeof ctx.createStereoPanner === "function") {
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        panner.connect(out);
        node = panner;
      }
      source.connect(filter).connect(gain).connect(node);
      source.connect(fizzFilter).connect(fizz).connect(node);
      source.start(now, i * 1.7);
      return { source, filter, gain, fizzFilter, fizz };
    });

    this.nextSwell = now + FADE_IN * 0.5;
    this.nextGull = now + 4 + Math.random() * 6;
    this.tick();
  }

  private tick = () => {
    const kit = this.kit;
    if (!kit || !this.out) return;
    const now = kit.ctx.currentTime;
    while (this.nextSwell < now + LOOKAHEAD) {
      this.swell(this.nextSwell);
      this.nextSwell += 5.8 + Math.random() * 3.2;
    }
    if (now > this.nextGull) {
      if (this.daylight > 0.25 && Math.random() < 0.8) this.gull(now + 0.05, this.daylight);
      this.nextGull = now + 9 + Math.random() * 13;
    }
    this.timer = window.setTimeout(this.tick, 400);
  };

  /** One swell coming in on alternate sides. */
  private swell(at: number) {
    const s = this.sides[this.side];
    this.side = 1 - this.side;
    if (!s) return;
    const peak = BED * (2.4 + Math.random() * 1.1);
    s.gain.gain.setTargetAtTime(peak, at, 0.85);
    s.filter.frequency.setTargetAtTime(1100 + Math.random() * 500, at, 0.8);
    s.gain.gain.setTargetAtTime(BED, at + 1.9, 1.5);
    s.filter.frequency.setTargetAtTime(380, at + 1.9, 1.7);
    s.fizz.gain.setTargetAtTime(0.045 + Math.random() * 0.025, at + 1.5, 0.25);
    s.fizz.gain.setTargetAtTime(0, at + 2.1, 0.9);
  }

  private gull(at: number, level: number) {
    const kit = this.kit;
    const out = this.out;
    if (!kit || !out || !this.echo) return;
    const { ctx } = kit;
    const pan = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.45);
    let dest: AudioNode = out;
    if (typeof ctx.createStereoPanner === "function") {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      panner.connect(out);
      panner.connect(this.echo.delay);
      dest = panner;
    }
    const calls = 2 + Math.floor(Math.random() * 3);
    const base = 1180 + Math.random() * 260;
    const gain = 0.05 * level;
    for (let i = 0; i < calls; i++) {
      const t = at + i * (0.2 + Math.random() * 0.05);
      const f0 = base * (1 - i * 0.035);
      const last = i === calls - 1;
      const length = last ? 0.32 : 0.17;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f0 * 0.72, t);
      osc.frequency.exponentialRampToValueAtTime(f0, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(f0 * (last ? 0.55 : 0.68), t + length);
      const vib = ctx.createOscillator();
      vib.frequency.value = 26;
      const vibDepth = ctx.createGain();
      vibDepth.gain.value = f0 * 0.012;
      vib.connect(vibDepth).connect(osc.frequency);
      const formant = ctx.createBiquadFilter();
      formant.type = "bandpass";
      formant.frequency.value = 2100;
      formant.Q.value = 2.2;
      const soft = ctx.createBiquadFilter();
      soft.type = "lowpass";
      soft.frequency.value = 3200;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(gain, t + 0.025);
      env.gain.setTargetAtTime(gain * 0.7, t + 0.05, 0.06);
      env.gain.setTargetAtTime(0, t + length - 0.05, 0.04);
      osc.connect(formant).connect(soft).connect(env).connect(dest);
      osc.start(t);
      vib.start(t);
      osc.stop(t + length + 0.3);
      vib.stop(t + length + 0.3);
    }
  }

  /** Fade out and release everything. */
  stop() {
    const kit = this.kit;
    const out = this.out;
    window.clearTimeout(this.timer);
    this.timer = 0;
    if (!kit || !out) return;
    const sides = this.sides;
    const echo = this.echo;
    this.out = null;
    this.sides = [];
    this.echo = null;
    const now = kit.ctx.currentTime;
    // from wherever the fade-in had got to, without a jump
    if (typeof out.gain.cancelAndHoldAtTime === "function") {
      out.gain.cancelAndHoldAtTime(now);
    } else {
      const level = out.gain.value;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(level, now);
    }
    out.gain.setTargetAtTime(0, now, 0.25);
    window.setTimeout(() => {
      for (const s of sides) {
        try {
          s.source.stop();
        } catch {}
        s.source.disconnect();
      }
      echo?.delay.disconnect();
      out.disconnect();
    }, 1400);
  }
}
