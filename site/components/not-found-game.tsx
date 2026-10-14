"use client";

// The 404 page's little game: "Loose tiles". A Casablanca street cat trots
// along a strip of zellige and hops the stacks of loose glazed tiles that
// slide in faster and faster. Space, ↑, Enter or a tap hops.
//
//   ✦────────────────────────────────────────────
//   WHILE YOU'RE HERE
//   Mind the loose tiles
//   ┌ paper ───────────────────────────────┐   BEST RUNS HERE
//   │ RUNNER · AMINA                 0042  │   ──────────────────
//   │      🐈      ▪▪       ▪              │   1  Amina      0123
//   │ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆  │   2  Theo       0087
//   └──────────────────────────────────────┘
//   [ Your name        ] [✦ Start]
//
// There is no server: scores are kept in this browser (localStorage), and
// the ledger lists the best runs on this device. The game area turns the
// site's single-key shortcuts off (data-shortcuts="off") so its keys are
// its own.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Star, StarRule } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";
import { palette, type Palette } from "@/lib/palette";
import { useResolvedTheme } from "@/lib/theme";

/* ---------------------------------------------------------------------- */
/* tuning (CSS pixels and seconds)                                         */
/* ---------------------------------------------------------------------- */

const HEIGHT = 200;
const GROUND = 150; // y of the ground line
const RUNNER_X = 56;
const CAT_W = 24;
const CAT_H = 16;
const GRAVITY = 2600;
const JUMP_SPEED = 760; // takeoff speed: ~111px high, ~0.58s in the air
const SPEED_START = 300;
const SPEED_MAX = 660;
const SPEED_GAIN = 9; // px/s per second of running
const BUFFER = 0.12; // a hop pressed this long before landing still counts
const TILE = 10; // one glazed tile (9px + 1px grout)
const DIAMOND_GAP = 16; // the zellige strip under the ground line
const STORE_KEY = "arsher:404-runs";
const NAME_KEY = "arsher:404-name";
const MAX_RUNS = 10;
/** Wide boards draw the world larger, so the cat isn't lost on a desktop. */
const zoomFor = (cssWidth: number) => (cssWidth >= 600 ? 1.3 : 1);

type Stack = { x: number; cols: number; rows: number; tones: number[] };
type Run = { name: string; score: number; at: string };
type Phase = "idle" | "running" | "over";

type World = {
  width: number;
  y: number; // the cat's feet above the ground (0 = standing)
  vy: number;
  speed: number;
  distance: number;
  stacks: Stack[];
  nextGap: number;
  buffered: number; // time left on a buffered hop
  stride: number;
};

/* ---------------------------------------------------------------------- */
/* storage                                                                 */
/* ---------------------------------------------------------------------- */

function readRuns(): Run[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (run): run is Run =>
          run && typeof run.name === "string" && typeof run.score === "number" && typeof run.at === "string",
      )
      .slice(0, MAX_RUNS);
  } catch {
    return [];
  }
}

function saveRun(run: Run): Run[] {
  const runs = [...readRuns(), run].sort((a, b) => b.score - a.score).slice(0, MAX_RUNS);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(runs));
  } catch {
    // Private mode or storage off: the run still shows until the page closes.
  }
  return runs;
}

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}

/* ---------------------------------------------------------------------- */
/* world                                                                   */
/* ---------------------------------------------------------------------- */

const random = (min: number, max: number) => min + Math.random() * (max - min);

function tonesFor(cols: number, rows: number): number[] {
  return Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 3));
}

function freshWorld(width: number): World {
  return {
    width,
    y: 0,
    vy: 0,
    speed: SPEED_START * scaleFor(width),
    distance: 0,
    stacks: [],
    nextGap: width * 0.75,
    buffered: 0,
    stride: 0,
  };
}

/** Narrow boards get a slower world, so there is as much time to react. */
function scaleFor(width: number) {
  return Math.min(1, Math.max(0.68, width / 628));
}

