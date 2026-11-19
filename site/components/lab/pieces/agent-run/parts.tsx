"use client";

// Small pieces of the run card: the agent mark, status icons, glyphs for
// the sub-agents, the JSON view and the collapsible tool-call row.

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatSeconds, formatValue, type ArgValue, type Glyph, type Status, type TTool } from "./script";

/* ---------------------------------------------------------------------- */
/* marks and icons                                                         */
/* ---------------------------------------------------------------------- */

/**
 * The agent: an ink disc with three linked nodes (a lead and two helpers).
 * While it works the nodes pulse in turn.
 */
export function AgentMark({ size = 18, live = false, className }: { size?: number; live?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-grid shrink-0 place-items-center rounded-full bg-ink text-on-ink", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 18 18" width={size} height={size} className={cn(live && "ar-dots")}>
        <path d="M9 5.6 5.6 11.7h6.8Z" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.9" strokeLinejoin="round" />
        <circle cx="9" cy="5.6" r="1.75" fill="currentColor" />
        <circle cx="5.6" cy="11.7" r="1.75" fill="currentColor" />
        <circle cx="12.4" cy="11.7" r="1.75" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Spinner({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className={cn("shrink-0", className)}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.6" />
      <g className="ar-spin">
        <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Step status: dashed ring, spinner, ink disc with a drawn check, or a stop square. */
export function StatusIcon({ status, size = 14, className }: { status: Status; size?: number; className?: string }) {
  if (status === "running") return <Spinner size={size} className={cn("text-primary", className)} />;
  if (status === "done") {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className={cn("ar-pop shrink-0", className)}>
        <circle cx="8" cy="8" r="7" className="fill-ink" />
        <path
          d="m5 8.2 2 2 4-4.3"
          fill="none"
          className="ar-draw stroke-on-ink"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ ["--len" as string]: 9 }}
        />
      </svg>
    );
  }
  if (status === "stopped") {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className={cn("shrink-0 text-tertiary", className)}>
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <rect x="5.6" y="5.6" width="4.8" height="4.8" rx="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className={cn("shrink-0 text-line-dash", className)}>
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2.1 2.1" />
    </svg>
  );
}

/** Lighter status for a tool call: a small spinner, a plain check, a stop dot. */
export function CallStatus({ status, size = 12 }: { status: Status; size?: number }) {
  if (status === "running") return <Spinner size={size} className="text-secondary" />;
  if (status === "done") {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className="ar-pop shrink-0 text-secondary">
        <path
          d="m3.5 8.4 3 3 6-6.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ar-draw"
          style={{ ["--len" as string]: 14 }}
        />
      </svg>
    );
  }
  if (status === "stopped") {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className="shrink-0 text-tertiary">
        <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" fill="currentColor" />
      </svg>
    );
  }
  return null;
}

/** The shape that tells sub-agents apart. */
export function GlyphShape({ glyph, size = 8, className }: { glyph: Glyph; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} aria-hidden="true" className={cn("shrink-0", className)}>
      {glyph === "circle" ? <circle cx="5" cy="5" r="4.2" fill="currentColor" /> : null}
      {glyph === "square" ? <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor" /> : null}
      {glyph === "triangle" ? <path d="M5 1.1 9.2 8.6H.8Z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" strokeWidth="0.8" /> : null}
      {glyph === "diamond" ? <rect x="2.2" y="2.2" width="5.6" height="5.6" rx="1" transform="rotate(45 5 5)" fill="currentColor" /> : null}
    </svg>
  );
}

export function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={10}
      height={10}
      aria-hidden="true"
      className={cn("shrink-0 transition-[rotate] duration-300 ease-out motion-reduce:transition-none", open && "rotate-90", className)}
    >
      <path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StopIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect x="3.75" y="3.75" width="8.5" height="8.5" rx="2" fill="currentColor" />
    </svg>
  );
}

