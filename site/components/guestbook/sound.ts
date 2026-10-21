// One small sound for the guestbook: when your signature lands in its
// window, the light switches on (a soft click) and the glass rings once
// (two quiet sine partials, a fifth apart). Synthesised through the lab's
// shared audio graph, so the lab's mute applies, and only ever after the
// "Sign" press itself created or resumed the audio context (primeSound).

import { audioReady, ensureAudio, getAudio, noiseBuffer } from "@/components/lab/audio";

/** Call from the Sign button's gesture so the landing can make a sound later. */
export function primeSound() {
  ensureAudio();
}

export function lightOn() {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;

  // the switch
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 3200;
  band.Q.value = 1.4;
  const click = ctx.createGain();
  click.gain.setValueAtTime(0, now);
  click.gain.linearRampToValueAtTime(0.11, now + 0.002);
  click.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);
  noise.connect(band).connect(click).connect(output);
  noise.start(now, 0.1, 0.04);

  // the glass
  const ring = ctx.createGain();
  ring.gain.setValueAtTime(0, now + 0.012);
  ring.gain.linearRampToValueAtTime(0.045, now + 0.02);
  ring.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 4200;
  ring.connect(tone).connect(output);
  const partials: Array<[number, number]> = [
    [1318.5, 1],
    [1975.5, 0.45],
    [2637, 0.12],
  ];
  for (const [frequency, amp] of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.value = amp;
    osc.connect(gain).connect(ring);
    osc.start(now + 0.012);
    osc.stop(now + 1.2);
  }
}
