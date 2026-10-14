"use client";

// The "sign the guestbook" form that the Index sheet shows in its guestbook
// panel (DESIGN.md → Guestbook and sign form):
//
//   NAME              MESSAGE                                   0 / 120
//   [ field        ]  [ field                                         ]
//   SIGNATURE
//   ┌ ruled paper ─────────────────────────────────────────────────────┐
//   │  × · · · · · · · · · · · · · · · · · · · · · · · · · · · [Clear] │
//   └──────────────────────────────────────────────────────────────────┘
//   0083 names in the book.                                    [✦ Sign]
//
// After a successful signature the fields fade out, the signature traces
// itself in cobalt with a short thank-you, the count rolls up, and onDone
// runs a moment later.
//
// The panel chrome around it (title, back and close buttons) belongs to
// the command area; GUESTBOOK_PANEL has the title and description to use.

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Star } from "@/components/ornament";
import { GUESTBOOK_LIMITS, GuestbookError, cleanEntry } from "@/lib/guestbook";
import { cn } from "@/lib/cn";
import { useGuestbookClient, useGuestbookCount } from "./data";
import { Odometer } from "./odometer";
import { Signature } from "./signature";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

/** Copy for the panel header the command bar renders above the form. */
export const GUESTBOOK_PANEL = {
  title: "Sign the guestbook",
  description: "Write a line, then draw your name on it.",
} as const;

/** How long the "signed" state shows before onDone. */
const DONE_DELAY = 1800;

const fieldClass = "field disabled:cursor-default disabled:opacity-60";
const labelClass = "caps text-muted";

type Phase = "idle" | "sending" | "done";

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
  const id = useId();
  const ids = { name: `${id}-name`, message: `${id}-message`, signature: `${id}-signature`, status: `${id}-status`, counter: `${id}-counter` };

  const [name, setName] = useState(() => (prefill?.name ?? "").slice(0, GUESTBOOK_LIMITS.name));
  const [message, setMessage] = useState(() => (prefill?.message ?? "").slice(0, GUESTBOOK_LIMITS.message));
  const [signature, setSignature] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState<string>("");
  const pad = useRef<SignaturePadHandle>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLInputElement>(null);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // After the thank-you: hand back to the panel, and start fresh in case
  // the form stays on screen.
  useEffect(() => {
    if (phase !== "done") return;
    const timer = setTimeout(() => {
      onDoneRef.current?.();
      setName("");
      setMessage("");
      setSignature("");
      pad.current?.clear();
      setPhase("idle");
    }, DONE_DELAY);
    return () => clearTimeout(timer);
  }, [phase]);

  const enabled = client.enabled;
  const sending = phase === "sending";
  const done = phase === "done";
  const messageLength = message.length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || phase !== "idle") return;
    setError(null);

    let entry;
    try {
      entry = cleanEntry({ name, message, signature });
    } catch (problem) {
      setError(problem instanceof GuestbookError ? problem.message : "Something's not right with that note.");
      if (!name.trim()) nameInput.current?.focus();
      else if (!message.trim()) messageInput.current?.focus();
      return;
    }

    setPhase("sending");
    try {
      const saved = await client.create(entry);
      setSigned(saved.signature);
      setPhase("done");
    } catch (problem) {
      setError(problem instanceof GuestbookError ? problem.message : "Couldn't sign the guestbook. Please try again.");
      setPhase("idle");
    }
  }

  const status = !enabled
    ? "The guestbook isn't connected yet, so signing is switched off for now."
    : error;

  return (
    <form onSubmit={submit} aria-describedby={status ? ids.status : undefined}>
      <div className="grid">
        {/* the fields */}
        <div
          inert={done}
          className={cn(
            "col-start-1 row-start-1 flex flex-col gap-4 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-opacity",
            done && "pointer-events-none -translate-y-2 opacity-0 motion-reduce:translate-y-0",
          )}
        >
          <div className="flex flex-col gap-3 min-[500px]:flex-row">
            <div className="flex flex-col gap-2 min-[500px]:w-[190px]">
              <label htmlFor={ids.name} className={labelClass}>
                Name
              </label>
              <input
                ref={nameInput}
                id={ids.name}
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                maxLength={GUESTBOOK_LIMITS.name}
                autoComplete="nickname"
                enterKeyHint="next"
                required
                disabled={!enabled}
                readOnly={sending}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-2 min-[500px]:flex-1">
              <div className="flex items-end justify-between gap-2">
                <label htmlFor={ids.message} className={labelClass}>
                  Message
                </label>
                <span
                  id={ids.counter}
                  className={cn(
                    "text-caption leading-none tabular-nums transition-colors duration-150",
                    messageLength >= GUESTBOOK_LIMITS.message ? "text-terra" : "text-muted",
                  )}
                >
                  {messageLength} / {GUESTBOOK_LIMITS.message}
                  <span className="sr-only"> characters</span>
                </span>
              </div>
              <input
                ref={messageInput}
                id={ids.message}
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="A line for the book…"
                maxLength={GUESTBOOK_LIMITS.message}
                autoComplete="off"
                enterKeyHint="send"
                required
                disabled={!enabled}
                readOnly={sending}
                aria-describedby={ids.counter}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span id={ids.signature} className={labelClass}>
              Signature
            </span>
            <SignaturePad
              ref={pad}
              labelledBy={ids.signature}
              name={name}
              onNeedName={() => {
                setError("Add your name first, then you can sign with it.");
                nameInput.current?.focus();
              }}
              disabled={!enabled || sending}
              className={enabled ? undefined : "opacity-60"}
              onChange={(path) => {
                setSignature(path);
                if (path && error) setError(null);
              }}
            />
          </div>
        </div>

        {/* the thank-you, stacked in the same cell */}
        <div
          aria-hidden={!done}
          className={cn(
            "col-start-1 row-start-1 flex flex-col items-center justify-center gap-5 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-opacity",
            done ? "delay-100" : "pointer-events-none translate-y-2 opacity-0 motion-reduce:translate-y-0",
          )}
        >
          {done && signed ? (
            <Signature path={signed} align="center" draw className="h-[70px] w-full max-w-[260px] text-cobalt" />
          ) : null}
          <p
            className={cn(
              "serif-italic text-[22px] text-primary transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-opacity",
              done ? "delay-200" : "translate-y-1 opacity-0 motion-reduce:translate-y-0",
            )}
          >
            Signed. You&apos;re in the book now.
          </p>
        </div>
      </div>

      <p
        id={ids.status}
        role={error ? "alert" : undefined}
        aria-live={error ? undefined : "polite"}
        className={cn(status ? "mt-3" : "sr-only", error ? "text-small text-danger" : "text-small text-muted")}
      >
        {status}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="flex items-baseline gap-2 text-small text-body">
          <Odometer value={enabled ? count : 0} />
          <span>{count === 1 ? "name" : "names"} in the book.</span>
        </p>
        <button
          type="submit"
          disabled={!enabled || done}
          aria-busy={sending}
          className={cn(
            "btn btn-solid shrink-0",
            // While the thank-you shows the button just rests; faded only
            // when signing is actually unavailable.
            done && "disabled:opacity-100",
          )}
        >
          <span className={cn("inline-flex items-center gap-2 transition-opacity duration-150", sending && "opacity-0")}>
            <Star size={13} className="text-terra-fill" />
            Sign
          </span>
          {sending ? (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <Spinner />
            </span>
          ) : null}
          <span className="sr-only" aria-live="polite">
            {sending ? "Signing…" : ""}
          </span>
        </button>
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin motion-reduce:animate-none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
