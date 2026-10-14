"use client";

// The action echo: after a command that works quietly (copying the
// address, switching to night, turning the single-key shortcuts off) a
// short line appears under the Index pill in the top bar and says what
// happened, then leaves. One at a time; a new one replaces the last.
//
//   echo("Copied the address")
//   echo("Couldn't reach the clipboard", "error")
//
// The line sits in a polite live region that is always on the page, so
// screen readers hear it too.

import { useEffect, useRef, useState } from "react";
import { Star } from "@/components/ornament";
import { cn } from "@/lib/cn";

type Tone = "done" | "error";
type Message = { id: number; text: string; tone: Tone };

const listeners = new Set<(message: Message) => void>();
let seq = 0;

export function echo(text: string, tone: Tone = "done") {
  seq += 1;
  const message = { id: seq, text, tone };
  listeners.forEach((listener) => listener(message));
}

const SHOW_MS = 2600;

/**
 * Where the echo goes: just under the Index pill, its right edge on the
 * pill's (the line is pulled back by its own width, so this holds however
 * wide the layout viewport is).
 */
function place(): { top: number; edge: number } {
  const pill = document.querySelector<HTMLElement>('.site-bar button[aria-haspopup="dialog"]');
  const rect = pill?.getBoundingClientRect();
  const visible = window.visualViewport?.width ?? document.documentElement.clientWidth;
  if (!rect || rect.width === 0) return { top: 72, edge: visible - 16 };
  return { top: Math.round(rect.bottom + 10), edge: Math.min(Math.round(rect.right), visible - 12) };
}

export function EchoToast() {
  const [message, setMessage] = useState<Message | null>(null);
  const [shown, setShown] = useState(false);
  const [where, setWhere] = useState({ top: 72, edge: 0 });
  const timer = useRef<number>(undefined);
  const frame = useRef(0);

  useEffect(() => {
    const listener = (next: Message) => {
      setWhere(place());
      setMessage(next);
      setShown(true);
      window.clearTimeout(timer.current);
      cancelAnimationFrame(frame.current);
      // Count the time on screen from the first frame that shows it (a
      // theme switch can hold the next frame back on a slow device).
      frame.current = requestAnimationFrame(() => {
        frame.current = requestAnimationFrame(() => {
          timer.current = window.setTimeout(() => setShown(false), SHOW_MS);
        });
      });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      window.clearTimeout(timer.current);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed z-50 flex w-max max-w-[calc(100vw-24px)] -translate-x-full justify-end"
      style={{ top: where.top, left: where.edge, viewTransitionName: "site-dock" }}
    >
      {message ? (
        <p
          key={message.id}
          className={cn(
            "flex min-h-9 items-center gap-2 rounded-pill bg-paper py-1.5 ps-3 pe-3.5 text-[13.5px] leading-[1.35] font-[550] text-primary shadow-sheet",
            "animate-pop-in transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none",
            !shown && "-translate-y-1 opacity-0",
          )}
        >
          {message.tone === "error" ? (
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-danger" />
          ) : (
            <Star size={11} className="text-terra-fill" />
          )}
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
