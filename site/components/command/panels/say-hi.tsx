"use client";

// "Say hi" (Send me a message): the address with a Copy button, then name, email
// and message, and Send.
//
// Sending goes through Web3Forms when site.web3formsKey is set. Without a
// key, Send opens the visitor's mail app with everything filled in, and
// the panel says so. Fields typed into the command bar ("hi, i'm sam,
// sam@site.com, love your work") arrive as `prefill` and keep following
// the bar until the visitor edits that field by hand.

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Check, Copy, Mail } from "@/components/icons";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import type { CommandPrefill } from "@/lib/command";
import { VIEWS } from "../items";
import { isEmail } from "../parse";
import { Panel, panelButtonClass } from "./panel";

const LIMITS = { name: 60, email: 160, message: 2000 } as const;

const fieldClass =
  "w-full rounded-[12px] bg-tile px-3.5 py-2.5 text-[16px] text-primary outline-none transition-shadow duration-150 ease-out placeholder:text-tertiary focus:shadow-[0_0_0_2px_var(--foreground)] aria-[invalid=true]:shadow-[0_0_0_1.5px_var(--danger)] aria-[invalid=true]:focus:shadow-[0_0_0_2px_var(--danger)] disabled:opacity-60 sm:text-[15px]";

type Field = "name" | "email" | "message";
type Phase = "idle" | "sending" | "sent" | "mailto" | "error";

/**
 * What was typed by hand, kept for the life of the page so closing the bar
 * by accident (Esc, a click outside) does not throw a message away.
 * Cleared once the message has gone out.
 */
let draft: Partial<Record<Field, string>> = {};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure previews: the textarea fallback.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="mb-3 flex items-center gap-2 rounded-[12px] bg-tile py-1.5 ps-3.5 pe-1.5">
      <Mail size={14} className="text-tertiary" />
      <a
        href={`mailto:${site.email}`}
        className="min-w-0 flex-1 truncate rounded-[4px] text-[14px] text-primary focus-ring"
      >
        {site.email}
      </a>
      <button
        type="button"
        onClick={async () => {
          if (!(await copyText(site.email))) return;
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1600);
        }}
        className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-[8px] px-2 text-[12px] text-secondary outline-none transition-colors duration-150 hover:bg-well hover:text-primary focus-visible:bg-well focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
      >
        <span className="icon-swap">
          <span className="flex" data-hidden={copied}>
            <Copy size={13} />
          </span>
          <span className="flex" data-hidden={!copied}>
            <Check size={13} />
          </span>
        </span>
        {/* Only the current label, so the button widens while "Copied" shows. */}
        <span>{copied ? "Copied" : "Copy"}</span>
        <span className="sr-only" aria-live="polite">
          {copied ? "Email address copied" : ""}
        </span>
      </button>
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="ps-1 text-[13px] text-secondary">
      {children}
    </label>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-[6px] bg-well px-1.5 py-px text-primary">{children}</span>;
}

