"use client";

// The 404 page's little game: "Broken links". The arsher mark runs along
// the bottom of a 200px card and hops over pixel pillars (the broken links)
// that slide in faster and faster. Space, ↑, Enter or a tap jumps.
//
//   No runner yet ........................................ 0000
//   ┌────────────────────────────────────────────────────────┐
//   │        Hop over the broken links. Your best runs …     │
//   │              [ Your name         ] [Start]             │  form over the
//   │  ▲     ▌            ▌▌                                 │  blurred scene
//   └────────────────────────────────────────────────────────┘
//   Leaderboard                                   Best 0123
//
// There is no server: scores are kept in this browser (localStorage), and
// the leaderboard lists the best runs on this device.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";
import { useResolvedTheme } from "@/lib/theme";

/* ---------------------------------------------------------------------- */
/* tuning (CSS pixels and seconds)                                         */
/* ---------------------------------------------------------------------- */

const HEIGHT = 200;
const GROUND = 152; // y of the ground line
const RUNNER_X = 56;
const RUNNER = 20; // the mark is drawn 20px square
const GRAVITY = 2600;
const JUMP_SPEED = 760; // takeoff speed: ~111px high, ~0.58s in the air
const SPEED_START = 300;
const SPEED_MAX = 660;
const SPEED_GAIN = 9; // px/s per second of running
const BUFFER = 0.12; // a jump pressed this long before landing still counts
const PIXEL = 5; // pillar block size
const STORE_KEY = "arsher:404-runs";
const NAME_KEY = "arsher:404-name";
const MAX_RUNS = 10;

// The mark (components/logo.tsx) on its 16-unit grid; the last two rows
// are the feet, which take turns while running.
const MARK: ReadonlyArray<readonly [number, number, number, number]> = [
  [7, 1, 2, 2],
  [5, 3, 2, 3],
  [9, 3, 2, 3],
  [3, 6, 2, 4],
  [11, 6, 2, 4],
  [7, 10, 2, 2],
];

type Pillar = { x: number; cols: number; rows: number };
type Run = { name: string; score: number; at: string };
type Phase = "idle" | "running" | "over";

