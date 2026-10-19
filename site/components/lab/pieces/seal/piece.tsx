"use client";

// Seal: hold to press a wax seal onto a letter, then break it.
//
// Look. A real-paper envelope seen from the back, lying on the tile: cotton
// paper with grain, cloudy formation and fibres (drawn in code), a top
// flap whose fold catches the light and whose edges cast a soft shadow on
// the pocket, a printed oxblood lining inside. Ivory by day, charcoal by
// night. The wax is deep sealing red, shaded per pixel from a height
// field (see wax.ts): glossy and bright while molten, satin once set, with
// the arsher mark, a ring of beads and a border ring pressed into it. The
// stamp is a walnut handle on a turned brass head.
//
// Motion. Hold the button (or the envelope, or Space / Enter): the ring
// fills, the button sinks under the pressure, the stamp comes down out of
// the air, slowing, and starts to tremble over the last third. Let go
// early and it all eases back. Hold to the end and the stamp drops, lands
// with a squash and a thunk, the wax squeezes out on a spring, the stamp
// lifts away and the wax cools. A chip then counts down the twenty-four
// hours until it opens on its own (as on sealed., the confessions game in
// the work list). Click the seal to break it early: cracks run out from
// where you struck, the pieces pop off and scatter, the flap swings open
// and the letter slides out.
//
// Tile: the same scene, small, stamping and breaking in a loop.
// Reduced motion: no stamp flight, no tremble, no flying pieces; each
// state cross-fades into the next. The tile shows the sealed envelope.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { ensureAudio } from "../../audio";
import { useCanvas2D, useFrame, useIsoLayoutEffect, useLatest, usePointer } from "../../hooks";
import { Reset } from "../../lab-icons";
import type { PieceProps } from "../../types";
import { IconButton, MuteButton, StageControls, StageHint, Tray, TrayButton, TrayDivider, trayClass } from "../../ui";
import { HOLD_SECONDS, SealEngine, type Phase } from "./engine";
import type { LetterCopy } from "./scene";

export default function Piece(props: PieceProps) {
  return props.mode === "stage" ? <Stage {...props} /> : <Tile {...props} />;
}

/* ---------------------------------------------------------------------- */
/* time and copy                                                           */
/* ---------------------------------------------------------------------- */

const DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "arsher:lab:seal";

function readSealedAt(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const at = Number(JSON.parse(raw)?.at);
    return Number.isFinite(at) && at > 0 && at <= Date.now() + 60_000 ? at : null;
  } catch {
    return null;
  }
}