/** Wavy dots for the planning line. */
export function ThinkIcon({ live, size = 14 }: { live: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className={cn("shrink-0", live ? "ar-dots text-primary" : "text-tertiary")}>
      <circle cx="3.5" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/* JSON                                                                    */
/* ---------------------------------------------------------------------- */

type Token = { text: string; kind: "punct" | "key" | "string" | "number" };

function jsonTokens(args: ReadonlyArray<readonly [string, ArgValue]>): Token[] {
  const tokens: Token[] = [{ text: "{\n", kind: "punct" }];
  args.forEach(([key, value], index) => {
    tokens.push({ text: "  ", kind: "punct" });
    tokens.push({ text: `"${key}"`, kind: "key" });
    tokens.push({ text: ": ", kind: "punct" });
    tokens.push({ text: formatValue(value), kind: typeof value === "string" ? "string" : "number" });
    tokens.push({ text: index < args.length - 1 ? ",\n" : "\n", kind: "punct" });
  });
  tokens.push({ text: "}", kind: "punct" });
  return tokens;
}

const TOKEN_CLASS: Record<Token["kind"], string> = {
  punct: "text-tertiary",
  key: "text-secondary",
  string: "text-primary",
  number: "ar-num",
};

/** Arguments as pretty JSON; `progress` (0..1) streams it in. */
export function JsonView({ args, progress = 1 }: { args: ReadonlyArray<readonly [string, ArgValue]>; progress?: number }) {
  const tokens = jsonTokens(args);
  const total = tokens.reduce((sum, token) => sum + token.text.length, 0);
  let budget = Math.round(total * Math.min(1, Math.max(0, progress)));
  const out: ReactNode[] = [];
  for (let index = 0; index < tokens.length && budget > 0; index++) {
    const token = tokens[index];
    const text = token.text.slice(0, budget);
    budget -= text.length;
    out.push(
      <span key={index} className={TOKEN_CLASS[token.kind]}>
        {text}
      </span>,
    );
  }
  const streaming = progress < 1;
  return (
    <pre className="ar-mono m-0 whitespace-pre-wrap break-words text-[11.5px] leading-[1.65]">
      {out}
      {streaming ? <span className="ar-caret" /> : null}
    </pre>
  );
}

/* ---------------------------------------------------------------------- */
/* tool call row                                                           */
/* ---------------------------------------------------------------------- */

export function ToolRow({
  tool,
  t,
  stopped,
  open,
  onToggle,
}: {
  tool: TTool;
  t: number;
  stopped: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const status = t < tool.start ? "pending" : t < tool.end ? (stopped ? "stopped" : "running") : "done";
  const progress = Math.min(1, Math.max(0, (t - tool.start) / Math.max(0.001, tool.argsEnd - tool.start)));
  const streaming = status === "running" && progress < 1;
  const line = streaming ? tool.line.slice(0, Math.floor(progress * tool.line.length)) : tool.line;
  const working = status === "running" && !streaming;
  const done = status === "done";
  const stateText = done ? `done in ${formatSeconds(tool.end - tool.start)}` : status === "stopped" ? "stopped" : "running";

  return (
    <div className="ar-in">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="group/call flex h-[30px] w-full cursor-pointer items-center gap-2 rounded-[9px] ps-1.5 pe-2 text-start outline-none transition-[background-color] duration-150 ease-out hover:bg-wash focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary pointer-coarse:h-9"
      >
        <Chevron open={open} className="text-tertiary group-hover/call:text-secondary" />
        <span className="ar-mono shrink-0 text-[12px] text-primary">{tool.spec.name}</span>
        <span className="ar-mono min-w-0 flex-1 truncate text-[12px] text-tertiary">
          {line}
          {streaming ? <span className="ar-caret" /> : null}
        </span>
        <span className="sr-only">, {stateText}</span>
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          {done ? <span className="ar-mono ar-fade text-[11px] text-tertiary">{formatSeconds(tool.end - tool.start)}</span> : null}
          {working || done || status === "stopped" ? <CallStatus status={status} /> : null}
        </span>
      </button>
      <div id={panelId} className="ar-collapse" data-open={open ? "" : undefined} inert={!open}>
        <div>
          <div className="mt-0.5 mb-1.5 ms-[22px] rounded-[11px] bg-well/55 px-3 pt-2.5 pb-3 shadow-[inset_0_0_0_1px_var(--border)] dark:bg-well/45">
            <p className="ar-label">Input</p>
            <JsonView args={tool.spec.args} progress={progress} />
            <div aria-hidden="true" className="my-2.5 border-t border-dashed border-line-dash" />
            <p className="ar-label">Output</p>
            {done ? (
              <div className="ar-mono text-[11.5px] leading-[1.65] text-primary">
                {tool.spec.result.map((row, index) => (
                  <p key={index} className="ar-in m-0" style={{ animationDelay: `${index * 70}ms` }}>
                    {row}
                  </p>
                ))}
              </div>
            ) : (
              <p className={cn("m-0 text-[12px]", status === "stopped" ? "text-tertiary" : "ar-shimmer")}>
                {status === "stopped" ? "Stopped before it returned" : "Waiting for the result…"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