type World = {
  width: number;
  y: number; // runner's feet above the ground (0 = standing)
  vy: number;
  speed: number;
  distance: number;
  pillars: Pillar[];
  nextGap: number;
  buffered: number; // time left on a buffered jump
  stride: number;
  specks: number[];
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

function freshWorld(width: number): World {
  return {
    width,
    y: 0,
    vy: 0,
    speed: SPEED_START * scaleFor(width),
    distance: 0,
    pillars: [],
    nextGap: width * 0.75,
    buffered: 0,
    stride: 0,
    specks: Array.from({ length: 14 }, () => random(0, width)),
  };
}

/** Narrow cards get a slower world, so there is as much time to react. */
function scaleFor(width: number) {
  return Math.min(1, Math.max(0.68, width / 628));
}

/** The scene behind the start form: the runner waiting, two pillars ahead. */
function idleWorld(width: number): World {
  const world = freshWorld(width);
  world.pillars = [
    { x: width * 0.46, cols: 2, rows: 5 },
    { x: width * 0.74, cols: 3, rows: 3 },
  ];
  return world;
}

function spawnPillar(world: World) {
  const hard = Math.min(1, world.distance / 9000);
  const cols = Math.random() < 0.35 + hard * 0.3 ? 3 : 2;
  const rows = Math.round(random(3, 5 + hard * 3));
  world.pillars.push({ x: world.width + 8, cols, rows });
  // Room to land and take off again, growing with the speed.
  const reach = world.speed * 0.62;
  world.nextGap = random(reach + 70, reach + 260 - hard * 80);
}

function step(world: World, dt: number): boolean {
  world.speed = Math.min(SPEED_MAX * scaleFor(world.width), world.speed + SPEED_GAIN * dt);
  const dx = world.speed * dt;
  world.distance += dx;
  world.stride += dt;

  // runner
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

  // pillars
  for (const pillar of world.pillars) pillar.x -= dx;
  world.pillars = world.pillars.filter((pillar) => pillar.x + pillar.cols * PIXEL > -10);
  world.nextGap -= dx;
  if (world.nextGap <= 0) spawnPillar(world);

  // specks on the ground drift at the same speed
  world.specks = world.specks.map((x) => (x - dx < -4 ? world.width + random(0, 40) : x - dx));

  // collision, with a few forgiving pixels on every side
  const left = RUNNER_X + 4;
  const right = RUNNER_X + RUNNER - 4;
  const feet = GROUND - world.y;
  for (const pillar of world.pillars) {
    const top = GROUND - pillar.rows * PIXEL;
    const overlapsX = right > pillar.x + 1 && left < pillar.x + pillar.cols * PIXEL - 1;
    if (overlapsX && feet - 3 > top) return true;
  }
  return false;
}

function jump(world: World) {
  if (world.y === 0 && world.vy === 0) world.vy = JUMP_SPEED;
  else world.buffered = BUFFER;
}

/* ---------------------------------------------------------------------- */
/* drawing                                                                 */
/* ---------------------------------------------------------------------- */

function draw(ctx: CanvasRenderingContext2D, world: World, ink: string, running: boolean) {
  const { width } = world;
  ctx.clearRect(0, 0, width, HEIGHT);
  ctx.fillStyle = ink;

  // ground and its specks
  ctx.globalAlpha = 0.14;
  ctx.fillRect(0, GROUND, width, 1);
  ctx.globalAlpha = 0.1;
  world.specks.forEach((x, index) => ctx.fillRect(Math.round(x), GROUND + 8 + (index % 3) * 9, index % 2 ? 3 : 6, 1));

  // pillars: stacked blocks with a hairline between them
  ctx.globalAlpha = 0.78;
  for (const pillar of world.pillars) {
    for (let col = 0; col < pillar.cols; col++) {
      for (let row = 0; row < pillar.rows; row++) {
        // the top block of the middle column is knocked out: a broken link
        if (pillar.cols === 3 && col === 1 && row === pillar.rows - 1) continue;
        ctx.fillRect(
          Math.round(pillar.x + col * PIXEL),
          GROUND - (row + 1) * PIXEL,
          PIXEL - 1,
          PIXEL - 1,
        );
      }
    }
  }

  // the runner
  ctx.globalAlpha = 1;
  const unit = RUNNER / 16;
  const top = GROUND - world.y - RUNNER;
  for (const [x, y, w, h] of MARK) {
    ctx.fillRect(RUNNER_X + x * unit, top + y * unit, w * unit, h * unit);
  }
  // feet: on the ground they take turns; in the air both tuck in
  const airborne = world.y > 0;
  const phase = running && !airborne ? Math.floor(world.stride / 0.09) % 2 : 0;
  const leftFoot = airborne ? 3 : phase === 0 ? 5 : 3.5;
  const rightFoot = airborne ? 3 : phase === 0 ? 3.5 : 5;
  ctx.fillRect(RUNNER_X + 1 * unit, top + 10 * unit, 2 * unit, leftFoot * unit);
  ctx.fillRect(RUNNER_X + 13 * unit, top + 10 * unit, 2 * unit, rightFoot * unit);
}

/* ---------------------------------------------------------------------- */
/* component                                                               */
/* ---------------------------------------------------------------------- */

const inputClass =
  "w-full rounded-pill bg-background py-2 ps-4 pe-4 text-[16px] text-primary shadow-lift outline-none transition-[box-shadow] duration-150 ease-out placeholder:text-tertiary focus:shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_45%,transparent),0_0_0_4px_color-mix(in_oklab,var(--foreground)_9%,transparent)] sm:text-[15px]";

const startClass =
  "shrink-0 cursor-pointer rounded-pill bg-ink px-4 py-2 text-[14px] font-medium text-on-ink transition-[opacity,scale] duration-150 ease-out hover:opacity-85 active:scale-[0.96] focus-ring";

export function BrokenLinksGame() {
  const ids = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const world = useRef<World | null>(null);
  const size = useRef({ width: 0, dpr: 1 });
  const loop = useRef({ frame: 0, last: 0 });
  const keyJumped = useRef(false);
  const runnerRef = useRef("");
  const theme = useResolvedTheme();

  const [phase, setPhase] = useState<Phase>("idle");
  const [name, setName] = useState("");
  const [runner, setRunner] = useState("");
  const [score, setScore] = useState(0);
  const [runs, setRuns] = useState<Run[]>([]);
  const [board, setBoard] = useState(false);
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
    const { dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, current, getComputedStyle(canvas).color, loop.current.frame !== 0);
  }, []);

  // Keep the backing store matched to the card's size and pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const width = Math.round(canvas.getBoundingClientRect().width);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      size.current = { width, dpr };
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.round(HEIGHT * dpr);
      if (!world.current) world.current = idleWorld(width);
      else world.current.width = width;
      paint();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paint]);

  // Ink follows the theme.
  useEffect(() => {
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
          ? `Out at ${final}. That's the best run on this device.`
          : `Out at ${final}. Best on this device: ${top}.`,
      );
      paint();
      // A beat before the start button takes focus, so a key still held
      // from the last jump doesn't start the next run straight away.
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
    setBoard(false);
    setAnnouncement("");
    setScore(0);
    world.current = freshWorld(size.current.width);
    setPhase("running");
    stop();
    loop.current.last = 0;
    loop.current.frame = requestAnimationFrame(tick);
    requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }));
  }

  // A hidden tab pauses the loop; coming back picks up without a jump in time.
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

  function onCardKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (phase !== "running") return;
    if (event.key === " " || event.key === "ArrowUp" || event.key === "Enter" || event.key === "w") {
      event.preventDefault();
      if (!event.repeat && world.current) jump(world.current);
      keyJumped.current = true;
    }
  }

  const overlay = phase !== "running";
  const label = phase === "idle" ? "No runner yet" : `Runner · ${runner}`;

  return (
    <div className="mt-10 select-none [-webkit-touch-callout:none]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 text-[13px] text-tertiary tabular-nums">
        <span className="truncate">{label}</span>
        {phase === "running" ? (
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
          <span key="still">{pad(Math.min(score, 9999), 4)}</span>
        )}
      </div>

      <div className="relative mt-2">
        <button
          ref={cardRef}
          type="button"
          aria-label="Jump"
          aria-describedby={`${ids}-how`}
          tabIndex={overlay ? -1 : 0}
          aria-hidden={overlay || undefined}
          onPointerDown={(event) => {
            if (phase !== "running" || !world.current) return;
            if (event.pointerType === "mouse" && event.button !== 0) return;
            jump(world.current);
          }}
          onClick={(event) => {
            // Keyboard and screen-reader presses arrive as clicks with no
            // pointer; the ones that already jumped on keydown are skipped.
            if (event.detail !== 0 || phase !== "running" || !world.current) return;
            if (keyJumped.current) keyJumped.current = false;
            else jump(world.current);
          }}
          onKeyDown={onCardKeyDown}
          className="block w-full cursor-pointer touch-manipulation overflow-hidden rounded-[24px] bg-tile outline-none transition-[background-color] duration-150 ease-out hover:bg-tile-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
        >
          <canvas ref={canvasRef} className="block h-[200px] w-full text-primary" />
        </button>
        <span id={`${ids}-how`} className="sr-only">
          Press Space, Enter or the up arrow to jump over the pillars.
        </span>

        {overlay ? (
          <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center gap-3 rounded-[24px] bg-tile/80 backdrop-blur-sm">
            {board ? (
              <Leaderboard runs={runs} />
            ) : (
              <form onSubmit={start} className="flex w-full flex-col items-center gap-3">
                <p className="px-6 text-center text-[14px] text-secondary">
                  {phase === "over" ? (
                    <>
                      Tripped at <span className="text-primary tabular-nums">{pad(Math.min(score, 9999), 4)}</span>.{" "}
                      {score >= best ? "A new best on this device." : `Best here is ${pad(best, 4)}.`}
                    </>
                  ) : (
                    <>Hop over the broken links. Your best runs stay in this browser.</>
                  )}
                </p>
                <div className="flex w-[min(20rem,80%)] items-center gap-2">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    aria-label="Your name for the scoreboard"
                    maxLength={24}
                    autoComplete="nickname"
                    enterKeyHint="go"
                    className={inputClass}
                  />
                  <button ref={startRef} type="submit" className={startClass}>
                    {phase === "over" ? "Again" : "Start"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>

      <p className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center justify-items-start gap-4 text-[13px] text-tertiary">
        <button
          type="button"
          aria-expanded={board}
          onClick={() => {
            if (phase === "running") {
              stop();
              setPhase("idle");
            }
            setBoard((open) => !open);
          }}
          className="link cursor-pointer rounded-[4px] focus-ring"
        >
          {board ? "Back to the game" : "Leaderboard"}
        </button>
        {best > 0 ? <span className="tabular-nums">Best {pad(best, 4)}</span> : null}
      </p>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

function Leaderboard({ runs }: { runs: Run[] }) {
  const top = runs.slice(0, 5);
  return (
    <div className="flex w-[min(22rem,86%)] flex-col gap-2 text-[13px]">
      <p className="text-center text-tertiary">Best runs in this browser</p>
      {top.length ? (
        <ol className="flex flex-col gap-1">
          {top.map((run, index) => (
            <li
              key={`${run.at}-${index}`}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-1 tabular-nums",
                index === 0 ? "bg-background text-primary shadow-lift" : "text-secondary",
              )}
            >
              <span className="w-4 text-tertiary">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate">{run.name}</span>
              <span>{pad(Math.min(run.score, 9999), 4)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-center text-[14px] text-secondary">No runs yet. Set the first score.</p>
      )}
    </div>
  );
}
