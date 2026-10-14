"use client";

// The "sign my guestbook" form that the command bar shows in its guestbook
// panel: name and message side by side, the signature pad, then the live
// counter and the Sign button. After a successful signature the fields
// fade out, the signature traces itself in with a short thank-you, the
// counter ticks up, and onDone runs a moment later.
//
// The panel chrome around it (icon tile, title, close button) belongs to
// the command bar; GUESTBOOK_PANEL has the title and description to use.

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { GUESTBOOK_LIMITS, GuestbookError, cleanEntry } from "@/lib/guestbook";
import { cn } from "@/lib/cn";
import { useGuestbookClient, useGuestbookCount } from "./data";
import { Odometer } from "./odometer";
import { Signature } from "./signature";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

/** Copy for the panel header the command bar renders above the form. */
export const GUESTBOOK_PANEL = {
  title: "Sign the guestbook",
  description: "Leave a note and sign it in your own hand.",
} as const;

/** How long the "signed" state shows before onDone. */
const DONE_DELAY = 1800;

const fieldClass =
  "w-full rounded-pill bg-raised px-4 py-2 text-[16px] text-primary shadow-tray outline-none transition-[box-shadow] duration-150 ease-out placeholder:text-tertiary hover:shadow-tray-hover focus:shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_45%,transparent),0_0_0_4px_color-mix(in_oklab,var(--foreground)_9%,transparent)] disabled:cursor-default disabled:opacity-60 sm:text-[15px]";

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
            "col-start-1 row-start-1 flex flex-col gap-3 transition-[opacity,translate,filter] duration-300 ease-out motion-reduce:transition-opacity",
            done && "pointer-events-none -translate-y-2 opacity-0 blur-[4px] motion-reduce:translate-y-0 motion-reduce:blur-none",
          )}
        >
          <div className="flex flex-col gap-3 min-[500px]:flex-row">
            <div className="flex flex-col gap-1.5 min-[500px]:w-[190px]">
              <label htmlFor={ids.name} className="ps-1 text-[13px] text-secondary">
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
            <div className="flex flex-col gap-1.5 min-[500px]:flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={ids.message} className="ps-1 text-[13px] text-secondary">
                  Message
                </label>
                <span
                  id={ids.counter}
                  className={cn(
                    "pe-1 text-[13px] tabular-nums transition-colors duration-150",
                    messageLength >= GUESTBOOK_LIMITS.message ? "text-primary" : "text-tertiary",
                  )}
                >
                  {messageLength}/{GUESTBOOK_LIMITS.message}
                </span>
              </div>
              <input
                ref={messageInput}
                id={ids.message}
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Say something…"
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
          <div className="flex flex-col gap-1.5">
            <span id={ids.signature} className="ps-1 text-[13px] text-secondary">
              Signature
            </span>
            <SignaturePad
              ref={pad}
              labelledBy={ids.signature}
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
            <Signature path={signed} align="center" draw className="h-[70px] w-full max-w-[260px] text-primary" />
          ) : null}
          <p
            className={cn(
              "text-[15px] transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-opacity",
              done ? "delay-200" : "translate-y-1 opacity-0 motion-reduce:translate-y-0",
            )}
          >
            <span className="font-medium text-primary">Signed.</span> You&apos;re on the wall now.
          </p>
        </div>
      </div>

      <p
        id={ids.status}
        role={error ? "alert" : undefined}
        aria-live={error ? undefined : "polite"}
        className={cn(status ? "mt-3" : "sr-only", error ? "text-[14px] text-primary" : "text-[13px] text-tertiary")}
      >
        {status}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="-ms-1.5">
          <Odometer value={enabled ? count : 0} className="mx-1.5" /> signatures so far.
        </p>
        <button
          type="submit"
          disabled={!enabled || done}
          aria-busy={sending}
          className={cn(
            "relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-pill bg-btn px-5 py-2 text-[15px] font-medium text-btn-fg outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.96] disabled:cursor-default disabled:active:scale-100",
            // While the thank-you shows the button just rests; greyed out
            // only when signing is actually unavailable.
            done ? "disabled:hover:opacity-100" : "disabled:opacity-60",
          )}
        >
          <span className={cn("transition-opacity duration-150", sending && "opacity-0")}>Sign</span>
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