/** The scene before a run: the cat waiting, two stacks ahead. */
function idleWorld(width: number): World {
  const world = freshWorld(width);
  world.stacks = [
    { x: width * 0.46, cols: 2, rows: 3, tones: [0, 1, 2, 0, 1, 2] },
    { x: width * 0.74, cols: 1, rows: 2, tones: [2, 0] },
  ];
  return world;
}

function spawnStack(world: World) {
  const hard = Math.min(1, world.distance / 9000);
  const cols = Math.random() < 0.4 + hard * 0.3 ? 2 : 1;
  const rows = Math.round(random(2, 3.4 + hard * 1.6));
  world.stacks.push({ x: world.width + 8, cols, rows, tones: tonesFor(cols, rows) });
  // Room to land and take off again, growing with the speed.
  const reach = world.speed * 0.62;
  world.nextGap = random(reach + 70, reach + 260 - hard * 80);
}

function step(world: World, dt: number): boolean {
  world.speed = Math.min(SPEED_MAX * scaleFor(world.width), world.speed + SPEED_GAIN * dt);
  const dx = world.speed * dt;
  world.distance += dx;
  world.stride += dt;

  // the cat
  if (world.y > 0 || world.vy > 0) {
    world.vy -= GRAVITY * dt;
    world.y += world.vy * dt;
    if (world.y <= 0) {
      world.y = 0;
      world.vy = 0;
      if (world.buffered > 0) world.vy = JUMP_SPEED;
    }
  }
  world.buffered = Math.max(0, world.buffered - dt);

  // the tiles
  for (const stack of world.stacks) stack.x -= dx;
  world.stacks = world.stacks.filter((stack) => stack.x + stack.cols * TILE > -10);
  world.nextGap -= dx;
  if (world.nextGap <= 0) spawnStack(world);

  // collision, with a few forgiving pixels on every side
  const left = RUNNER_X + 5;
  const right = RUNNER_X + CAT_W - 4;
  const feet = GROUND - world.y;
  for (const stack of world.stacks) {
    const top = GROUND - stack.rows * TILE;
    const overlapsX = right > stack.x + 1 && left < stack.x + stack.cols * TILE - 1;
    if (overlapsX && feet - 3 > top) return true;
  }
  return false;
}

function hop(world: World) {
  if (world.y === 0 && world.vy === 0) world.vy = JUMP_SPEED;
  else world.buffered = BUFFER;
}

/* ---------------------------------------------------------------------- */
/* drawing                                                                 */
/* ---------------------------------------------------------------------- */

