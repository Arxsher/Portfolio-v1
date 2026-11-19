// The bubbles' world, in CSS px (y down): each bubble a soft body that rises
// on warm breath then slowly sinks, drifts on the air the pointer pushes,
// bounces off the walls and off each other, wobbles in two shape modes and
// pops (a hole spreading over 0.16 s, then a spray of droplets).

export type Bubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Still on the wand (follows the pointer, growing). */
  held: boolean;
  /** Wobble: amplitudes and their speeds for the 2- and 3-lobed modes, and their slow turn. */
  a2: number;
  a3: number;
  v2: number;
  v3: number;
  p2: number;
  p3: number;
  seed: number;
  age: number;
  life: number;
  /** -1 whole; 0…1 bursting. */
  pop: number;
  popAngle: number;
};

export type Drop = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number };

export const MAX_BUBBLES = 28;
const MAX_DROPS = 220;

export class Froth {
  bubbles: Bubble[] = [];
  drops: Drop[] = [];
  w = 1;
  h = 1;
  /** Air pushed by the pointer: where (CSS px), its velocity (px / s), how much (0…1). */
  air = { x: 0, y: 0, vx: 0, vy: 0, on: 0 };
  /** A steady breeze from the keyboard (px / s), easing away. */
  breeze = { x: 0, y: 0 };
  /** Bubbles that burst this step (radius), for the sound. */
  popped: number[] = [];
  time = 0;
  private nextSeed = 1;

  resize(w: number, h: number) {
    const sx = this.w > 1 ? w / this.w : 1;
    const sy = this.h > 1 ? h / this.h : 1;
    for (const b of this.bubbles) {
      b.x *= sx;
      b.y *= sy;
    }
    this.w = w;
    this.h = h;
  }

  /** The biggest a bubble grows on the wand. */
  maxRadius() {
    return Math.max(26, Math.min(this.w, this.h) * 0.17);
  }

  spawn(x: number, y: number, r: number, vx = 0, vy = 0, held = false): Bubble {
    if (this.bubbles.length >= MAX_BUBBLES) {
      // make room: the oldest free bubble goes
      const old = this.bubbles.find((b) => !b.held && b.pop < 0);
      if (old) this.burst(old);
    }
    const b: Bubble = {
      x,
      y,
      vx,
      vy,
      r,
      held,
      a2: 0.06,
      a3: 0.03,
      v2: 0,
      v3: 0,
      p2: Math.random() * 6.28,
      p3: Math.random() * 6.28,
      seed: (this.nextSeed++ * 0.6180339) % 1,
      age: 0,
      life: 14 + Math.random() * 16,
      pop: -1,
      popAngle: 0,
    };
    this.bubbles.push(b);
    return b;
  }