function writeSealedAt(at: number | null) {
  try {
    if (at === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify({ at }));
  } catch {}
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "23:59:41" */
function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad2(Math.floor(total / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`;
}

function sealedOn(at: number): string {
  try {
    const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(at);
    const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
    return `${date}, ${time}`;
  } catch {
    return "";
  }
}

function letterFor(sealedAt: number, remaining: number): LetterCopy {
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.ceil(remaining / 60_000);
  let body: string;
  if (remaining <= 0) body = "You waited the whole twenty-four hours for this. Most people never do, so thank you.";
  else if (hours >= 1)
    body = `Meant to stay sealed for another ${hours} hour${hours === 1 ? "" : "s"}. You opened it anyway. Curiosity usually wins.`;
  else if (minutes > 1) body = `Only ${minutes} minutes to go, and you still couldn't wait. Fair enough.`;
  else body = "Opened a few seconds early. Close enough, it counts.";
  return { date: sealedOn(sealedAt), title: "Some things keep better under wax.", body, sign: "— arsher" };
}

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

const RING = 2 * Math.PI * 6.25;

function Stage({ active, reducedMotion, theme }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { canvasRef, ctxRef, size } = useCanvas2D({ mode: "stage" });
  const engineRef = useRef<SealEngine | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sealedAt, setSealedAt] = useState<number | null>(null);
  const [openedWith, setOpenedWith] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [announce, setAnnounce] = useState("");
  /** A finger, mouse button or key is down on the hold right now. */
  const [held, setHeld] = useState(false);
  const buttonId = useId();
  const ringRef = useRef<SVGCircleElement>(null);
  const pressPhase = useRef<Phase | null>(null);
  const canvasHold = useRef(false);
  const sealedAtRef = useLatest(sealedAt);

  const wake = useFrame(active, (dt) => engineRef.current?.step(dt) ?? false);

  // Hold feedback straight to the DOM (no re-render per frame).
  const onHold = useCallback((progress: number, tremble: number) => {
    const ring = ringRef.current;
    if (ring) ring.style.strokeDashoffset = String(RING * (1 - progress));
    const button = document.getElementById(buttonId);
    if (!button) return;
    if (progress <= 0.001 || progress >= 1) {
      button.style.scale = "";
      button.style.translate = "";
      return;
    }
    const t = performance.now() / 1000;
    const press = 1 - 0.07 * (1 - (1 - progress) * (1 - progress));
    const j = tremble * tremble * 0.9;
    button.style.scale = String(press);
    button.style.translate = `${(Math.sin(t * 73) * j).toFixed(2)}px ${(Math.sin(t * 91 + 1.7) * j).toFixed(2)}px`;
  }, [buttonId]);

  const onPhase = useCallback(
    (next: Phase) => {
      setPhase(next);
      if (next === "sealed") {
        const at = sealedAtRef.current ?? Date.now();
        if (sealedAtRef.current === null) {
          setSealedAt(at);
          writeSealedAt(at);
          setAnnounce("Sealed. It opens on its own in 24 hours. Press the button again, or click the seal, to break it.");
        }
        setNow(Date.now());
      } else if (next === "breaking" || (next === "open" && reducedMotion)) {
        // Opened: nothing left to keep for next time.
        writeSealedAt(null);
        setAnnounce("The seal breaks and the letter slides out.");
      } else if (next === "idle") {
        setSealedAt(null);
        setOpenedWith(null);
        writeSealedAt(null);
        const ring = ringRef.current;
        if (ring) ring.style.strokeDashoffset = String(RING);
      }
    },
    [sealedAtRef, reducedMotion],
  );
  const onPhaseRef = useLatest(onPhase);
  const onHoldRef = useLatest(onHold);

  // The engine, once the canvas has a size.
  useIsoLayoutEffect(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !size.width || !size.height) return;
    const reserve = size.width < 640 ? { top: 54, bottom: 74 } : { top: 62, bottom: 100 };
    if (!engineRef.current) {
      const engine = new SealEngine(ctx, size.width, size.height, size.dpr, {
        mode: "stage",
        theme,
        reducedMotion,
        reserve,
        onPhase: (p) => onPhaseRef.current(p),
        onHold: (p, t) => onHoldRef.current(p, t),
      });
      engineRef.current = engine;
      // A seal pressed earlier (in this browser) is still sealed.
      const at = readSealedAt();
      if (at !== null) {
        setSealedAt(at);
        sealedAtRef.current = at;
        engine.showSealed();
      }
    } else {
      engineRef.current.setReserve(reserve);
      engineRef.current.resize(size.width, size.height, size.dpr);
    }
    engineRef.current.invalidate();
    wake();
  }, [size.width, size.height, size.dpr]);

  useEffect(
    () => () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    },
    [],
  );

  useEffect(() => {
    engineRef.current?.setTheme(theme);
    wake();
  }, [theme, wake]);

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion);
    wake();
  }, [reducedMotion, wake]);

  // Fonts: draw the letter again once Geist is in.
  useEffect(() => {
    let live = true;
    document.fonts?.ready
      .then(() => {
        if (!live) return;
        engineRef.current?.refreshFont();
        wake();
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [wake]);

  // Inactive (scrolled away, hidden tab): let go of any hold.
  useEffect(() => {
    if (active) return;
    engineRef.current?.holdEnd();
    canvasHold.current = false;
    setHeld(false);
  }, [active]);

  // The countdown, once a second while sealed; it opens on its own at zero.
  useEffect(() => {
    if (!active || phase !== "sealed" || sealedAt === null) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= sealedAt + DAY) {
        engineRef.current?.setLetter(letterFor(sealedAt, 0));
        setOpenedWith(0);
        engineRef.current?.breakSeal();
        wake();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active, phase, sealedAt, wake]);

  const remaining = sealedAt === null ? DAY : Math.max(0, sealedAt + DAY - now);

  /* input ----------------------------------------------------------------- */

  const breakAt = (at?: [number, number]) => {
    const engine = engineRef.current;
    if (!engine || engine.phase !== "sealed") return;
    const at0 = sealedAtRef.current ?? Date.now();
    const left = Math.max(0, at0 + DAY - Date.now());
    engine.setLetter(letterFor(at0, left));
    setOpenedWith(left);
    engine.breakSeal(at);
    wake();
  };

  const primary = (source: "pointer" | "key" | "click") => {
    const engine = engineRef.current;
    if (!engine) return;
    ensureAudio();
    const current = engine.phase;
    if (current === "idle" || current === "holding") {
      if (source === "click") engine.sealNow();
      else if (engine.holdStart()) setHeld(true);
    } else if (current === "sealed") breakAt();
    else if (current === "open" || current === "breaking") engine.reset();
    wake();
  };

  const release = () => {
    engineRef.current?.holdEnd();
    setHeld(false);
    wake();
  };

  const buttonHandlers = {
    onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
      if (event.button !== 0) return;
      const engine = engineRef.current;
      if (!engine) return;
      pressPhase.current = engine.phase;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
      if (engine.phase === "idle" || engine.phase === "holding") primary("pointer");
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
    onClick(event: ReactMouseEvent<HTMLButtonElement>) {
      const engine = engineRef.current;
      if (!engine) return;
      // Assistive tech clicks without a press: act at once.
      if (event.detail === 0) {
        primary("click");
        return;
      }
      const started = pressPhase.current;
      pressPhase.current = null;
      if (started && started === engine.phase && (started === "sealed" || started === "open" || started === "breaking")) primary("pointer");
    },
    onKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      if (event.repeat) return;
      primary("key");
    },
    onKeyUp(event: ReactKeyboardEvent<HTMLButtonElement>) {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      release();
    },
    onBlur: release,
  };

  // Press and hold the envelope itself; click the seal to break it.
  usePointer(rootRef, {
    onDown(state) {
      const engine = engineRef.current;
      if (!engine) return;
      ensureAudio();
      const over = engine.pointer(state.x, state.y, true);
      if (over === "seal") breakAt([state.x, state.y]);
      else if (over === "envelope" && engine.holdStart()) {
        canvasHold.current = true;
        setHeld(true);
      }
      wake();
    },
    onMove(state) {
      const engine = engineRef.current;
      const canvas = canvasRef.current;
      if (!engine || !canvas) return;
      const over = engine.pointer(state.x, state.y, true);
      canvas.style.cursor = over ? "pointer" : "";
      wake();
    },
    onUp() {
      if (!canvasHold.current) return;
      canvasHold.current = false;
      release();
    },
    onLeave() {
      engineRef.current?.pointer(0, 0, false);
      if (canvasRef.current) canvasRef.current.style.cursor = "";
      wake();
    },
  });

  /* render ---------------------------------------------------------------- */

  const sealed = phase === "sealed";
  const opened = phase === "breaking" || phase === "open";
  const label =
    phase === "idle" || (phase === "holding" && !held)
      ? "Hold to seal"
      : phase === "holding"
        ? "Keep holding"
        : phase === "pressing"
          ? "Sealing"
          : sealed
            ? "Break seal"
            : "Seal another";

  const description = sealed
    ? `An envelope sealed with red wax, the arsher mark pressed into it. It opens on its own in ${clock(remaining)}.`
    : opened
      ? "The seal is broken and the letter is out. It reads: Some things keep better under wax."
      : "An envelope, closed but not sealed, lying on the table.";

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 select-none overflow-hidden"
      onPointerDownCapture={() => ensureAudio()}
      onContextMenu={(event) => {
        if (event.target === canvasRef.current) event.preventDefault();
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full"
        style={{ touchAction: "pan-y", WebkitTouchCallout: "none" }}
      />

      <p className="sr-only">{description}</p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="top">
        <Countdown phase={phase} remaining={remaining} openedWith={openedWith} />
      </StageControls>

      <StageControls placement="bottom">
        <Tray label="Seal">
          <TrayButton
            id={buttonId}
            variant="solid"
            aria-describedby={`${buttonId}-hint`}
            aria-disabled={phase === "pressing" || phase === "closing" ? true : undefined}
            icon={<ButtonIcon phase={phase} ringRef={ringRef} />}
            className="min-w-[138px] touch-none"
            style={{ WebkitTouchCallout: "none" }}
            {...buttonHandlers}
          >
            {label}
          </TrayButton>
          <TrayDivider />
          <IconButton
            label="Start over"
            disabled={phase === "idle" || phase === "holding" || phase === "pressing" || phase === "closing"}
            onClick={() => {
              engineRef.current?.reset();
              // This button disables itself once back at rest: keep focus on the main one.
              document.getElementById(buttonId)?.focus();
              wake();
            }}
          >
            <Reset size={16} />
          </IconButton>
          <MuteButton />
        </Tray>
        <span id={`${buttonId}-hint`} className="sr-only">
          {sealed || opened ? "" : `Press and hold for ${HOLD_SECONDS} seconds, or hold Space or Enter.`}
        </span>
        <StageHint className="max-sm:hidden">
          {sealed ? "Click the seal to break it" : opened ? "Start over to seal another" : "Hold the button, or press and hold the envelope"}
        </StageHint>
      </StageControls>
    </div>
  );
}

/** The ring that fills while you hold; a wax dot once sealed; a crack to break; a turn arrow to start over. */
function ButtonIcon({ phase, ringRef }: { phase: Phase; ringRef: RefObject<SVGCircleElement | null> }) {
  if (phase === "sealed") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
        <path
          d="M7.1 2.32A5.75 5.75 0 0 0 7.6 13.74M9.2 2.38a5.75 5.75 0 0 1-.1 11.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M8.4 2.2 7.3 5.5l1.7 1.9-1.6 2.4.9 3.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
      </svg>
    );
  }
  if (phase === "breaking" || phase === "open" || phase === "closing") return <Reset size={15} />;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="-rotate-90 shrink-0">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.75" />
      <circle
        ref={ringRef}
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray={RING}
        style={{ strokeDashoffset: phase === "pressing" ? 0 : RING }}
      />
    </svg>
  );
}