export function SayHiPanel({
  prefill,
  fromTyping,
  autoFocus,
  onClose,
}: {
  prefill: CommandPrefill;
  /** The prefill was read from what was typed into the bar: show what was picked up. */
  fromTyping: boolean;
  autoFocus: boolean;
  onClose: () => void;
}) {
  const id = useId();
  const ids = { name: `${id}-name`, email: `${id}-email`, message: `${id}-message`, status: `${id}-status` };
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  // Hand edits win; untouched fields follow the prefill. A fresh prefill
  // (from the bar or a button) beats an older draft of the same field.
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
    if (invalid === field) setInvalid(null);
  };

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<Field | null>(null);
  const live = phase === "idle" || phase === "sending" || phase === "error";
  const statusRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);

  // The form and the "sent" card replace each other, and disabled fields
  // drop focus while sending. When that leaves focus on nothing, put it
  // somewhere sensible: the card, the Send button, or the next empty field.
  const lastPhase = useRef(phase);
  useEffect(() => {
    if (lastPhase.current === phase) return;
    lastPhase.current = phase;
    const current = document.activeElement;
    if (current && current !== document.body) return;
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
    if (!name) return fail("name", "Add your name so I know who’s writing.");
    if (!email) return fail("email", "Add your email so I can reply.");
    if (!isEmail(email)) return fail("email", "That email doesn’t look quite right.");
    if (!message) return fail("message", "Write a message first.");
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
          subject: "New message from arsher.is-a.dev",
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
      setError("That didn’t go through. Try again, or email me directly.");
    }
  }

  const firstName = values.name.trim().split(/\s+/)[0];
  const picked = fromTyping && (prefill.name || prefill.email);

  return (
    <Panel
      label={VIEWS["say-hi"].title}
      title={VIEWS["say-hi"].title}
      icon="mail"
      onClose={onClose}
      description={
        picked ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[12px] text-tertiary">
            Picked up from what you typed:
            {prefill.name ? <Chip>{prefill.name}</Chip> : null}
            {prefill.email ? <Chip>{prefill.email}</Chip> : null}
          </p>
        ) : (
          VIEWS["say-hi"].description
        )
      }
    >
      <CopyEmail />
      {live ? (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2" aria-describedby={ids.status}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.name}>Name</Label>
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
                disabled={phase === "sending"}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.email}>Email</Label>
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
                disabled={phase === "sending"}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.message}>Message</Label>
            <textarea
              ref={refs.message}
              id={ids.message}
              name="message"
              rows={3}
              placeholder="What would you like to talk about?"
              maxLength={LIMITS.message}
              value={values.message}
              onChange={edit("message")}
              aria-invalid={invalid === "message"}
              disabled={phase === "sending"}
              className={cn(fieldClass, "resize-none")}
            />
          </div>
          {/* Web3Forms' spam trap: people never see or tick it. */}
          <input type="checkbox" name="botcheck" tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="off" />
          <div className="flex items-center justify-between gap-3">
            <output
              id={ids.status}
              aria-live="polite"
              className={cn("block min-w-0 text-[13px] leading-[1.4]", error ? "text-danger" : "text-tertiary")}
            >
              {error || (site.web3formsKey ? "" : "Opens your mail app, ready to send.")}
            </output>
            <button
              ref={sendRef}
              type="submit"
              className={panelButtonClass}
              disabled={phase === "sending"}
              aria-busy={phase === "sending"}
            >
              <span className={cn(phase === "sending" && "opacity-0")}>Send</span>
              {phase === "sending" ? (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </span>
              ) : null}
              {phase === "sending" ? <span className="sr-only">Sending</span> : null}
            </button>
          </div>
        </form>
      ) : (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="status"
          className="flex animate-blur-in flex-col items-center rounded-[16px] bg-tile px-6 py-7 text-center outline-none"
        >
          <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-float text-primary shadow-lift">
            {phase === "sent" ? <Check size={16} /> : <Mail size={16} />}
          </span>
          <p className="text-[15px] font-medium text-primary">
            {phase === "sent" ? "Message sent" : "Over to your mail app"}
          </p>
          <p className="mt-1 max-w-[340px] text-[13px] leading-[1.5] text-secondary">
            {phase === "sent" ? (
              <>
                Thanks{firstName ? `, ${firstName}` : ""}. It’s in my inbox now, and I’ll write back to{" "}
                <span className="text-primary">{values.email.trim()}</span>.
              </>
            ) : (
              <>
                Your message is waiting in a new email. If nothing opened, write to{" "}
                <span className="text-primary">{site.email}</span> directly.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              if (phase === "sent") setEdits(() => ({ name: values.name, email: values.email, message: "" }));
              setPhase("idle");
            }}
            className="mt-4 flex h-8 cursor-pointer items-center rounded-[10px] px-3 text-[13px] text-secondary transition-colors duration-150 hover:bg-well hover:text-primary focus-visible:bg-well focus-visible:text-primary focus-ring"
          >
            {phase === "sent" ? "Write another" : "Back to the message"}
          </button>
        </div>
      )}
    </Panel>
  );
}
