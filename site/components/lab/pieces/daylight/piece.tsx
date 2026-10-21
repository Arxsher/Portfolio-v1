"use client";

// Daylight switch: a light / dark switch with a small world in its track.
//
// The look
// - A pill-shaped window, recessed (an inner shadow, a faint glass sheen)
//   into whatever it sits on, with a pearl knob floating over it. In the
//   window, a paper-cut landscape in the site's restrained manner: a sky in
//   four bands, three ridges that lean to the sky colour with distance, a
//   sun with a soft corona, clouds, and on the bigger switches a cabin on
//   the middle ridge, pines, a lake in the valley, birds.
// - The hour is the knob's place along the track. Light end: mid-afternoon,
//   the sun high on the free side. Toward the dark end the sun arcs down
//   and sets behind the far ridge, the sky goes gold, then rose, then blue,
//   the evening star shows over the sunset, the cabin's windows light one
//   after the other, the moon rises from behind the hills on the other side
//   (its crescent lit from where the sun went), the stars come out in order
//   of brightness, the Milky Way and fireflies follow. Ridges slide a little
//   at different rates (parallax), so the land has depth as the knob moves.
// - The knob is lit by the scene: its highlight and warm side face the sun,
//   later the moon; its shadow on the landscape swings and lengthens as the
//   sun goes down; it reflects the sky above and the land below.
//
// The motion (model.ts has the detail)
// - One spring on the knob's position; the scene is a pure function of it,
//   so dragging is exact and every animation is interruptible: grab the
//   knob mid-flight and it stays under the finger.
// - Flick: the release velocity is projected forward to choose the end and
//   handed to the spring. The spring's small overshoot is drawn as the knob
//   squashing against the end of the track, not as travel. Pressing widens
//   the knob; speed stretches it a little along the track.
// - The "wow" second: drag slowly through the middle. The sun touches the
//   ridge, the sky flares gold and rose, the knob's shadow stretches long
//   across the hills, then the first star pings, the windows come on and
//   the moon lifts as you pass into the night; let go and the whole page
//   follows into dark mode as the knob lands (and the header switch, the
//   same component, plays its own little sunset in sync).
//
// Modes
// - Stage: the big switch (it sets the site theme unless "Site theme" is
//   off), the time of day under it, and the real header switch at actual
//   size beside, driven by the same model (drag either). Sound after a
//   gesture: a detent as the knob seats, faint ticks per hour while it
//   moves, a rising note for each of the first bright stars.
// - Tile: the switch on its own, flipping by itself every few seconds as if
//   tapped; under the mouse the knob leans toward the other end. Never
//   touches the site theme.
// - Reduced motion: the switch jumps to its end, nothing drifts or
//   twinkles, no automatic flipping on the tile (a still at the theme's end).
// - Frames: the loop runs while the piece is active. While the knob moves
//   every frame is drawn; at rest only the twinkle and drift change, so
//   every other frame is skipped (30 fps). The reduced-motion stage sleeps
//   once the knob rests. If a machine can't hold the frame rate while the
//   knob moves, the stage steps its pixel ratio down (2 → 1.5 → 1.25).
//   Nothing in the frame loop allocates beyond a few gradients; measured
//   in pure software raster, a stage frame costs about 17 ms at 2× and the
//   header switch under 1 ms (on a GPU-backed canvas, a fraction of that).

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { setTheme } from "@/lib/theme";
import { ensureAudio } from "../../audio";
import { useElementSize, useFinePointer, useFrame, useLatest } from "../../hooks";
import type { PieceProps, PieceTheme } from "../../types";
import { MuteButton, StageControls, StageHint, Toggle, Tray, TrayDivider } from "../../ui";
import { bindSwitch, useSwitchCanvas } from "./bind";
import { createExtras } from "./extras";
import { FEEL, SwitchModel, type Side } from "./model";
import { formatClock, minutesAt, phaseAt, rgbInto } from "./palette";
import { SwitchView } from "./render";
import { land, star, STAR_CUES, tick } from "./sound";

const sideOf = (theme: PieceTheme): Side => (theme === "dark" ? 1 : 0);

