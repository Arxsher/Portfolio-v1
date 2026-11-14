"use client";

// "Fold a paper plane": the send flow the command bar shows in its
// guestbook panel.
//
//   1. Write   a sheet of paper with a doodle pad, a short note (120) and
//              your name. Enter (or "Fold") checks it.
//   2. Fold    the sheet settles into the note people will read, then folds
//              itself into a plane, step by step (planes/stage.ts).
//   3. Throw   drag the plane and flick it (the flick's speed decides the
//              arc), tap it, or press Enter. It flies off across the page
//              (planes/flight.ts) while the note is saved; once stored it
//              joins the sky on the home page and /guestbook.
//
// Honest states throughout: errors keep the note so nothing is lost and
// the plane comes back for another try; without Supabase the whole thing
// still plays as a preview, and says plainly that nothing was saved.
//
// The panel chrome around it (icon tile, title, close button) belongs to
// the command bar; GUESTBOOK_PANEL has the title and description to use.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { GUESTBOOK_LIMITS, GuestbookError, cleanEntry, type NewGuestbookEntry } from "@/lib/guestbook";
import { cn } from "@/lib/cn";
import { useGuestbookClient, useGuestbookCount } from "./data";
import { Odometer } from "./odometer";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";
import { PlaneGlyph, usePaletteName, useReducedMotion } from "./sky";
import { flatPaperCss } from "./planes/draw";
import { paperIndexFor, planeLook, readPageTokens } from "./planes/look";
import { formatPlaneDate } from "./planes/sky";
import { primePaperSound } from "./planes/sound";
import { FoldStage, type StagePhase } from "./planes/stage";

/** Copy for the panel header the command bar renders above the form. */
export const GUESTBOOK_PANEL = {
  title: "Fold a paper plane",
  description: "Write a note, add a doodle, then fold it and throw it into the sky.",
} as const;

/** How long "Sent" shows before the panel closes. */
const DONE_DELAY = 2300;

type Step = "write" | "plane";
type Send = "idle" | "sending" | "sent" | "preview" | "failed";

const solidButton =
  "relative inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-ink px-4 text-[14px] font-medium text-on-ink transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] disabled:cursor-default disabled:opacity-50 disabled:active:scale-100 focus-ring";
const softButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px] bg-tile px-3.5 text-[14px] text-primary transition-[background-color,scale] duration-150 ease-out hover:bg-tile-hover active:scale-[0.96] disabled:cursor-default disabled:opacity-50 focus-ring";
const paperField =
  "w-full rounded-[6px] bg-transparent text-[var(--paper-ink)] caret-[var(--paper-ink)] outline-none placeholder:text-[var(--paper-muted)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[color-mix(in_oklab,var(--paper-ink)_45%,transparent)] read-only:cursor-default";

