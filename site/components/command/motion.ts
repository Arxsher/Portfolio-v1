// Motion for the command bar, tuned against frame-by-frame recordings of
// the reference dock:
//
//   width     300 → 540px, CSS transition 240ms on the ease-out curve
//   height    a spring that starts one frame after the width: soft when
//             the panel grows or changes size (stiffness 1300, damping 70:
//             about 300ms, no overshoot), stiffer when it folds away
//             (4400 / 195: about 220ms)
//   views     the new view fades in over 190ms, the old one out over 110ms
//   esc ↔ /   280ms swap on the swap curve: opacity, blur 4px, scale .25

export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

export const VIEW_IN_MS = 190;
export const VIEW_OUT_MS = 110;

export type SpringConfig = { stiffness: number; damping: number };

export const SPRING_GROW: SpringConfig = { stiffness: 1300, damping: 70 };
export const SPRING_FOLD: SpringConfig = { stiffness: 4400, damping: 195 };

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Drives one numeric style value (the panel height) with a damped spring.
 * Retargeting mid-flight keeps the current velocity, so a panel that is
 * still opening glides into its next size instead of restarting.
 */
export class Spring {
  private value = 0;
  private velocity = 0;
  private target = 0;
  private config: SpringConfig = SPRING_GROW;
  private frame = 0;
  private last = 0;

  constructor(private readonly apply: (value: number) => void) {}

  get current() {
    return this.value;
  }

  /** Jump without animating. */
  set(value: number) {
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.apply(value);
  }

  /**
   * Head for `target`. `from` is when the motion counts as started (a frame
   * timestamp), so the first step covers a whole frame however late in that
   * frame the call came; it defaults to now.
   */
  to(target: number, config: SpringConfig, from = performance.now()) {
    this.target = target;
    this.config = config;
    if (this.frame) return;
    this.last = from;
    this.frame = requestAnimationFrame(this.tick);
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private tick = (now: number) => {
    // Integrate in 1ms steps; cap a long frame so a background tab does not explode.
    let dt = Math.min(now - this.last, 64);
    this.last = now;
    const { stiffness, damping } = this.config;
    while (dt > 0) {
      const step = Math.min(dt, 1) / 1000;
      const force = -stiffness * (this.value - this.target) - damping * this.velocity;
      this.velocity += force * step;
      this.value += this.velocity * step;
      dt -= 1;
    }
    const settled = Math.abs(this.value - this.target) < 0.4 && Math.abs(this.velocity) < 4;
    if (settled) {
      this.value = this.target;
      this.velocity = 0;
      this.frame = 0;
      this.apply(this.value);
      return;
    }
    this.apply(this.value);
    this.frame = requestAnimationFrame(this.tick);
  };
}