function draw(ctx: CanvasRenderingContext2D, world: World, colors: Palette, running: boolean) {
  const { width } = world;
  ctx.clearRect(0, 0, width, HEIGHT);

  // the ground, and a strip of small zellige diamonds that moves with it
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = colors.ink;
  ctx.fillRect(0, GROUND, width, 1);
  const shift = world.distance % (DIAMOND_GAP * 3);
  for (let i = -1; i * DIAMOND_GAP - shift < width + DIAMOND_GAP; i++) {
    const x = i * DIAMOND_GAP - shift + DIAMOND_GAP / 2;
    const terra = (((i % 3) + 3) % 3) === 1;
    ctx.globalAlpha = terra ? 0.75 : 0.4;
    ctx.fillStyle = terra ? colors.terraFill : colors.cobalt;
    diamond(ctx, x, GROUND + 14, terra ? 3.4 : 2.6);
  }

  // stacks of loose tiles; the top tile of each stack is cracked in half
  const glazes = [colors.tile.blue, colors.tile.terra, colors.tile.green];
  ctx.globalAlpha = 1;
  for (const stack of world.stacks) {
    for (let col = 0; col < stack.cols; col++) {
      for (let row = 0; row < stack.rows; row++) {
        const x = Math.round(stack.x + col * TILE);
        const y = GROUND - (row + 1) * TILE;
        ctx.fillStyle = glazes[stack.tones[col * stack.rows + row] ?? 0];
        if (row === stack.rows - 1 && col === stack.cols - 1) {
          // cracked: only the lower-left half is left
          ctx.beginPath();
          ctx.moveTo(x, y + 1);
          ctx.lineTo(x + TILE - 1, y + TILE - 1);
          ctx.lineTo(x, y + TILE - 1);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(x, y, TILE - 1, TILE - 1);
        }
      }
    }
  }

  // the cat
  drawCat(ctx, RUNNER_X, GROUND - world.y - CAT_H, colors, running, world);
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

/** A small street cat, facing right, in ink. Its legs take turns while it runs. */
function drawCat(ctx: CanvasRenderingContext2D, x: number, y: number, colors: Palette, running: boolean, world: World) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = colors.ink;
  ctx.strokeStyle = colors.ink;

  // tail
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(4.5, 7);
  ctx.quadraticCurveTo(-0.5, 6, 0.8, 0.8);
  ctx.stroke();

  // body and head
  ctx.beginPath();
  ctx.roundRect(3.5, 5, 15.5, 7.5, 3.6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(19.6, 5.6, 4.1, 0, Math.PI * 2);
  ctx.fill();

  // ears
  ctx.beginPath();
  ctx.moveTo(16.2, 3.4);
  ctx.lineTo(17.1, -1.4);
  ctx.lineTo(19.7, 2);
  ctx.closePath();
  ctx.moveTo(19.7, 1.7);
  ctx.lineTo(22.6, -1.1);
  ctx.lineTo(23.3, 3.8);
  ctx.closePath();
  ctx.fill();

  // legs: on the ground they take turns; in the air they stretch fore and aft
  const airborne = world.y > 0;
  const phase = running && !airborne ? Math.floor(world.stride / 0.09) % 2 : 0;
  const long = 4.2;
  const short = 2.6;
  const legs: Array<[number, number]> = airborne
    ? [
        [4.2, 3.4],
        [6.6, 2.4],
        [15, 2.4],
        [17.4, 3.4],
      ]
    : [
        [4.6, phase === 0 ? long : short],
        [7, phase === 0 ? short : long],
        [14.6, phase === 0 ? short : long],
        [17, phase === 0 ? long : short],
      ];
  for (const [lx, length] of legs) ctx.fillRect(lx, 11.4, 1.9, length);

  // an eye
  ctx.fillStyle = colors.paper;
  ctx.beginPath();
  ctx.arc(21.2, 4.8, 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------------------------------------------------------------------- */
/* component                                                               */
/* ---------------------------------------------------------------------- */

export function LooseTiles() {
  const ids = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const world = useRef<World | null>(null);
  const size = useRef({ width: 0, dpr: 1, zoom: 1 });
  const [zoom, setZoom] = useState(1);
  const loop = useRef({ frame: 0, last: 0 });
  const keyHopped = useRef(false);
  const runnerRef = useRef("");
  const theme = useResolvedTheme();
  const themeRef = useRef(theme);

  const [phase, setPhase] = useState<Phase>("idle");
  const [name, setName] = useState("");
  const [runner, setRunner] = useState("");
  const [score, setScore] = useState(0);
  const [runs, setRuns] = useState<Run[]>([]);
  const [announcement, setAnnouncement] = useState("");

  const best = runs.length ? runs[0].score : 0;

  // What this browser remembers: the last name and the best runs.
  useEffect(() => {
    // Storage is only there in the browser, so this waits for the mount.
    setName(readName());
    setRuns(readRuns());
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const current = world.current;
    if (!canvas || !ctx || !current) return;
    const { dpr, zoom } = size.current;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
    draw(ctx, current, palette[themeRef.current], loop.current.frame !== 0);
  }, []);

  // Keep the backing store matched to the board's size, zoom and pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const cssWidth = Math.round(canvas.getBoundingClientRect().width);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const zoom = zoomFor(cssWidth);
      // The world is measured in its own units; the canvas is zoom times larger.
      const width = Math.round(cssWidth / zoom);
      size.current = { width, dpr, zoom };
      setZoom(zoom);
      canvas.width = Math.max(1, Math.round(cssWidth * dpr));
      canvas.height = Math.round(HEIGHT * zoom * dpr);
      if (!world.current) world.current = idleWorld(width);
      else world.current.width = width;
      paint();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paint]);

  // Colours follow the theme.
  useEffect(() => {
    themeRef.current = theme;
    const frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [theme, paint]);

  const stop = useCallback(() => {
    cancelAnimationFrame(loop.current.frame);
    loop.current.frame = 0;
  }, []);

  const finish = useCallback(
    (final: number, who: string) => {
      stop();
      const saved = saveRun({ name: who, score: final, at: new Date().toISOString() });
      setRuns(saved);
      setScore(final);
      setPhase("over");
      const top = saved[0]?.score ?? final;
      setAnnouncement(
        final >= top
          ? `Tripped at ${final}. That's the best run on this device.`
          : `Tripped at ${final}. Best on this device: ${top}.`,
      );
      paint();
      // A beat before the start button takes focus, so a key still held
      // from the last hop doesn't start the next run straight away.
      window.setTimeout(() => startRef.current?.focus({ preventScroll: true }), 450);
    },
    [paint, stop],
  );

  const tick = useCallback(
    (time: number) => {
      const current = world.current;
      if (!current) return;
      const dt = Math.min(0.034, (time - (loop.current.last || time)) / 1000);
      loop.current.last = time;
      const hit = step(current, dt);
      const points = Math.floor(current.distance / 12);
      if (scoreRef.current) scoreRef.current.textContent = pad(Math.min(points, 9999), 4);
      paint();
      if (hit) {
        finish(points, runnerRef.current);
        return;
      }
      loop.current.frame = requestAnimationFrame(tick);
    },
    [finish, paint],
  );

  function start(event?: FormEvent) {
    event?.preventDefault();
    const who = name.trim().slice(0, 24) || "Anonymous";
    saveName(name.trim().slice(0, 24));
    runnerRef.current = who;
    setRunner(who);
    setAnnouncement("");
    setScore(0);
    world.current = freshWorld(size.current.width);
    setPhase("running");
    stop();
    loop.current.last = 0;
    loop.current.frame = requestAnimationFrame(tick);
    requestAnimationFrame(() => boardRef.current?.focus({ preventScroll: true }));
  }

  // A hidden tab pauses the run; coming back picks up without a jump in time.
  useEffect(() => {
    if (phase !== "running") return;
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!loop.current.frame) {
        loop.current.last = 0;
        loop.current.frame = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, stop, tick]);

  useEffect(() => stop, [stop]);

  function onBoardKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (phase !== "running") return;
    if (event.key === " " || event.key === "ArrowUp" || event.key === "Enter" || event.key === "w") {
      event.preventDefault();
      if (!event.repeat && world.current) hop(world.current);
      keyHopped.current = true;
    }
  }

  const running = phase === "running";
  const shown = pad(Math.min(score, 9999), 4);

  return (
    <section aria-labelledby={`${ids}-title`} className="section" data-shortcuts="off">
      <StarRule />
      <p className="kicker mt-[22px] mb-2">While you’re here</p>
      <h2 id={`${ids}-title`} className="font-display text-title-2 text-primary">
        Mind the loose <em className="turn">tiles</em>
      </h2>
      <p id={`${ids}-how`} className="mt-3 max-w-[56ch] text-copy text-body">
        A street cat, a run of loose zellige. Hop with Space, ↑ or a tap; your best runs stay in this browser.
      </p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-x-[clamp(32px,5vw,64px)] gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
        <div className="min-w-0 select-none [-webkit-touch-callout:none]">
          <div className="paper overflow-hidden">
            <div className="flex items-baseline justify-between gap-4 px-5 pt-4">
              <span className="caps truncate text-muted">{phase === "idle" ? "No runner yet" : `Runner · ${runner}`}</span>
              <span className="font-display text-[26px] leading-none text-terra [font-variant-numeric:lining-nums_tabular-nums]">
                {running ? (
                  // Written straight to the DOM every frame (see tick), not by React.
                  <span
                    key="live"
                    aria-hidden="true"
                    ref={(element) => {
                      scoreRef.current = element;
                      if (element && !element.textContent) element.textContent = "0000";
                    }}
                  />
                ) : (
                  <span key="still">{shown}</span>
                )}
              </span>
            </div>
            <div className="relative">
              <button
                ref={boardRef}
                type="button"
                aria-label="Hop"
                aria-describedby={`${ids}-how`}
                tabIndex={running ? 0 : -1}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse" && event.button !== 0) return;
                  // Tapping the board before a run (or after a fall) starts one.
                  if (!running) {
                    event.preventDefault();
                    start();
                    return;
                  }
                  if (world.current) hop(world.current);
                }}
                onClick={(event) => {
                  // Keyboard and screen-reader presses arrive as clicks with no
                  // pointer; the ones that already hopped on keydown are skipped.
                  if (event.detail !== 0 || !running || !world.current) return;
                  if (keyHopped.current) keyHopped.current = false;
                  else hop(world.current);
                }}
                onKeyDown={onBoardKeyDown}
                className="block w-full cursor-pointer touch-manipulation outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--cobalt)]"
              >
                <canvas ref={canvasRef} className="block w-full" style={{ height: HEIGHT * zoom }} />
              </button>
              {!running ? (
                <p
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-5 flex animate-fade-in justify-center px-5"
                >
                  <span className="rounded-pill bg-paper/90 px-3.5 py-1.5 text-center text-small text-body shadow-lift">
                    {phase === "over" ? (
                      <>
                        <span className="serif-italic text-primary">Tripped at {shown}.</span>{" "}
                        {score > 0 && score >= best ? "A new best here." : `Best here is ${pad(best, 4)}.`}
                      </>
                    ) : (
                      "Press Start, or tap the board"
                    )}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <form onSubmit={start} className="mt-4 flex max-w-[26rem] items-center gap-2.5">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              aria-label="Your name for the ledger"
              maxLength={24}
              autoComplete="nickname"
              enterKeyHint="go"
              className="field rounded-pill"
            />
            <button ref={startRef} type="submit" className="btn btn-solid shrink-0">
              <Star size={13} className="text-terra-fill" />
              {phase === "over" ? "Again" : running ? "Restart" : "Start"}
            </button>
          </form>
        </div>

        <Ledger runs={runs} />
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}

function Ledger({ runs }: { runs: Run[] }) {
  const top = runs.slice(0, 5);
  return (
    <div>
      <h3 className="caps text-muted">Best runs here</h3>
      {top.length ? (
        <ol className="mt-3 rule-ink">
          {top.map((run, index) => (
            <li
              key={`${run.at}-${index}`}
              className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-line py-2.5"
            >
              <span className="numeral text-[14px]">{index + 1}</span>
              <span className={cn("truncate text-[15px]", index === 0 ? "font-[550] text-primary" : "text-body")}>
                {run.name}
              </span>
              <span className="font-display text-[18px] text-primary [font-variant-numeric:lining-nums_tabular-nums]">
                {pad(Math.min(run.score, 9999), 4)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-3 rule-ink pt-4">
          <p className="serif-italic text-[20px] text-primary">No runs yet.</p>
          <p className="mt-1 text-small text-muted">The first score on this device is yours.</p>
        </div>
      )}
    </div>
  );
}