  /** The topmost whole bubble under (x, y), or null. */
  at(x: number, y: number): Bubble | null {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b.pop >= 0) continue;
      if (Math.hypot(x - b.x, y - b.y) < b.r * 1.05) return b;
    }
    return null;
  }

  /** Start a bubble bursting, from the side nearest (x, y) if given. */
  burst(b: Bubble, x?: number, y?: number) {
    if (b.pop >= 0) return;
    b.pop = 0;
    b.held = false;
    b.popAngle = x !== undefined && y !== undefined ? Math.atan2(b.y - y, x - b.x) : Math.random() * Math.PI * 2;
    this.popped.push(b.r);
  }

  /** Kick a bubble's wobble (a bump, a wall, a gust). */
  private kick(b: Bubble, amount: number) {
    b.v2 += amount * (0.7 + 0.6 * Math.sin(b.seed * 40 + this.time));
    b.v3 += amount * 0.6 * (0.7 + 0.6 * Math.cos(b.seed * 31 + this.time));
  }

  step(dt: number, reduced: boolean) {
    this.time += dt;
    const { w, h, air, breeze } = this;
    const list = this.bubbles;

    for (const b of list) {
      if (b.pop >= 0) {
        b.pop += dt / 0.16;
        continue;
      }
      b.age += dt;
      if (!b.held && b.age > b.life) this.burst(b);
      // the wobble rings down faster in small bubbles
      const omega = Math.min(40, 15 * Math.pow(40 / Math.max(8, b.r), 1.3));
      const zeta = 0.14;
      for (const [a, v] of [
        ["a2", "v2"],
        ["a3", "v3"],
      ] as const) {
        const k = a === "a2" ? omega : omega * 1.6;
        b[v] += (-k * k * b[a] - 2 * zeta * k * b[v]) * dt;
        b[a] += b[v] * dt;
        b[a] = Math.max(-0.18, Math.min(0.18, b[a]));
      }
      b.p2 += dt * 0.35;
      b.p3 -= dt * 0.5;
      if (b.held || reduced) continue;

      // warm breath lifts it at first, then it sinks slowly
      const lift = 90 * Math.exp(-b.age / 1.6);
      b.vy += (16 - lift) * dt;
      b.vx += Math.sin(this.time * 0.4 + b.seed * 9) * 6 * dt;
      // the air the pointer pushes
      if (air.on > 0) {
        const dx = b.x - air.x;
        const dy = b.y - air.y;
        const reach = 70 + b.r * 1.5;
        const fall = Math.exp(-(dx * dx + dy * dy) / (reach * reach)) * air.on;
        if (fall > 0.002) {
          b.vx += (air.vx - b.vx) * fall * Math.min(1, dt * 6);
          b.vy += (air.vy - b.vy) * fall * Math.min(1, dt * 6);
          this.kick(b, fall * Math.hypot(air.vx, air.vy) * 0.0006);
        }
      }
      b.vx += breeze.x * dt * 1.5;
      b.vy += breeze.y * dt * 1.5;
      const drag = Math.exp(-dt * (0.55 + 6 / b.r));
      b.vx *= drag;
      b.vy *= drag;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // walls: soft bounces off the sides and the top; the floor pops it
      if (b.x < b.r) {
        b.x = b.r;
        if (b.vx < 0) {
          this.kick(b, -b.vx * 0.004);
          b.vx = -b.vx * 0.45;
        }
      } else if (b.x > w - b.r) {
        b.x = w - b.r;
        if (b.vx > 0) {
          this.kick(b, b.vx * 0.004);
          b.vx = -b.vx * 0.45;
        }
      }
      if (b.y < b.r) {
        b.y = b.r;
        if (b.vy < 0) {
          this.kick(b, -b.vy * 0.004);
          b.vy = -b.vy * 0.45;
        }
      } else if (b.y > h - b.r * 0.92) {
        this.burst(b, b.x, h);
      }
    }

    // bubbles bump off each other
    if (!reduced) {
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        if (a.pop >= 0) continue;
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j];
          if (b.pop >= 0) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = (a.r + b.r) * 0.98;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 < 1e-6) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const overlap = min - d;
          // the lighter (smaller) bubble gives way more; a held one doesn't move
          const ma = a.held ? 0 : 1 / a.r;
          const mb = b.held ? 0 : 1 / b.r;
          const sum = ma + mb || 1;
          a.x -= nx * overlap * (ma / sum);
          a.y -= ny * overlap * (ma / sum);
          b.x += nx * overlap * (mb / sum);
          b.y += ny * overlap * (mb / sum);
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            const j2 = (-1.35 * rel) / sum;
            a.vx -= j2 * ma * nx;
            a.vy -= j2 * ma * ny;
            b.vx += j2 * mb * nx;
            b.vy += j2 * mb * ny;
            this.kick(a, -rel * 0.003);
            this.kick(b, -rel * 0.003);
          }
        }
      }
    }

    // bursts: when the hole is done, the film is a spray of droplets
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      if (b.pop < 1) continue;
      list.splice(i, 1);
      if (reduced) continue;
      const n = Math.round(8 + b.r * 0.25);
      for (let k = 0; k < n && this.drops.length < MAX_DROPS; k++) {
        const ang = b.popAngle + Math.PI + (Math.random() - 0.5) * 4.2;
        const speed = 90 + Math.random() * 220 + b.r * 1.5;
        this.drops.push({
          x: b.x + Math.cos(ang) * b.r * 0.85,
          y: b.y - Math.sin(ang) * b.r * 0.85,
          vx: Math.cos(ang) * speed + b.vx,
          vy: -Math.sin(ang) * speed + b.vy - 40,
          age: 0,
          life: 0.3 + Math.random() * 0.35,
          size: 1 + Math.random() * 1.4,
        });
      }
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.age += dt;
      if (d.age > d.life) {
        this.drops.splice(i, 1);
        continue;
      }
      d.vy += 700 * dt;
      d.vx *= Math.exp(-dt * 1.5);
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }

    // the keyboard's breeze dies away
    const k = Math.exp(-dt * 1.5);
    breeze.x *= k;
    breeze.y *= k;
    air.on *= Math.exp(-dt * 5);
  }

  /** Something still moving (the loop can sleep otherwise). */
  busy() {
    return this.bubbles.length > 0 || this.drops.length > 0;
  }
}
