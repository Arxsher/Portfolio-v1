"use client";

// The interactive parts of the contact postcard (components/home/profile.tsx):
//
//   <ContactButton view="say-hi" className="btn btn-solid">Say hi</ContactButton>
//   <CopyAddress email="…" />
//   <Postmark />
//
// ContactButton opens a view of the Index (the contact sheet) through
// lib/command.ts. CopyAddress copies the email address and says so in a
// polite live region (falls back to opening the mail app). Postmark is the
// rubber stamp on the address side: CASABLANCA around the ring, today's
// date and Casablanca's time inked in the middle (the second of the two
// places the live time shows, DESIGN.md → Clock). It renders dashes until
// mounted, so the static HTML matches the first client render.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "@/components/icons";
import { casaTime, useNow } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { openCommand, type CommandView } from "@/lib/command";

export function ContactButton({
  view,
  className,
  children,
}: {
  view: CommandView;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openCommand(view)}>
      {children}
    </button>
  );
}

export function CopyAddress({ email, className }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={cn("btn btn-soft btn-sm", copied && "border-green! text-green!", className)}
      >
        <span className="icon-swap size-3.5" aria-hidden="true">
          <span data-hidden={copied ? "true" : undefined}>
            <Copy size={14} />
          </span>
          <span data-hidden={copied ? undefined : "true"}>
            <Check size={14} />
          </span>
        </span>
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> the email address</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied the address" : ""}
      </span>
    </>
  );
}

/**
 * A rubber postmark in terracotta ink, roughened with an SVG turbulence
 * filter so it reads as ink on paper, with wavy cancellation lines trailing
 * off to the left. Decorative: the same time is given in words in the hero.
 */
export function Postmark({ className }: { className?: string }) {
  const time = casaTime(useNow());
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ring = `${id}-ring`;
  const ink = `${id}-ink`;
  return (
    <svg
      viewBox="0 0 196 128"
      aria-hidden="true"
      focusable="false"
      className={cn("font-sans text-terra-fill mix-blend-multiply dark:mix-blend-normal", className)}
    >
      <defs>
        <path id={ring} d="M 132 64 m -42 0 a 42 42 0 1 1 84 0 a 42 42 0 1 1 -84 0" />
        <filter id={ink} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="blotch" />
          <feColorMatrix
            in="blotch"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.05"
            result="mask"
          />
          <feComposite in="rough" in2="mask" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${ink})`} fill="currentColor">
        {[0, 1, 2, 3, 4].map((line) => (
          <path
            key={line}
            d={`M 4 ${40 + line * 12} q 8 -5 16 0 t 16 0 t 16 0 t 16 0 t 16 0`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ))}
        <circle cx="132" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="2.6" />
        <circle cx="132" cy="64" r="34" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <text fontSize="10.5" fontWeight="700">
          <textPath href={`#${ring}`} startOffset="0" textLength="258" lengthAdjust="spacing">
            CASABLANCA • MAROC • CASABLANCA • MAROC •
          </textPath>
        </text>
        <text x="132" y="57" textAnchor="middle" fontSize="7.2" fontWeight="700" letterSpacing="0.6">
          {time ? time.date : "-- --- ----"}
        </text>
        <text x="132" y="75" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="0.3">
          {time ? `${time.hh}:${time.mm}` : "--:--"}
        </text>
      </g>
    </svg>
  );
}