export function GuestbookSignForm({
  onDone,
  prefill,
}: {
  onDone?: () => void;
  /** Optional starting values, e.g. from what was typed in the palette. */
  prefill?: { name?: string; message?: string };
}) {
  const client = useGuestbookClient();
  const count = useGuestbookCount();
  const palette = usePaletteName();
  const reduced = useReducedMotion();
  const id = useId();
  const ids = {
    name: `${id}-name`,
    message: `${id}-message`,
    doodle: `${id}-doodle`,
    status: `${id}-status`,
    counter: `${id}-counter`,
    hint: `${id}-hint`,
  };

  const [name, setName] = useState(() => (prefill?.name ?? "").slice(0, GUESTBOOK_LIMITS.name));
  const [message, setMessage] = useState(() => (prefill?.message ?? "").slice(0, GUESTBOOK_LIMITS.message));
  const [doodle, setDoodle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("write");
  const [phase, setPhase] = useState<StagePhase>("idle");
  const [send, setSend] = useState<Send>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [today] = useState(() => formatPlaneDate(new Date().toISOString()));

  const pad = useRef<SignaturePadHandle>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeButton = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<FoldStage | null>(null);
  const entryRef = useRef<NewGuestbookEntry | null>(null);
  const dragMoved = useRef(false);
  /** Did the last press start on the plane (not the empty table around it)? */
  const pressOnPlane = useRef(false);
  const mounted = useRef(true);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const look = useMemo(() => (typeof document === "undefined" ? planeLook(palette) : planeLook(palette, readPageTokens())), [palette]);
  const paperStyle = useMemo(() => {
    const ink = look.ink;
    return {
      "--paper": flatPaperCss(look, look.papers[0]),
      "--paper-ink": ink,
      "--paper-soft": look.inkSoft,
      "--paper-muted": look.inkMuted,
      "--paper-line": `color-mix(in oklab, ${ink} 16%, transparent)`,
      background: "var(--paper)",
      boxShadow: `3px 10px 14px -2px ${look.shadow}, 0 0 0 1px color-mix(in oklab, ${ink} 7%, transparent)`,
    } as React.CSSProperties;
  }, [look]);

  /* the stage ---------------------------------------------------------- */

  const onThrow = useCallback(() => {
    const entry = entryRef.current;
    if (!entry) return;
    if (!client.enabled) {
      setSend("preview");
      return;
    }
    setSend("sending");
    setSendError(null);
    client.create(entry).then(
      () => {
        if (!mounted.current) return;
        setSend("sent");
      },
      (problem: unknown) => {
        if (!mounted.current) return;
        setSendError(problem instanceof GuestbookError ? problem.message : "Your plane didn't make it. Please try again.");
        setSend("failed");
      },
    );
  }, [client]);

  const onThrowRef = useRef(onThrow);
  useEffect(() => {
    onThrowRef.current = onThrow;
  }, [onThrow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stage = new FoldStage(canvas, {
      onPhase: (next) => {
        setPhase(next);
        if (next === "flat") {
          // Unfolded: the paper hands back to the form.
          setStep("write");
          stage.clear();
        }
      },
      onThrow: () => onThrowRef.current(),
    });
    stageRef.current = stage;
    return () => {
      stage.destroy();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => stageRef.current?.setLook(look), [look]);
  useEffect(() => stageRef.current?.setReducedMotion(reduced), [reduced]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const rect = box.getBoundingClientRect();
      stageRef.current?.setSize(Math.round(rect.width), Math.round(rect.height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Keyboard users land on the plane once it is folded (the Fold button
  // they pressed has just gone away).
  useEffect(() => {
    if (phase !== "ready" || step !== "plane") return;
    const active = document.activeElement;
    if (!active || active === document.body || active.closest("[data-fold-row]")) planeButton.current?.focus({ preventScroll: true });
  }, [phase, step]);

  // Once thrown, focus follows the story: the status while it flies, then
  // the next thing to do ("Fold another", "Try again").
  useEffect(() => {
    if (step !== "plane" || phase !== "thrown") return;
    const active = document.activeElement;
    const hadFocus =
      !active || active === document.body || active === planeButton.current || active === noteRef.current || active.closest("[data-fold-row]");
    if (!hadFocus) return;
    if (send === "preview" || send === "failed") actionRef.current?.focus({ preventScroll: true });
    else noteRef.current?.focus({ preventScroll: true });
  }, [phase, step, send]);

  // After "Sent": close the panel and start fresh.
  useEffect(() => {
    if (send !== "sent") return;
    const timer = setTimeout(() => {
      onDoneRef.current?.();
      reset();
    }, DONE_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [send]);

  function reset() {
    if (!mounted.current) return;
    setName("");
    setMessage("");
    setDoodle("");
    pad.current?.clear();
    setSend("idle");
    setSendError(null);
    setError(null);
    entryRef.current = null;
    stageRef.current?.clear();
    setStep("write");
  }

  /* writing ------------------------------------------------------------ */

  function fold(event?: FormEvent) {
    event?.preventDefault();
    if (step !== "write") return;
    setError(null);
    let entry: NewGuestbookEntry;
    try {
      entry = cleanEntry({ name, message, signature: doodle });
    } catch (problem) {
      const text = problem instanceof GuestbookError ? problem.message : "Something's not right with that note.";
      setError(text);
      if (!name.trim()) nameInput.current?.focus();
      else if (!message.trim()) messageInput.current?.focus();
      return;
    }
    const stage = stageRef.current;
    const box = boxRef.current;
    const sheet = sheetRef.current;
    if (!stage || !box || !sheet) return;
    primePaperSound();
    entryRef.current = entry;
    stage.setNote(
      { name: entry.name, message: entry.message, date: today, doodle: entry.signature },
      paperIndexFor(entry, look.papers.length),
    );
    const boxRect = box.getBoundingClientRect();
    const sheetRect = sheet.getBoundingClientRect();
    stage.fold({ x: sheetRect.left - boxRect.left, y: sheetRect.top - boxRect.top, w: sheetRect.width, h: sheetRect.height });
    setSend("idle");
    setSendError(null);
    setStep("plane");
    // The field that had focus is about to go inert: keep focus on the
    // table, where the plane is being folded.
    const active = document.activeElement;
    if (active && (sheet.contains(active) || active.closest("[data-fold-row]"))) {
      requestAnimationFrame(() => planeButton.current?.focus({ preventScroll: true }));
    }
  }

  function unfold() {
    if (step !== "plane") return;
    stageRef.current?.unfold();
    setSend("idle");
  }

  function tryAgain() {
    setSend("idle");
    setSendError(null);
    stageRef.current?.comeBack();
    planeButton.current?.focus({ preventScroll: true });
  }

  function foldAnother() {
    reset();
    requestAnimationFrame(() => messageInput.current?.focus({ preventScroll: true }));
  }

  /* throwing ----------------------------------------------------------- */

  const pressAt = useRef<{ x: number; y: number } | null>(null);

  const local = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPlaneDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const stage = stageRef.current;
    if (!stage || (event.pointerType === "mouse" && event.button !== 0)) return;
    const { x, y } = local(event);
    dragMoved.current = false;
    pressOnPlane.current = stage.hits(x, y);
    if (!pressOnPlane.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    stage.grab(event.pointerId, x, y);
    pressAt.current = { x, y };
  };

  const onPlaneMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const { x, y } = local(event);
    const start = pressAt.current;
    if (start && Math.hypot(x - start.x, y - start.y) > 6) dragMoved.current = true;
    stageRef.current?.drag(event.pointerId, x, y);
  };

  const onPlaneUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const { x, y } = local(event);
    pressAt.current = null;
    stageRef.current?.release(event.pointerId, x, y);
  };

  const onPlaneClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const onPlane = pressOnPlane.current;
    pressOnPlane.current = false;
    // A drag that ended without a throw shouldn't also count as a tap.
    if (dragMoved.current) {
      dragMoved.current = false;
      return;
    }
    // Enter / Space (detail 0) always throw; a click or tap only when it
    // landed on the plane, never on the empty table around it.
    if (event.detail !== 0 && !onPlane) return;
    if (stageRef.current?.phase === "ready") stageRef.current.throwAt();
  };

  const onMessageKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      fold();
    }
  };

  /* copy --------------------------------------------------------------- */

  const enabled = client.enabled;
  const writing = step === "write";
  const ready = step === "plane" && (phase === "ready" || phase === "held");
  const thrown = step === "plane" && phase === "thrown";
  const folding = step === "plane" && (phase === "folding" || phase === "unfolding" || phase === "flat");

  let status: string | null = null;
  if (writing) status = error ?? (!enabled ? "Paper planes aren't connected yet, so this one won't be saved. You can still fold it and throw it." : null);
  else if (send === "failed") status = sendError;

  let stageNote: { title: string; body: string } | null = null;
  if (thrown) {
    if (send === "sending") stageNote = { title: "Off it goes…", body: "Saving your note." };
    else if (send === "sent") stageNote = { title: "Sent.", body: "Your plane is in the sky now." };
    else if (send === "preview") stageNote = { title: "Nice throw!", body: "It wasn't saved, because paper planes aren't connected yet." };
    else if (send === "failed") stageNote = { title: "It didn't make it.", body: "Your note is safe here. Try again in a moment." };
  }

  const messageLength = [...message].length;

  return (
    <form onSubmit={fold} aria-describedby={status ? ids.status : undefined} noValidate>
      <div ref={boxRef} className="relative">
        {/* 1. the sheet you write on */}
        <div
          ref={sheetRef}
          inert={!writing}
          aria-hidden={!writing || undefined}
          style={paperStyle}
          className={cn(
            "relative rounded-[4px] px-3.5 pt-3 pb-3 transition-opacity ease-out sm:px-4",
            // Fold hands the paper to the canvas, which draws the same sheet
            // in the same place on its first frame: hide this one at once.
            writing ? "opacity-100 duration-200" : "pointer-events-none opacity-0 duration-0",
          )}
        >
          <span id={ids.doodle} className="sr-only">
            Doodle
          </span>
          <SignaturePad
            ref={pad}
            labelledBy={ids.doodle}
            name={name}
            onNeedName={() => {
              setError("Add your name first, then you can sign with it.");
              nameInput.current?.focus();
            }}
            disabled={!writing}
            canvasClassName="h-[136px] sm:h-[118px]"
            onChange={(path) => {
              setDoodle(path);
              if (path && error) setError(null);
            }}
          />
          <div className="relative mt-1.5">
            <label htmlFor={ids.message} className="sr-only">
              Note
            </label>
            <textarea
              ref={messageInput}
              id={ids.message}
              name="message"
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value.replace(/\n/g, " "))}
              onKeyDown={onMessageKeyDown}
              placeholder="Write a short note…"
              maxLength={GUESTBOOK_LIMITS.message}
              autoComplete="off"
              enterKeyHint="done"
              required
              readOnly={!writing}
              aria-describedby={ids.counter}
              className={cn(paperField, "block resize-none pe-12 text-[16px] leading-[1.45] text-[var(--paper-soft)] sm:text-[15px]")}
            />
            <span
              id={ids.counter}
              className={cn(
                "pointer-events-none absolute end-0 bottom-0.5 text-[11px] tabular-nums",
                messageLength >= GUESTBOOK_LIMITS.message ? "text-[var(--paper-ink)]" : "text-[var(--paper-muted)]",
              )}
            >
              <span className="sr-only">Characters used: </span>
              {messageLength}/{GUESTBOOK_LIMITS.message}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 border-t border-dashed border-[var(--paper-line)] pt-2.5">
            <span aria-hidden="true" className="text-[14px] text-[var(--paper-ink)]">
              —
            </span>
            <label htmlFor={ids.name} className="sr-only">
              Your name
            </label>
            <input
              ref={nameInput}
              id={ids.name}
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="your name"
              maxLength={GUESTBOOK_LIMITS.name}
              autoComplete="nickname"
              enterKeyHint="go"
              required
              readOnly={!writing}
              className={cn(paperField, "min-w-0 flex-1 text-[16px] font-medium sm:text-[14px]")}
            />
            <span className="shrink-0 text-[12px] text-[var(--paper-muted)] tabular-nums">{today}</span>
          </div>
        </div>

        {/* 2. the folding table */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        />
        <button
          ref={planeButton}
          type="button"
          tabIndex={ready || folding ? 0 : -1}
          aria-hidden={!(ready || folding) || undefined}
          aria-disabled={!ready || undefined}
          aria-label="Your paper plane. Press Enter to throw it, or drag it and let go with a flick."
          aria-describedby={ids.hint}
          onPointerDown={onPlaneDown}
          onPointerMove={onPlaneMove}
          onPointerUp={onPlaneUp}
          onPointerCancel={onPlaneUp}
          onClick={onPlaneClick}
          className={cn(
            "absolute inset-0 rounded-[14px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            ready || phase === "held" ? "cursor-grab touch-none active:cursor-grabbing" : "pointer-events-none",
          )}
        />
        {stageNote ? (
          <div
            ref={noteRef}
            role="status"
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 flex animate-blur-in flex-col items-center justify-center gap-1 px-6 text-center outline-none"
          >
            <p className="text-[17px] font-medium text-primary">{stageNote.title}</p>
            <p className="max-w-[36ch] text-[14px] leading-[1.45] text-pretty text-secondary">{stageNote.body}</p>
          </div>
        ) : null}
      </div>

      <p
        id={ids.status}
        role={error || send === "failed" ? "alert" : undefined}
        aria-live={error || send === "failed" ? undefined : "polite"}
        className={cn(status ? "mt-3" : "sr-only", error || send === "failed" ? "text-[14px] text-primary" : "text-[13px] text-tertiary")}
      >
        {status}
      </p>

      {/* One line, always: the hint takes what the buttons leave (two short
          lines at most on a phone), so the panel never changes height as
          "Fold" turns into "Unfold" + "Throw". */}
      <div data-fold-row className="mt-4 flex min-h-9 flex-nowrap items-center justify-between gap-3 sm:gap-4">
        <p id={ids.hint} aria-live="polite" className="min-w-0 flex-1 text-[12px] leading-[1.35] text-pretty text-tertiary sm:text-[13px]">
          {writing ? (
            enabled ? (
              <span className="-ms-1.5 inline-flex items-center">
                <Odometer value={count} className="mx-1.5" />
                <span>{count === 1 ? "plane" : "planes"} in the sky</span>
              </span>
            ) : null
          ) : ready ? (
            <>
              <span className="pointer-coarse:hidden">Drag it and flick to throw, or press Enter.</span>
              <span className="hidden pointer-coarse:inline">Flick or tap it to throw.</span>
            </>
          ) : folding ? (
            phase === "unfolding" || phase === "flat" ? "Unfolding…" : "Folding…"
          ) : send === "sent" ? (
            "Thanks for stopping by."
          ) : (
            ""
          )}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {writing ? (
            <button key="fold" type="submit" className={solidButton}>
              <PlaneGlyph size={15} />
              Fold
            </button>
          ) : ready ? (
            <>
              <button key="unfold" type="button" onClick={unfold} className={softButton}>
                Unfold
              </button>
              <button key="throw" type="button" onClick={() => stageRef.current?.throwAt()} className={solidButton}>
                Throw
              </button>
            </>
          ) : thrown && send === "failed" ? (
            <>
              <button key="again" ref={actionRef} type="button" onClick={tryAgain} className={solidButton}>
                Try again
              </button>
            </>
          ) : thrown && send === "preview" ? (
            <button key="another" ref={actionRef} type="button" onClick={foldAnother} className={solidButton}>
              Fold another
            </button>
          ) : (
            <button key="wait" type="button" disabled className={solidButton} aria-hidden="true" tabIndex={-1}>
              {send === "sending" ? "Sending…" : send === "sent" ? "Sent" : phase === "unfolding" || phase === "flat" ? "Unfolding…" : "Folding…"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