/** "Sealed · opens in 23:59:41", each digit rolling as it changes. */
function Countdown({ phase, remaining, openedWith }: { phase: Phase; remaining: number; openedWith: number | null }) {
  const show = phase === "sealed" || phase === "breaking" || phase === "open";
  if (!show) return null;
  const opened = phase !== "sealed";
  return (
    <div
      className={`${trayClass} pointer-events-none h-9 gap-2 rounded-[12px] px-3 text-[13px] animate-pop-in`}
      aria-hidden="true"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{
          background: opened ? "transparent" : "radial-gradient(circle at 35% 30%, #d0434b, #8a1018 70%)",
          boxShadow: opened ? "inset 0 0 0 1.5px #a3242c" : "inset 0 -0.5px 0 rgb(0 0 0 / 0.3)",
        }}
      />
      {opened ? (
        <span className="text-secondary">
          {openedWith === 0 ? (
            <span className="text-primary">Opened on time</span>
          ) : (
            <>
              Opened <span className="text-primary tabular-nums">{clock(openedWith ?? 0)}</span> early
            </>
          )}
        </span>
      ) : (
        <span className="text-secondary">
          <span className="text-primary">Sealed</span>
          <span className="px-1.5 text-tertiary">·</span>
          opens in <Rolling text={clock(remaining)} />
        </span>
      )}
    </div>
  );
}

