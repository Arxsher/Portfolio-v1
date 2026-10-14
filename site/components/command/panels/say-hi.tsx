"use client";

// "Write a note", the first tab of the contact sheet: name, email and a
// message, then Send.
//
// Sending goes through Web3Forms when site.web3formsKey is set. Without a
// key, Send opens the visitor's mail app with everything written out, and
// the form says so beforehand. A note typed into the Index ("hi, i'm sam,
// sam@site.com, love your work") arrives as `prefill`; the sheet shows what
// it picked up, and untouched fields keep following the prefill until they
// are edited by hand.

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Arrow } from "@/components/ornament";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import type { CommandPrefill } from "@/lib/command";
import { isEmail } from "../parse";

const LIMITS = { name: 60, email: 160, message: 2000 } as const;

type Field = "name" | "email" | "message";
type Phase = "idle" | "sending" | "sent" | "mailto" | "error";

/**
 * What was typed by hand, kept for the life of the page so closing the
 * sheet by accident (Esc, a press outside) does not throw a note away.
 * Cleared once the note has gone out.
 */
let draft: Partial<Record<Field, string>> = {};

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-small text-muted">
      {children}
    </label>
  );
}

export function WriteNote({
  prefill,
  fromTyping,
  autoFocus,
}: {
  prefill: CommandPrefill;
  /** The prefill was read from what was typed into the Index: show what was picked up. */
  fromTyping: boolean;
  autoFocus: boolean;
}) {
  const id = useId();
  const ids = { name: `${id}-name`, email: `${id}-email`, message: `${id}-message`, status: `${id}-status` };
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  // Hand edits win; untouched fields follow the prefill. A fresh prefill
  // beats an older draft of the same field.
  const [edits, setEditsState] = useState<Partial<Record<Field, string>>>(() => {
    const kept = { ...draft };
    for (const field of ["name", "email", "message"] as const) if (prefill[field]) delete kept[field];
    return kept;
  });
  const setEdits = (update: (current: Partial<Record<Field, string>>) => Partial<Record<Field, string>>) =>
    setEditsState((current) => {
      const next = update(current);
      draft = next;
      return next;
    });
  const values: Record<Field, string> = {
    name: edits.name ?? prefill.name ?? "",
    email: edits.email ?? prefill.email ?? "",
    message: edits.message ?? prefill.message ?? "",
  };
  const edit = (field: Field) => (event: { target: { value: string } }) => {
    setEdits((current) => ({ ...current, [field]: event.target.value }));
    if (invalid === field) {
      setInvalid(null);
      setError("");
    }
  };

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<Field | null>(null);
  const live = phase === "idle" || phase === "sending" || phase === "error";
  const statusRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);

  // The form and the "sent" note replace each other, and disabled fields
  // drop focus while sending. When that leaves focus on nothing, put it
  // somewhere sensible: the note, the Send button, or the next empty field.
  const lastPhase = useRef(phase);
  useEffect(() => {
    if (lastPhase.current === phase) return;
    lastPhase.current = phase;
    const current = document.activeElement;
    if (current && current !== document.body && current.isConnected) return;
    if (!live) statusRef.current?.focus({ preventScroll: true });
    else if (phase === "error") sendRef.current?.focus({ preventScroll: true });
    else if (phase === "idle") {
      const next = (["name", "email", "message"] as const).find((field) => !values[field].trim()) ?? "message";
      refs[next].current?.focus({ preventScroll: true });
    }
  });

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => {
      const first = (["name", "email", "message"] as const).find((field) => !values[field].trim()) ?? "message";
      refs[first].current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
    // Only on mount: later prefill changes must not pull focus around.
  }, []);

  function fail(field: Field, message: string) {
    setInvalid(field);
    setError(message);
    setPhase("idle");
    refs[field].current?.focus({ preventScroll: true });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "sending") return;
    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();
    if (!name) return fail("name", "Add your name, so I know who is writing.");
    if (!email) return fail("email", "Add your email, so I can write back.");
    if (!isEmail(email)) return fail("email", "That address does not look complete.");
    if (!message) return fail("message", "Write a line or two first.");
    setInvalid(null);
    setError("");

    const form = event.currentTarget;
    const trap = form.elements.namedItem("botcheck") as HTMLInputElement | null;

    if (!site.web3formsKey) {
      const subject = `Hello from ${name}`;
      const body = `${message}\n\n${name}\n${email}`;
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setPhase("mailto");
      return;
    }

    if (trap?.checked) {
      setPhase("sent");
      return;
    }

    setPhase("sending");
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: site.web3formsKey,
          subject: "New note from arsher.is-a.dev",
          from_name: name,
          name,
          email,
          message,
        }),
      });
      const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
      if (!response.ok || result?.success === false) throw new Error("rejected");
      draft = {};
      setPhase("sent");
    } catch {
      setPhase("error");
      setError(`It did not go through. Try again, or write to ${site.email}.`);
    }
  }

  const firstName = values.name.trim().split(/\s+/)[0];
  const picked = fromTyping && (prefill.name || prefill.email);
  const errorFor = (field: Field) => (invalid === field ? `${id}-error` : undefined);

  if (!live) {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-paper bg-band px-6 py-8 text-center outline-none animate-fade-up"
      >
        <p className="serif-italic text-[26px] leading-[1.15] text-primary">
          {phase === "sent" ? `Sent. Thank you${firstName ? `, ${firstName}` : ""}.` : "Over to your mail app."}
        </p>
        <p className="mx-auto mt-2 max-w-[38ch] text-[15px] leading-[1.55] text-body">
          {phase === "sent" ? (
            <>
              The note is with me. I will write back to <span className="text-primary">{values.email.trim()}</span>.
            </>
          ) : (
            <>
              A new email should be open with your note in it. If nothing happened, write to{" "}
              <span className="text-primary">{site.email}</span>.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            if (phase === "sent") setEdits(() => ({ name: values.name, email: values.email, message: "" }));
            setPhase("idle");
          }}
          className="btn btn-ghost btn-sm mt-4"
        >
          {phase === "sent" ? "Write another" : "Back to the note"}
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3.5" aria-describedby={ids.status}>
      {picked ? (
        <p className="flex flex-wrap items-center gap-1.5 text-caption text-muted">
          From what you typed:
          {prefill.name ? <span className="tag">{prefill.name}</span> : null}
          {prefill.email ? <span className="tag">{prefill.email}</span> : null}
        </p>
      ) : null}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.name}>Your name</Label>
          <input
            ref={refs.name}
            id={ids.name}
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            maxLength={LIMITS.name}
            value={values.name}
            onChange={edit("name")}
            aria-invalid={invalid === "name"}
            aria-describedby={errorFor("name")}
            disabled={phase === "sending"}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.email}>Email, for the reply</Label>
          <input
            ref={refs.email}
            id={ids.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="ada@example.com"
            maxLength={LIMITS.email}
            value={values.email}
            onChange={edit("email")}
            aria-invalid={invalid === "email"}
            aria-describedby={errorFor("email")}
            disabled={phase === "sending"}
            className="field"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.message}>Message</Label>
        <textarea
          ref={refs.message}
          id={ids.message}
          name="message"
          rows={4}
          placeholder="A project, a question, a hello…"
          maxLength={LIMITS.message}
          value={values.message}
          onChange={edit("message")}
          aria-invalid={invalid === "message"}
          aria-describedby={errorFor("message")}
          disabled={phase === "sending"}
          className="field resize-none"
        />
      </div>
      {/* Web3Forms' spam trap: people never see or tick it. */}
      <input type="checkbox" name="botcheck" tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="off" />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <output
          id={ids.status}
          aria-live="polite"
          className={cn("block min-w-0 flex-1 text-small", error ? "text-danger" : "text-muted")}
        >
          <span id={error ? `${id}-error` : undefined}>
            {error || (site.web3formsKey ? "" : "Send opens your mail app with the note written out.")}
          </span>
        </output>
        <button
          ref={sendRef}
          type="submit"
          className="btn btn-solid max-sm:w-full"
          disabled={phase === "sending"}
          aria-busy={phase === "sending"}
        >
          <span className={cn("inline-flex items-center gap-2", phase === "sending" && "opacity-0")}>
            Send
            <Arrow />
          </span>
          {phase === "sending" ? (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          ) : null}
          {phase === "sending" ? <span className="sr-only">Sending</span> : null}
        </button>
      </div>
    </form>
  );
}
