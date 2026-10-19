"use client";

// Agent run: a crafted card that shows an agent working through a task.
//
// Look. One component on the grey stage, nothing else: a white card (soft
// layered shadow, hairline ring; charcoal with a faint top highlight at
// night) with a header that carries the agent mark, a live status and two
// counters, and a transcript under it. Geist for the words, Geist Mono for
// tool names, arguments and numbers, all tabular. Colour is held back to
// ink and greys; the one accent (the site's blue) means "in flight": live
// dots, the edges and packets on the graph, a running sub-agent. Done is
// ink, pending is a dashed hairline.
//
// Motion. A run is a scripted timeline (script.ts), so it paces like the
// real thing: "Planning…" shimmers, the plan drops in as a list, each step
// spins and then checks off with a drawn tick and a little spring, tool
// calls type their arguments in before they run (one opens on its own to
// show its JSON, then folds away), sub-agents fan out on a small graph
// with packets riding the curves, the token odometer rolls on springs and
// the timer counts, and the summary streams in word by word. The
// transcript follows the run with an eased scroll and lets go as soon as
// you scroll or open something; a pill brings it back.
//
// Touch. Type a task (or press Shuffle, or pick an example) and Run;
// Stop (or Esc) freezes it where it is; Run again replays. Tool calls open
// with a click, Enter or Space. Quiet synthesised ticks once you have
// touched the stage (sound.ts), muted with the lab's shared mute.
//
// Tile: a miniature of the card cycling short runs, steps folding away as
// they finish. Reduced motion: the stage shows a finished run (and later
// runs step through without any movement); the tile a still, finished card.

import { GeistMono } from "geist/font/mono";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ensureAudio } from "../../audio";
import { useElementSize, useFrame, useIsoLayoutEffect } from "../../hooks";
import { Reset, Shuffle } from "../../lab-icons";
import type { PieceProps } from "../../types";
import { IconButton, MuteButton, StageControls, TextInput, Tray, TrayButton, TrayDivider } from "../../ui";
import { RunClock, type RunState } from "./clock";
import { Graph } from "./graph";
import { Odometer, Timer } from "./odometer";
import { AgentMark, CallStatus, GlyphShape, StatusIcon, StopIcon, ThinkIcon, ToolRow } from "./parts";
import {
  SCRIPTS,
  STAGE_PACE,
  TILE_PACE,
  agentActivity,
  autoOpen,
  callsDone,
  compile,
  currentStep,
  formatSeconds,
  formatTokens,
  plannedAt,
  scriptFor,
  statusAt,
  tokensAt,
  viewKey,
  type Script,
  type TStep,
  type Timeline,
  type Word,
} from "./script";
import { chime, halt, tap, tick } from "./sound";
import { css } from "./styles";

