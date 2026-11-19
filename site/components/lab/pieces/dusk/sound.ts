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
//   bell    after dark, a bell buoy far out rings once or twice as it rocks:
//           a handful of inharmonic partials with long, uneven decays.
//   lamp    when the lighthouse strikes: a relay's low thunk, the tick of
//           each flicker (timed to the picture's), and a faint glassy ring.

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
  private nextBell = 0;
  private side = 0;
  private buffer: AudioBuffer | null = null;
  /** 0..1: how much daylight is left for gulls. */
  daylight = 1;
  /** 0..1: how dark it is (the bell buoy only rings at night). */
  night = 0;

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
    this.buffer = buffer;
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
    this.nextBell = now + 2.5 + Math.random() * 4;
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
    if (now > this.nextBell) {
      if (this.night > 0.5 && Math.random() < 0.75) this.bell(now + 0.05, this.night);
      this.nextBell = now + 10 + Math.random() * 12;
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

  /** A bell buoy far out, rocked by the swell: one strike, sometimes a second, softer. */
  private bell(at: number, level: number) {
    const kit = this.kit;
    const out = this.out;
    if (!kit || !out || !this.echo) return;
    const { ctx } = kit;
    let dest: AudioNode = out;
    if (typeof ctx.createStereoPanner === "function") {
      const panner = ctx.createStereoPanner();
      panner.pan.value = (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.4);
      panner.connect(out);
      panner.connect(this.echo.delay);
      dest = panner;
    }
    const soft = ctx.createBiquadFilter();
    soft.type = "lowpass";
    soft.frequency.value = 2600;
    soft.connect(dest);
    const f0 = 410 + Math.random() * 40;
    // partial ratio, level, decay (s): a hum, the strike note, a minor third, a fifth, the octave, a high shimmer
    const partials = [
      [0.5, 0.45, 3.4],
      [1, 1, 2.6],
      [1.19, 0.4, 2.1],
      [1.5, 0.32, 1.7],
      [2, 0.28, 1.3],
      [2.74, 0.14, 0.8],
    ] as const;
    const strikes = Math.random() < 0.55 ? 2 : 1;
    for (let k = 0; k < strikes; k++) {
      const t = at + k * (0.5 + Math.random() * 0.35);
      const amp = 0.016 * level * (k ? 0.55 : 1);
      for (const [ratio, gain, decay] of partials) {
        const osc = ctx.createOscillator();
        osc.frequency.value = f0 * ratio * (1 + (Math.random() - 0.5) * 0.002);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(amp * gain, t + 0.004);
        env.gain.setTargetAtTime(0, t + 0.006, decay / 3);
        osc.connect(env).connect(soft);
        osc.start(t);
        osc.stop(t + decay * 1.6);
      }
    }
  }

  /**
   * The lamp striking (call it as the picture's lamp comes on): a relay's
   * low thunk, a tick for each flicker of the picture's ignition curve and
   * a faint ring of glass. Only while the sea is playing; mute applies.
   */
  strike() {
    const kit = this.kit;
    if (!kit || !this.out || !this.buffer) return;
    const { ctx, output } = kit;
    const t = ctx.currentTime + 0.005;
    const bus = ctx.createGain();
    bus.gain.value = 0.9;
    bus.connect(output);
    // the thunk
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(52, t + 0.13);
    const thunk = ctx.createGain();
    thunk.gain.setValueAtTime(0, t);
    thunk.gain.linearRampToValueAtTime(0.13, t + 0.005);
    thunk.gain.setTargetAtTime(0, t + 0.02, 0.045);
    osc.connect(thunk).connect(bus);
    osc.start(t);
    osc.stop(t + 0.4);
    // the ticks, on the flickers of look.ts's ignition(): 0, 0.11 and 0.24 s
    for (const [dt, level] of [
      [0, 1],
      [0.11, 0.55],
      [0.24, 0.4],
    ] as const) {
      const src = ctx.createBufferSource();
      src.buffer = this.buffer;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 2600 + Math.random() * 900;
      band.Q.value = 1.4;
      const env = ctx.createGain();
      const at = t + dt;
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(0.11 * level, at + 0.0015);
      env.gain.setTargetAtTime(0, at + 0.003, 0.006);
      src.connect(band).connect(env).connect(bus);
      src.start(at, Math.random() * 3, 0.06);
    }
    // the glass, ringing faintly as the lamp warms
    for (const [freq, level] of [
      [2793, 1],
      [4186, 0.5],
    ] as const) {
      const ring = ctx.createOscillator();
      ring.frequency.value = freq;
      const env = ctx.createGain();
      const at = t + 0.26;
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(0.006 * level, at + 0.01);
      env.gain.setTargetAtTime(0, at + 0.02, 0.35);
      ring.connect(env).connect(bus);
      ring.start(at);
      ring.stop(at + 1.6);
    }
    window.setTimeout(() => bus.disconnect(), 2200);
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
    this.buffer = null;
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