const css = `
.dl-object {
  box-shadow:
    0 0 0 0.5px rgb(0 0 0 / 0.05),
    0 1px 2px rgb(0 0 0 / 0.08),
    0 10px 24px -10px rgb(0 0 0 / 0.32),
    0 28px 56px -28px rgb(0 0 0 / 0.22);
}
.dark .dl-object {
  box-shadow:
    0 0 0 0.5px rgb(255 255 255 / 0.04),
    0 1px 2px rgb(0 0 0 / 0.5),
    0 12px 28px -10px rgb(0 0 0 / 0.75),
    0 30px 60px -28px rgb(0 0 0 / 0.6);
}
.dl-glow {
  background: radial-gradient(closest-side, var(--dl-glow, transparent), transparent);
}
.dl-switch { cursor: grab; }
.dl-switch[data-held] { cursor: grabbing; }
`;

function Styles() {
  return (
    <style href="lab-daylight" precedence="default">
      {css}
    </style>
  );
}

export default function Piece(props: PieceProps) {
  return props.mode === "stage" ? <Stage {...props} /> : <Tile {...props} />;
}

/* ---------------------------------------------------------------------- */
/* tile                                                                    */
/* ---------------------------------------------------------------------- */

function Tile({ active, reducedMotion, theme }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(rootRef);
  const [model] = useState(() => new SwitchModel(FEEL.tile, sideOf(theme)));
  const [view] = useState(() => new SwitchView("tile", createExtras("tile")));
  const clock = useRef(0);
  const rest = useRef(0);
  const home = sideOf(theme);

  model.reduced = reducedMotion;
  view.still = reducedMotion;

  const canvasRef = useSwitchCanvas(view, 1.5, () => view.draw(model, clock.current));

  const skip = useRef(false);

  const wake = useFrame(active, (dt, time) => {
    clock.current = time;
    if (!reducedMotion) {
      // flip by itself every few seconds, as if tapped; longer at the theme's end
      const resting = model.pending < 0 && Math.abs(model.pos.value - model.target) < 0.004;
      rest.current = resting ? rest.current + dt : 0;
      if (rest.current > (model.target === home ? 3 : 2.2)) {
        rest.current = 0;
        model.flip();
      }
    }
    const moving = model.step(dt);
    // at rest only the twinkle and drift move: half the frame rate is plenty
    skip.current = !moving && !skip.current;
    if (!skip.current) view.draw(model, time);
    return !reducedMotion || moving;
  });

  useEffect(() => {
    model.sync(home, !reducedMotion);
    if (reducedMotion) model.place(home);
    rest.current = 0;
    wake();
  }, [home, reducedMotion, model, wake]);

  const W = size.width;
  const H = size.height;
  const margin = Math.min(28, Math.max(14, W * 0.12));
  const sw = Math.max(40, Math.floor(Math.min(W - margin * 2, (H - margin * 2) * 2) / 2) * 2);
  const sh = sw / 2;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="absolute inset-0"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        model.hovering = true;
        wake();
      }}
      onPointerLeave={() => {
        model.hovering = false;
        wake();
      }}
    >
      <Styles />
      <div
        className="dl-object absolute overflow-hidden rounded-full"
        style={{
          left: Math.round((W - sw) / 2),
          top: Math.round((H - sh) / 2),
          width: sw,
          height: sh,
          visibility: W ? undefined : "hidden",
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

type StageLayout = { sw: number; sh: number; left: number; top: number; narrow: boolean };

function stageLayout(W: number, H: number): StageLayout {
  const narrow = W < 640;
  // the tray and the hint over it
  const controls = narrow ? 100 : 96;
  const caption = narrow ? 46 : 54;
  const budget = H - controls - caption - (narrow ? 24 : 56);
  // a little wider than the header's 2 : 1, so more of the land shows beside the knob
  const aspect = narrow ? 2 : 2.15;
  let sw = Math.min(W - (narrow ? 32 : 160), 660, budget * aspect);
  sw = Math.max(120, Math.round(sw));
  const sh = Math.round(sw / aspect);
  const top = Math.max(narrow ? 18 : 36, Math.round((H - controls - caption - sh) / 2));
  return { sw, sh, left: Math.round((W - sw) / 2), top, narrow };
}

const MINI_W = 56;
const MINI_H = 28;

function Stage({ active, reducedMotion, theme }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const size = useElementSize(rootRef);
  const fine = useFinePointer();
  const hintId = useId();

  const [model] = useState(() => new SwitchModel(FEEL.stage, sideOf(theme)));
  const [big] = useState(() => new SwitchView("stage", createExtras("stage")));
  const [mini] = useState(() => new SwitchView("compact"));
  const [linked, setLinked] = useState(true);
  // frame-time safety net: a machine that can't hold the frame rate while
  // the knob moves gets a lower pixel ratio (2 → 1.5 → 1.25), once each
  const [dprCap, setDprCap] = useState(2);
  const perf = useRef({ slow: 0, skip: false });
  const [night, setNight] = useState(theme === "dark");
  const [touched, setTouched] = useState(false);

  const clock = useRef(0);
  // per-frame bookkeeping for sound and the readout
  const track = useRef({ hour: -1, t: -1, phase: "", minute: -1, committed: sideOf(theme) as Side, glow: "" });
  const glowRgb = useRef<number[]>([0, 0, 0]);

  model.reduced = reducedMotion;
  big.still = reducedMotion;
  mini.still = reducedMotion;

  const draw = () => {
    big.draw(model, clock.current);
    mini.draw(model, clock.current);
  };
  const bigCanvas = useSwitchCanvas(big, dprCap, draw);
  const miniCanvas = useSwitchCanvas(mini, 3, draw);

  const wake = useFrame(active, (dt, time) => {
    clock.current = time;
    const moving = model.step(dt);
    const f = perf.current;
    if (moving) {
      f.slow = dt > 1 / 40 ? f.slow + dt : Math.max(0, f.slow - dt * 0.5);
      if (f.slow > 0.8 && dprCap > 1.25) {
        f.slow = 0;
        setDprCap(dprCap > 1.5 ? 1.5 : 1.25);
      }
    }
    // at rest only the twinkle and drift move: half the frame rate is plenty
    f.skip = !moving && !f.skip;
    if (!f.skip) {
      big.draw(model, time);
      mini.draw(model, time);
    }
    readout(moving);
    return !reducedMotion || moving;
  });

  /** The caption, the ambient glow, sound cues and aria state, all from the model. */
  function readout(moving: boolean) {
    const s = track.current;
    const t = model.t;
    if (t !== s.t) {
      // a tick per hour the evening passes, a note for each star that comes out
      const minutes = minutesAt(t);
      const hour = Math.floor(minutes / 60);
      if (s.t >= 0 && moving) {
        if (hour !== s.hour) tick();
        if (t > s.t) {
          for (let i = 0; i < STAR_CUES.length; i++) {
            if (s.t < STAR_CUES[i] && t >= STAR_CUES[i]) star(i);
          }
        }
      }
      s.hour = hour;
      const minute = Math.floor(minutes);
      if (minute !== s.minute && clockRef.current) {
        s.minute = minute;
        clockRef.current.textContent = formatClock(minutes);
      }
      const phase = phaseAt(t);
      if (phase !== s.phase && phaseRef.current) {
        s.phase = phase;
        phaseRef.current.textContent = phase;
      }
      // the light the switch throws on the stage: the horizon's colour, soft
      const glow = glowRef.current;
      if (glow) {
        const rgb = glowRgb.current;
        rgbInto("horizon", t, rgb);
        const strength = 0.16 + 0.14 * big.scene.golden + 0.06 * big.scene.glow;
        const value = `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${strength.toFixed(3)})`;
        if (value !== s.glow) {
          s.glow = value;
          glow.style.setProperty("--dl-glow", value);
        }
      }
      s.t = t;
    }
    if (model.committed !== s.committed) {
      s.committed = model.committed;
      setNight(model.committed === 1);
    }
    const element = switchRef.current;
    if (element) {
      const held = model.pointerHeld;
      if (held !== element.hasAttribute("data-held")) element.toggleAttribute("data-held", held);
    }
  }

  // commits set the site theme while linked
  useEffect(() => {
    model.onCommit = linked ? (side) => setTheme(side === 1 ? "dark" : "light") : null;
    model.onLand = (speed) => land(speed);
    return () => {
      model.onCommit = null;
      model.onLand = null;
    };
  }, [model, linked]);

  // the site theme changed (here, in the header, the palette, the OS): follow it while linked
  useEffect(() => {
    if (!linked) return;
    model.sync(sideOf(theme), true);
    wake();
  }, [theme, linked, model, wake]);

  useEffect(() => {
    wake();
  }, [reducedMotion, size.width, size.height, wake]);

  const input = useLatest({
    model,
    view: big,
    wake,
    onGesture: () => {
      ensureAudio();
      setTouched(true);
    },
  });
  const miniInput = useLatest({ model, view: mini, wake, keys: false, onGesture: input.current.onGesture });
  useEffect(() => {
    const element = switchRef.current;
    if (!element) return;
    return bindSwitch(element, () => input.current);
  }, [input]);
  useEffect(() => {
    const element = miniRef.current;
    if (!element) return;
    return bindSwitch(element, () => miniInput.current);
  }, [miniInput]);

  const layout = size.width ? stageLayout(size.width, size.height) : null;
  const l = layout ?? { sw: 0, sh: 0, left: 0, top: 0, narrow: false };

  const hint = fine ? "Drag the knob or click · flick it to throw it across" : "Drag the knob or tap · flick to throw it";

  return (
    <div ref={rootRef} className="absolute inset-0 select-none">
      <Styles />
      <div
        ref={glowRef}
        aria-hidden="true"
        className="dl-glow pointer-events-none absolute"
        style={{
          left: l.left - l.sw * 0.3,
          top: l.top - l.sh * 0.55,
          width: l.sw * 1.6,
          height: l.sh * 2.1,
          visibility: layout ? undefined : "hidden",
        }}
      />
      <div
        ref={switchRef}
        role="switch"
        tabIndex={0}
        aria-checked={night}
        aria-label={linked ? "Dark mode" : "Night"}
        aria-describedby={hintId}
        className="dl-switch dl-object absolute touch-pan-y rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        style={{
          left: l.left,
          top: l.top,
          width: l.sw,
          height: l.sh,
          visibility: layout ? undefined : "hidden",
        }}
      >
        <canvas ref={bigCanvas} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full rounded-full" />
      </div>

      <div
        aria-hidden="true"
        className="absolute flex items-center justify-between gap-3"
        style={{
          left: l.left + 4,
          width: l.sw - 8,
          top: l.top + l.sh + (l.narrow ? 16 : 22),
          visibility: layout ? undefined : "hidden",
        }}
      >
        <p className="flex min-w-0 items-baseline gap-1.5 text-[13px] leading-none whitespace-nowrap">
          <span ref={phaseRef} className="text-primary">
            {phaseAt(sideOf(theme))}
          </span>
          <span className="text-tertiary">·</span>
          <span ref={clockRef} className="text-secondary tabular-nums">
            {formatClock(minutesAt(sideOf(theme)))}
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2.5 text-[12px] leading-none text-tertiary">
          <span className={l.narrow ? "sr-only" : undefined}>Actual size</span>
          <span
            ref={miniRef}
            className="dl-switch relative block touch-pan-y rounded-full [-webkit-tap-highlight-color:transparent]"
            style={{ width: MINI_W, height: MINI_H }}
          >
            <canvas ref={miniCanvas} className="pointer-events-none absolute inset-0 size-full rounded-full" />
          </span>
        </div>
      </div>

      <p id={hintId} className="sr-only">
        A light and dark switch with a landscape inside. Drag the knob, or press Enter or Space, to switch; hold the
        left or right arrow to move the evening slowly, and let go to finish the switch.
        {linked ? " It sets this site's theme." : ""}
      </p>

      <StageControls placement="bottom">
        <Tray label="Switch settings">
          <Toggle label="Site theme" checked={linked} onChange={setLinked} />
          <TrayDivider />
          <MuteButton />
        </Tray>
        <StageHint className={cn("transition-opacity duration-700", touched && "opacity-0")}>{hint}</StageHint>
      </StageControls>
    </div>
  );
}