/** Digits that roll down as a countdown turns (the shared lab-roll keyframes). */
function Rolling({ text }: { text: string }) {
  return (
    <span className="inline-flex overflow-hidden text-primary tabular-nums">
      {text.split("").map((ch, i) =>
        ch === ":" ? (
          <span key={`c${i}`}>:</span>
        ) : (
          <span key={`${i}-${ch}`} className="lab-roll inline-block" data-dir="down">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/* tile                                                                    */
/* ---------------------------------------------------------------------- */

function Tile({ active, reducedMotion, theme }: PieceProps) {
  const { canvasRef, ctxRef, size } = useCanvas2D({ mode: "tile" });
  const engineRef = useRef<SealEngine | null>(null);
  const wake = useFrame(active, (dt) => engineRef.current?.step(dt) ?? false);

  useIsoLayoutEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !size.width || !size.height) return;
    if (!engineRef.current) {
      engineRef.current = new SealEngine(ctx, size.width, size.height, size.dpr, {
        mode: "tile",
        theme,
        reducedMotion,
        reserve: { top: 0, bottom: 0 },
      });
    } else engineRef.current.resize(size.width, size.height, size.dpr);
    engineRef.current.invalidate();
    // Draw at least once even when the loop is idle (reduced motion).
    engineRef.current.step(0);
    wake();
  }, [size.width, size.height, size.dpr]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setTheme(theme);
    engine.step(0);
    wake();
  }, [theme, wake]);

  useEffect(
    () => () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    },
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 size-full"
      onPointerEnter={() => {
        engineRef.current?.nudge();
        wake();
      }}
    />
  );
}