export default function Piece(props: PieceProps) {
  return (
    <div className={cn("ar absolute inset-0", GeistMono.variable)} data-paused={props.active ? undefined : ""}>
      <style href="lab-agent-run" precedence="default">
        {css}
      </style>
      {props.mode === "stage" ? <Stage {...props} /> : <Tile {...props} />}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* shared                                                                  */
/* ---------------------------------------------------------------------- */

type View = { t: number; state: RunState };

const digitsFor = (tokens: number) => Math.max(5, String(Math.round(tokens)).length);

/** What the header says the agent is doing. */
type StatusLine = { text: string; short?: string; tone: "idle" | "live" | "done" | "stopped"; shimmer?: boolean };

function statusLine(timeline: Timeline | null, view: View): StatusLine {
  if (!timeline || view.state === "idle") return { text: "Ready", tone: "idle" };
  if (view.state === "done") return { text: "Done", tone: "done" };
  const { t } = view;
  const stopped = view.state === "stopped";
  if (t < timeline.planEnd) {
    return stopped
      ? { text: "Stopped while planning", short: "Stopped", tone: "stopped" }
      : { text: "Planning", tone: "live", shimmer: true };
  }
  if (t >= timeline.summaryStart) {
    return stopped ? { text: "Stopped", tone: "stopped" } : { text: "Writing the summary", short: "Summary", tone: "live", shimmer: true };
  }
  const step = currentStep(timeline, t) ?? timeline.steps[0];
  const position = `Step ${step.index + 1} of ${timeline.steps.length}`;
  return stopped
    ? { text: `Stopped at ${position.toLowerCase()}`, short: "Stopped", tone: "stopped" }
    : { text: position, short: `Step ${step.index + 1}/${timeline.steps.length}`, tone: "live" };
}

function StatusDot({ tone, size = 6 }: { tone: "idle" | "live" | "done" | "stopped"; size?: number }) {
  return (
    <span aria-hidden="true" className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {tone === "live" ? <span className="ar-ping absolute inset-0 rounded-full bg-[var(--ar-live)]" /> : null}
      <span
        className={cn(
          "relative size-full transition-[background-color,border-radius] duration-300 ease-out",
          tone === "stopped" ? "rounded-[1.5px]" : "rounded-full",
          tone === "live" && "bg-[var(--ar-live)]",
          tone === "done" && "bg-status",
          tone === "stopped" && "bg-tertiary",
          tone === "idle" && "bg-line-firm",
        )}
      />
    </span>
  );
}

/** Words that have arrived by t, each fading in as it lands. */
function Streamed({ words, t, animate }: { words: readonly Word[]; t: number; animate: boolean }) {
  const shown = words.filter((word) => t >= word.at);
  return (
    <>
      {shown.map((word, index) => (
        <span key={index} className={animate ? "ar-word" : undefined}>
          {index ? " " : ""}
          {word.text}
        </span>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

function Stage({ active, reducedMotion }: PieceProps) {
  const [clock] = useState(() => new RunClock());
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [runId, setRunId] = useState(0);
  const [view, setView] = useState<View>({ t: 0, state: "idle" });
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const [follow, setFollow] = useState(true);
  const [announce, setAnnounce] = useState("");
  const [pressing, setPressing] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const userScroll = useRef(0);
  const lastKey = useRef("");
  const interacted = useRef(false);
  const suggestion = useRef(0);
  const size = useElementSize(rootRef);
  const narrow = size.width > 0 && size.width < 560;

  const publish = useCallback(() => {
    const current = clock.timeline;
    if (!current) return;
    const key = `${viewKey(current, clock.t, clock.stopped)}|${clock.state}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    setView({ t: clock.t, state: clock.state });
  }, [clock]);

  /**
   * Sounds and announcements for whatever happened between two times.
   * Sounds wait for a gesture on this stage, so the first, self-started
   * run is silent even if the lab's audio is already awake.
   */
  const cue = useCallback((current: Timeline, from: number, to: number) => {
    const crossed = (at: number) => from < at && at <= to;
    const sound = interacted.current;
    if (crossed(current.planStart)) setAnnounce("Planning.");
    current.steps.forEach((step) => {
      if (crossed(step.start)) setAnnounce(`Step ${step.index + 1} of ${current.steps.length}: ${step.label}.`);
      if (sound && crossed(step.end)) tick();
      step.agents.forEach((agent, index) => {
        if (sound && crossed(agent.end)) tap(index);
      });
    });
    if (crossed(current.end)) {
      if (sound) chime();
      setAnnounce(`Done in ${formatSeconds(current.end)}. ${current.script.summary.title}`);
    }
  }, []);

  const wake = useFrame(active, (dt) => {
    const current = clock.timeline;
    if (current && clock.state === "running") {
      const from = clock.t;
      clock.t = Math.min(current.end, clock.t + dt);
      cue(current, from, clock.t);
      if (clock.t >= current.end) {
        clock.state = "done";
        clock.linger = 1.2;
      }
    }
    const busy = clock.emit(dt);
    publish();
    return clock.state === "running" || busy ? undefined : false;
  });

  const setFollowing = useCallback((value: boolean) => {
    followRef.current = value;
    setFollow(value);
  }, []);

  const begin = useCallback(
    (script: Script, finished = false) => {
      const next = compile(script, STAGE_PACE);
      clock.timeline = next;
      clock.t = finished ? next.end : 0;
      clock.state = finished ? "done" : "running";
      clock.linger = 0.8;
      lastKey.current = "";
      setTimeline(next);
      setRunId((id) => id + 1);
      setToggles({});
      setView({ t: clock.t, state: clock.state });
      setFollowing(true);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      if (!finished) setAnnounce(`Running: ${script.task}`);
      wake();
    },
    [clock, setFollowing, wake],
  );

  // First visit: the empty card with its examples, then the first example
  // presses itself and runs. With reduced motion, a finished run instead.
  useEffect(() => {
    if (timeline) return;
    if (reducedMotion) {
      begin(SCRIPTS[0], true);
      return;
    }
    if (!active || interacted.current) return;
    const press = window.setTimeout(() => setPressing(SCRIPTS[0].id), 1500);
    const go = window.setTimeout(() => {
      setPressing(null);
      if (!interacted.current) begin(SCRIPTS[0]);
    }, 1720);
    return () => {
      window.clearTimeout(press);
      window.clearTimeout(go);
    };
  }, [timeline, reducedMotion, active, begin]);

  // Follow the run: ease the transcript down as it grows.
  useEffect(
    () =>
      clock.subscribe((dt) => {
        const element = scrollRef.current;
        if (!element || !followRef.current) return false;
        const target = element.scrollHeight - element.clientHeight;
        const gap = target - element.scrollTop;
        if (gap <= 0.5) return false;
        const step = reducedMotion ? gap : gap * (1 - Math.exp(-7 * dt));
        element.scrollTop = step < 1 ? target : element.scrollTop + step;
        return true;
      }),
    [clock, reducedMotion],
  );

  const touch = () => {
    interacted.current = true;
    ensureAudio();
  };

  const running = view.state === "running";

  const stop = () => {
    if (clock.state !== "running") return;
    clock.state = "stopped";
    clock.linger = 0.8;
    halt();
    publish();
    setAnnounce(`Stopped at ${formatSeconds(clock.t)}.`);
    wake();
  };

  const again = () => {
    if (timeline) begin(timeline.script);
  };

  const submit = (value: string) => {
    interacted.current = true;
    const text = value.replace(/\s+/g, " ").trim();
    const script = text ? scriptFor(text) : SCRIPTS[suggestion.current++ % SCRIPTS.length];
    setDraft("");
    begin(script);
  };

  const shuffle = () => {
    const script = SCRIPTS[suggestion.current++ % SCRIPTS.length];
    setDraft(script.task);
  };

  const toggle = (id: string, open: boolean) => {
    interacted.current = true;
    setToggles((prev) => ({ ...prev, [id]: !open }));
    // Opening something while the run goes on: stop pulling the view away from it.
    if (!open && clock.state === "running") setFollowing(false);
    clock.linger = 0.6;
    wake();
  };

  const onScrollIntent = () => {
    userScroll.current = performance.now();
  };
  const onScroll = () => {
    const element = scrollRef.current;
    if (!element || performance.now() - userScroll.current > 450) return;
    const atBottom = element.scrollHeight - element.clientHeight - element.scrollTop < 28;
    if (atBottom !== followRef.current) setFollowing(atBottom);
  };

  const t = view.t;
  const status = statusLine(timeline, view);
  const columns = digitsFor(timeline?.totalTokens ?? 0);
  const readTokens = () => (clock.timeline && clock.state !== "idle" ? tokensAt(clock.timeline, clock.t) : 0);
  const readTime = () => formatSeconds(clock.timeline && clock.state !== "idle" ? clock.t : 0);
  const pad = narrow ? { top: 12, bottom: 72 } : { top: 24, bottom: 80 };

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      onPointerDownCapture={touch}
      onKeyDownCapture={(event) => {
        touch();
        if (event.key === "Escape" && clock.state === "running") {
          event.preventDefault();
          stop();
        }
      }}
    >
      <div className="absolute inset-x-0 flex items-center justify-center px-3 sm:px-6" style={{ top: pad.top, bottom: pad.bottom }}>
        <section
          aria-label="Agent run"
          className="ar-card relative flex h-full max-h-[680px] w-full max-w-[640px] flex-col overflow-hidden rounded-[22px]"
        >
          <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border ps-4 pe-4 sm:ps-[18px] sm:pe-5">
            <AgentMark size={22} live={running} />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={cn("text-[14px] leading-none font-medium tracking-[-0.01em] text-primary", narrow && "sr-only")}>Agent</span>
              {narrow ? null : (
                <span aria-hidden="true" className="text-[13px] leading-none text-line-firm">
                  /
                </span>
              )}
              <span className="flex min-w-0 items-center gap-1.5">
                <StatusDot tone={status.tone} />
                <span
                  key={status.text}
                  className={cn(
                    "ar-fade truncate text-[13px] leading-[1.2]",
                    status.shimmer ? "ar-shimmer" : status.tone === "done" ? "text-primary" : "text-secondary",
                  )}
                >
                  {narrow ? (status.short ?? status.text) : status.text}
                </span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-[12.5px]">
              <span className="flex items-center gap-1.5 text-secondary" title="Elapsed">
                <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden="true" className={cn("shrink-0 text-tertiary", narrow && "hidden")}>
                  <circle cx="8" cy="8.6" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 5.9v2.8l1.7 1.1M6.6 1.9h2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <Timer clock={clock} read={readTime} className="min-w-[4ch] text-end" />
              </span>
              <span aria-hidden="true" className="h-3.5 w-px bg-border" />
              <span className="flex items-baseline gap-1.5" title="Tokens">
                <Odometer clock={clock} read={readTokens} columns={columns} reducedMotion={reducedMotion} className="text-primary" />
                <span className="text-[12px] text-tertiary">{narrow ? "tok" : "tokens"}</span>
              </span>
            </div>
          </header>

          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              tabIndex={0}
              aria-label="Run transcript"
              onWheel={onScrollIntent}
              onTouchMove={onScrollIntent}
              onPointerDown={onScrollIntent}
              onKeyDown={(event) => {
                if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(event.key)) onScrollIntent();
              }}
              onScroll={onScroll}
              className="ar-scroll absolute inset-0 overflow-y-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              {timeline ? (
                <Transcript
                  key={runId}
                  timeline={timeline}
                  t={t}
                  state={view.state}
                  clock={clock}
                  reducedMotion={reducedMotion}
                  toggles={toggles}
                  onToggle={toggle}
                  onPick={(script) => {
                    interacted.current = true;
                    begin(script);
                  }}
                />
              ) : (
                <EmptyState
                  pressing={pressing}
                  onPick={(script) => {
                    interacted.current = true;
                    begin(script);
                  }}
                />
              )}
            </div>
            {!follow && running ? (
              <button
                type="button"
                onClick={() => {
                  setFollowing(true);
                  clock.linger = 0.4;
                  wake();
                }}
                className="ar-in absolute bottom-3 left-1/2 z-10 flex h-7 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-float ps-2.5 pe-3 text-[12px] font-medium text-primary shadow-float outline-none transition-[scale] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden="true">
                  <path d="M8 3v9.5M4 8.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Follow the run
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <StageControls placement="bottom">
        <Tray label="Task">
          <TextInput
            label="Task for the agent"
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            placeholder={narrow ? "Type a task" : "Give the agent a task"}
            maxLength={120}
            submitLabel="Run"
            width={narrow ? 148 : 268}
          />
          {narrow ? null : (
            <IconButton label="Suggest a task" onClick={shuffle}>
              <Shuffle size={16} />
            </IconButton>
          )}
          <TrayDivider />
          {narrow ? (
            running ? (
              <IconButton label="Stop" onClick={stop}>
                <StopIcon size={14} />
              </IconButton>
            ) : (
              <IconButton label="Run again" onClick={again} disabled={!timeline}>
                <Reset size={16} />
              </IconButton>
            )
          ) : running ? (
            <TrayButton icon={<StopIcon size={13} />} onClick={stop} className="w-[112px]" aria-keyshortcuts="Escape">
              Stop
            </TrayButton>
          ) : (
            <TrayButton icon={<Reset size={14} />} onClick={again} disabled={!timeline} className="w-[112px]">
              Run again
            </TrayButton>
          )}
          <MuteButton />
        </Tray>
      </StageControls>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* empty state                                                             */
/* ---------------------------------------------------------------------- */

function Chip({ children, onClick, pressed }: { children: ReactNode; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center rounded-[10px] px-3 text-[12.5px] text-primary outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-well-hover active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary pointer-coarse:h-9",
        pressed ? "scale-[0.96] bg-well-hover" : "bg-well",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ onPick, pressing }: { onPick: (script: Script) => void; pressing: string | null }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-8 text-center">
      <AgentMark size={40} className="ar-pop" />
      <p className="ar-in mt-5 text-[17px] leading-[1.3] font-medium tracking-[-0.015em] text-primary" style={{ animationDelay: "80ms" }}>
        What should the agent do?
      </p>
      <p className="ar-in mt-1.5 max-w-[34ch] text-[13px] leading-[1.5] text-pretty text-tertiary" style={{ animationDelay: "140ms" }}>
        A scripted run that plays offline. Pick an example or type your own task below.
      </p>
      <div className="ar-in mt-6 flex max-w-[440px] flex-wrap justify-center gap-2" style={{ animationDelay: "200ms" }}>
        {SCRIPTS.map((script) => (
          <Chip key={script.id} pressed={pressing === script.id} onClick={() => onPick(script)}>
            {script.chip}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* transcript                                                              */
/* ---------------------------------------------------------------------- */

function Transcript({
  timeline,
  t,
  state,
  clock,
  reducedMotion,
  toggles,
  onToggle,
  onPick,
}: {
  timeline: Timeline;
  t: number;
  state: RunState;
  clock: RunClock;
  reducedMotion: boolean;
  toggles: Record<string, boolean>;
  onToggle: (id: string, open: boolean) => void;
  onPick: (script: Script) => void;
}) {
  const stopped = state === "stopped";
  const planStatus = statusAt(timeline.planStart, timeline.planEnd, t, stopped);
  const done = state === "done";

  return (
    <div className="px-4 pt-4 pb-7 sm:px-5 sm:pt-5">
      {/* the task */}
      <div className="flex justify-end ps-10">
        <p className="ar-in m-0 rounded-[16px] rounded-ee-[6px] bg-well px-3.5 py-2 text-[13.5px] leading-[1.45] text-pretty text-primary">
          {timeline.task}
        </p>
      </div>

      {/* planning */}
      {t >= timeline.planStart ? (
        <div className="ar-in mt-4 flex h-5 items-center gap-3">
          <ThinkIcon live={planStatus === "running"} />
          <span
            className={cn(
              "text-[13px] leading-5",
              planStatus === "running" ? "ar-shimmer" : planStatus === "stopped" ? "text-tertiary" : "text-secondary",
            )}
          >
            {planStatus === "running"
              ? "Planning…"
              : planStatus === "stopped"
                ? "Stopped while planning"
                : `Planned ${timeline.steps.length} steps`}
          </span>
          {planStatus === "done" ? (
            <span className="ar-mono ar-fade ms-auto text-[11px] text-tertiary">{formatSeconds(timeline.planEnd - timeline.planStart)}</span>
          ) : null}
        </div>
      ) : null}

      {/* steps: written into the plan one by one while it plans */}
      {t >= plannedAt(timeline, 0) ? (
        <ol className="m-0 mt-3 list-none p-0">
          {timeline.steps
            .filter((step) => t >= plannedAt(timeline, step.index))
            .map((step) => (
              <StepRow
                key={step.id}
                step={step}
                last={step.index === timeline.steps.length - 1}
                t={t}
                stopped={stopped}
                clock={clock}
                reducedMotion={reducedMotion}
                toggles={toggles}
                onToggle={onToggle}
              />
            ))}
        </ol>
      ) : null}

      {/* summary */}
      {t >= timeline.summaryStart ? <Summary timeline={timeline} t={t} done={done} reducedMotion={reducedMotion} /> : null}

      {stopped ? (
        <p className="ar-in mt-4 mb-0 flex items-center gap-2 text-[12.5px] text-tertiary">
          <StatusIcon status="stopped" size={12} />
          Stopped at {formatSeconds(t)}. Everything up to here is kept; Run again starts over.
        </p>
      ) : null}

      {done || stopped ? (
        <div className="ar-in mt-5" style={{ animationDelay: "160ms" }}>
          <p className="m-0 mb-2 text-[12px] text-tertiary">Try another</p>
          <div className="flex flex-wrap gap-2">
            {SCRIPTS.filter((script) => script.id !== timeline.script.id)
              .slice(0, 3)
              .map((script) => (
                <Chip key={script.id} onClick={() => onPick(script)}>
                  {script.chip}
                </Chip>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepRow({
  step,
  last,
  t,
  stopped,
  clock,
  reducedMotion,
  toggles,
  onToggle,
}: {
  step: TStep;
  last: boolean;
  t: number;
  stopped: boolean;
  clock: RunClock;
  reducedMotion: boolean;
  toggles: Record<string, boolean>;
  onToggle: (id: string, open: boolean) => void;
}) {
  const status = statusAt(step.start, step.end, t, stopped);
  const started = t >= step.start;
  const tools = step.tools.filter((tool) => t >= tool.start);
  const showAgents = step.agents.length > 0 && t >= step.start + 0.05;

  return (
    <li className={cn("ar-in relative ps-[26px]", last ? "pb-0" : "pb-3")}>
      {!last ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute start-[6.5px] top-[21px] bottom-[3px] w-px transition-[background-color] duration-500 ease-out",
            status === "done" ? "bg-line-firm" : "bg-border",
          )}
        />
      ) : null}
      <span className="absolute start-0 top-[3px] flex">
        <StatusIcon key={status} status={status} />
      </span>
      <div className="flex min-h-5 items-baseline gap-3">
        <span
          className={cn(
            "text-[13.5px] leading-5 tracking-[-0.005em] transition-[color] duration-300 ease-out",
            status === "pending" ? "text-tertiary" : status === "done" ? "text-secondary" : "text-primary",
          )}
        >
          {step.label}
          <span className="sr-only">
            {status === "done" ? ", done" : status === "running" ? ", in progress" : status === "stopped" ? ", stopped" : ", to do"}
          </span>
        </span>
        {step.agents.length && started ? (
          <span className="ar-fade text-[12px] text-tertiary max-sm:hidden">{step.agents.length} sub-agents</span>
        ) : null}
        {status === "done" ? (
          <span className="ar-mono ar-fade ms-auto text-[11px] text-tertiary">{formatSeconds(step.end - step.start)}</span>
        ) : null}
      </div>

      {tools.length ? (
        <div className="-mx-1.5 mt-1 flex flex-col">
          {tools.map((tool) => {
            const open = toggles[tool.id] ?? autoOpen(tool, t);
            return <ToolRow key={tool.id} tool={tool} t={t} stopped={stopped} open={open} onToggle={() => onToggle(tool.id, open)} />;
          })}
        </div>
      ) : null}

      {showAgents ? <AgentsBlock step={step} t={t} stopped={stopped} clock={clock} reducedMotion={reducedMotion} /> : null}
    </li>
  );
}

const kilo = (tokens: number) => (tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens));

function AgentsBlock({ step, t, stopped, clock, reducedMotion }: { step: TStep; t: number; stopped: boolean; clock: RunClock; reducedMotion: boolean }) {
  return (
    <div className="ar-in mt-2 mb-0.5 rounded-[16px] bg-background px-2 pt-2 pb-1.5 shadow-[inset_0_0_0_1px_var(--border)] dark:bg-[color-mix(in_oklab,var(--background)_70%,var(--float))]">
      <Graph step={step} t={t} stopped={stopped} clock={clock} reducedMotion={reducedMotion} />
      <ul className="m-0 mt-2 list-none border-t border-border p-0 pt-1">
        {step.agents.map((agent) => {
          const status = statusAt(agent.start, agent.end, t, stopped);
          const activity = agentActivity(agent, t);
          return (
            <li key={agent.id} className="flex min-h-7 items-center gap-2.5 px-2 py-1 text-[12.5px] sm:py-0">
              <GlyphShape glyph={agent.spec.glyph} size={8} className={status === "pending" ? "text-tertiary" : "text-secondary"} />
              <span className={cn("w-[72px] shrink-0 truncate sm:w-[84px]", status === "pending" ? "text-tertiary" : "text-primary")}>
                {agent.spec.name}
              </span>
              <span
                key={activity}
                className={cn(
                  "ar-fade min-w-0 flex-1",
                  status === "done"
                    ? "line-clamp-2 text-[12.5px] leading-[1.35] text-secondary sm:truncate"
                    : "ar-mono truncate text-[11.5px] text-tertiary",
                )}
              >
                {status === "stopped" ? "stopped" : activity}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {status === "done" ? (
                  <span className="ar-mono ar-fade text-[11px] text-tertiary max-sm:hidden">
                    {kilo(agent.spec.tokens)} · {formatSeconds(agent.end - agent.start)}
                  </span>
                ) : null}
                <CallStatus status={status} size={12} />
                <span className="sr-only">{status === "done" ? ", done" : status === "running" ? ", working" : ""}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Summary({ timeline, t, done, reducedMotion }: { timeline: Timeline; t: number; done: boolean; reducedMotion: boolean }) {
  const animate = !reducedMotion;
  const tokens = timeline.totalTokens;
  return (
    <section aria-label="Summary" className="ar-in mt-5 rounded-[16px] px-4 pt-3.5 pb-4 shadow-[inset_0_0_0_1px_var(--border)]">
      <div className="flex items-center gap-2">
        <StatusDot tone={done ? "done" : "live"} />
        <span className="text-[12px] text-tertiary">Summary</span>
      </div>
      <h3 className="m-0 mt-2 text-[15px] leading-[1.4] font-medium tracking-[-0.012em] text-pretty text-primary">
        <Streamed words={timeline.title} t={t} animate={animate} />
      </h3>
      <p className="m-0 mt-1.5 text-[13.5px] leading-[1.6] text-pretty text-secondary">
        <Streamed words={timeline.body} t={t} animate={animate} />
      </p>
      <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
        {timeline.bullets.map((bullet, index) =>
          t >= (bullet[0]?.at ?? Infinity) ? (
            <li key={index} className="flex gap-2.5 text-[13px] leading-[1.5] text-primary">
              <span aria-hidden="true" className="mt-[9.5px] h-px w-2.5 shrink-0 bg-line-firm" />
              <span>
                <Streamed words={bullet} t={t} animate={animate} />
              </span>
            </li>
          ) : null,
        )}
      </ul>
      {done ? (
        <div className="ar-in mt-4 flex flex-wrap items-center gap-1.5" style={{ animationDelay: "120ms" }}>
          {[
            formatSeconds(timeline.end),
            `${callsDone(timeline, t)} tool calls`,
            `${timeline.agentCount} sub-agents`,
            `${formatTokens(tokens)} tokens`,
          ].map((label) => (
            <span key={label} className="ar-mono inline-flex h-6 items-center rounded-[7px] bg-well px-2 text-[11px] text-secondary">
              {label}
            </span>
          ))}
          <span className="inline-flex h-6 items-center rounded-[7px] px-2 text-[11px] text-tertiary shadow-[inset_0_0_0_1px_var(--line-dash)]">
            Simulated, nothing was sent
          </span>
        </div>
      ) : null}
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* tile                                                                    */
/* ---------------------------------------------------------------------- */

const TILE_W = 204;
const TILE_H = 252;
const HOLD = 2.8;
const SWAP = 0.45;

function Tile({ active, reducedMotion }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(rootRef);
  const [clock] = useState(() => new RunClock());
  const timelines = useMemo(() => SCRIPTS.map((script) => compile({ ...script, task: script.short ?? script.task }, TILE_PACE)), []);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<View>({ t: 0, state: "running" });
  const [out, setOut] = useState(false);
  const phase = useRef<{ kind: "run" | "hold" | "out"; time: number }>({ kind: "run", time: 0 });
  const lastKey = useRef("");

  // Load a run into the clock (a finished one for reduced motion).
  useIsoLayoutEffect(() => {
    const current = timelines[index % timelines.length];
    clock.timeline = current;
    clock.t = reducedMotion ? current.end : 0;
    clock.state = reducedMotion ? "done" : "running";
    phase.current = { kind: reducedMotion ? "hold" : "run", time: 0 };
    lastKey.current = "";
    setView({ t: clock.t, state: clock.state });
    setOut(false);
  }, [index, reducedMotion, timelines, clock]);

  useFrame(active && !reducedMotion, (dt) => {
    const current = clock.timeline;
    if (!current) return;
    const p = phase.current;
    if (p.kind === "run") {
      clock.t = Math.min(current.end, clock.t + dt);
      if (clock.t >= current.end) {
        clock.state = "done";
        phase.current = { kind: "hold", time: 0 };
      }
    } else if (p.kind === "hold") {
      p.time += dt;
      if (p.time > HOLD) {
        phase.current = { kind: "out", time: 0 };
        setOut(true);
      }
    } else {
      p.time += dt;
      if (p.time > SWAP) {
        phase.current = { kind: "run", time: 0 };
        setIndex((value) => value + 1);
        return;
      }
    }
    clock.emit(dt);
    const key = `${viewKey(current, clock.t, false)}|${clock.state}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      setView({ t: clock.t, state: clock.state });
    }
  });

  const timeline = timelines[index % timelines.length];
  const scale = width && height ? Math.min(width / TILE_W, height / TILE_H) : 0;

  return (
    <div ref={rootRef} aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {scale ? (
        <div
          className="absolute top-1/2 left-1/2 p-[16px]"
          style={{ width: TILE_W, height: TILE_H, transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})` }}
        >
          <TileCard timeline={timeline} view={view} clock={clock} out={out} reducedMotion={reducedMotion} />
        </div>
      ) : null}
    </div>
  );
}

function TileCard({
  timeline,
  view,
  clock,
  out,
  reducedMotion,
}: {
  timeline: Timeline;
  view: View;
  clock: RunClock;
  out: boolean;
  reducedMotion: boolean;
}) {
  const { t } = view;
  const done = view.state === "done";
  const planning = t < timeline.planEnd;
  const step = currentStep(timeline, t) ?? timeline.steps[0];
  const status = done ? "Done" : planning ? "Planning" : `Step ${step.index + 1} of ${timeline.steps.length}`;
  const last = timeline.steps.length - 1;
  const readTokens = () => (clock.timeline ? tokensAt(clock.timeline, clock.t) : 0);
  const readTime = () => formatSeconds(clock.t);

  return (
    <div className="ar-tile-card flex size-full flex-col overflow-hidden rounded-[15px]">
      <div className="flex h-[27px] shrink-0 items-center gap-[6px] border-b border-border px-[10px]">
        <AgentMark size={13} live={!done} />
        <span className="text-[10px] leading-none font-medium text-primary">Agent</span>
        <span className="flex min-w-0 items-center gap-[4px]">
          <StatusDot tone={done ? "done" : "live"} size={4} />
          <span
            key={status}
            className={cn(
              "ar-fade truncate text-[9px] leading-[1.2]",
              planning ? "ar-shimmer" : done ? "text-primary" : "text-secondary",
            )}
          >
            {status}
          </span>
        </span>
        <Timer clock={clock} read={readTime} className="ms-auto text-[8.5px] leading-none text-tertiary" />
      </div>

      <div className="ar-swap flex min-h-0 flex-1 flex-col px-[10px] pt-[9px]" data-out={out ? "" : undefined}>
        <div className="flex justify-end ps-4">
          <p className="m-0 truncate rounded-[8px] rounded-ee-[3px] bg-well px-[7px] py-[3.5px] text-[9px] leading-[1.3] text-primary">
            {timeline.task}
          </p>
        </div>

        <ol className="m-0 mt-[10px] flex list-none flex-col gap-[6px] p-0">
          {timeline.steps.map((s) => {
            const stepStatus = planning ? "pending" : statusAt(s.start, s.end, t, false);
            const tool = s.tools[0];
            const outcome = s.index === last && done;
            const open = stepStatus === "running" || outcome;
            return (
              <li
                key={s.id}
                className="relative ps-[15px] transition-[opacity] duration-500 ease-out"
                style={{ opacity: planning ? 0.55 : 1 }}
              >
                <span className="absolute start-0 top-[1.5px] flex">
                  <StatusIcon key={stepStatus} status={stepStatus} size={9} />
                </span>
                <span
                  className={cn(
                    "block truncate text-[9.5px] leading-[12px] transition-[color] duration-300",
                    stepStatus === "pending" ? "text-tertiary" : stepStatus === "done" ? "text-secondary" : "text-primary",
                  )}
                >
                  {s.label}
                </span>
                {s.agents.length ? (
                  // The graph is always there: dashed while it waits, live, then merged.
                  <div className="mt-[5px] pe-[1px]">
                    <Graph step={s} t={t} stopped={false} clock={clock} size="tile" reducedMotion={reducedMotion} />
                  </div>
                ) : tool ? (
                  <div className="ar-collapse" data-open={open ? "" : undefined}>
                    <div>
                      {outcome ? (
                        <div key="outcome" className="ar-in mt-[4px] flex h-[15px] items-center gap-[5px] rounded-[5px] px-[5px] shadow-[inset_0_0_0_1px_var(--border)]">
                          <span className="size-[4px] shrink-0 rounded-full bg-status" />
                          <span className="min-w-0 flex-1 truncate text-[8px] text-primary">{timeline.script.outcome}</span>
                        </div>
                      ) : (
                        <div key="call" className="mt-[4px] flex h-[15px] items-center gap-[4px] rounded-[5px] bg-well/60 px-[5px]">
                          <span className="ar-mono shrink-0 text-[7.5px] text-primary">{tool.spec.name}</span>
                          <span className="ar-mono min-w-0 flex-1 truncate text-[7.5px] text-tertiary">{tool.line}</span>
                          <CallStatus status={t < tool.end ? "running" : "done"} size={7} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex h-[24px] shrink-0 items-center gap-[4px] border-t border-border px-[10px]">
        <Odometer clock={clock} read={readTokens} columns={digitsFor(timeline.totalTokens)} reducedMotion={reducedMotion} className="text-[8.5px] text-primary" />
        <span className="text-[8px] text-tertiary">tokens</span>
        <span className="ms-auto flex items-center gap-[4px] text-[8px] text-tertiary">
          <GlyphShape glyph="circle" size={4} className={done ? "text-status" : "text-[var(--ar-live)]"} />
          {timeline.agentCount} sub-agents
        </span>
      </div>
    </div>
  );
}
