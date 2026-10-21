// Without WebGL2: the same liquid drawn flat with Canvas 2D. The outline
// is the same profile (so it still stretches, necks and splits), filled in
// the ink tone, with the labels re-drawn inside it in the opposite tone.

import type { BarLayout } from "./layout";
import { css, type Room } from "./look";
import type { Profile } from "./profile";

export function draw2D(ctx: CanvasRenderingContext2D, dpr: number, width: number, height: number, bar: BarLayout, profile: Profile, room: Room, dark: number, family: string) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(bar.x, bar.y);
  const r = bar.height / 2;
  const channel = new Path2D();
  channel.roundRect(0, 0, bar.width, bar.height, r);
  ctx.fillStyle = css(room.floor);
  ctx.fill(channel);

  const labels = (colour: string) => {
    ctx.fillStyle = colour;
    ctx.font = `500 ${bar.font}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    bar.labels.forEach((label, i) => {
      const s = bar.slots[i];
      ctx.fillText(label, (s.x0 + s.x1) / 2, r + bar.font * 0.04);
    });
  };
  labels(css(room.label));

  // the drop's outline from its profile: along the top, back along the bottom
  const drop = new Path2D();
  const values = profile.values;
  const step = profile.step;
  let open = false;
  let start = 0;
  const close = (end: number) => {
    for (let j = end; j >= start; j--) drop.lineTo(profile.origin + j * step, r + Math.max(0, values[j]));
    drop.closePath();
  };
  for (let i = 0; i < profile.count; i++) {
    const v = values[i];
    const x = profile.origin + i * step;
    if (v > 0) {
      if (!open) {
        drop.moveTo(x, r);
        open = true;
        start = i;
      }
      drop.lineTo(x, r - v);
    } else if (open) {
      drop.lineTo(x, r);
      close(i - 1);
      open = false;
    }
  }
  if (open) close(profile.count - 1);

  const ink = dark > 0.5 ? "rgb(232 232 232)" : "rgb(20 20 20)";
  ctx.fillStyle = ink;
  ctx.fill(drop);
  ctx.save();
  ctx.clip(drop);
  labels(css(room.onInk));
  ctx.restore();
  ctx.restore();
}
