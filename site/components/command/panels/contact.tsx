"use client";

// The contact sheet: two tabs, "Write a note" and "Book a call" (the
// views say-hi and book-call), with the address and a Copy button at the
// foot of both. Tabs follow the ARIA tabs pattern: arrows move between
// them, Home / End jump, the active one is the only Tab stop.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy } from "@/components/icons";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import type { CommandPrefill } from "@/lib/command";
import { PANELS } from "../items";
import { BookCall } from "./book-call";
import { Panel, type PanelProps } from "./panel";
import { WriteNote } from "./say-hi";

export type ContactTab = "say-hi" | "book-call";

const TABS: ReadonlyArray<{ id: ContactTab; label: string }> = [
  { id: "say-hi", label: "Write a note" },
  { id: "book-call", label: "Book a call" },
];

export async function copyText(text: string): Promise<boolean> {
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

/** The address on its own line with a small Copy pill. */
export function CopyAddress() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="caps text-muted max-sm:w-full">Or write directly</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2.5 max-sm:justify-between">
        <a href={`mailto:${site.email}`} className="link min-w-0 truncate text-[15px] focus-ring">
          {site.email}
        </a>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(site.email);
            setCopied(ok);
            setFailed(!ok);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
              setCopied(false);
              setFailed(false);
            }, 1800);
          }}
          className="btn btn-soft btn-sm shrink-0"
        >
          <span className="icon-swap">
            <span className="flex" data-hidden={copied}>
              <Copy size={13} />
            </span>
            <span className="flex text-green" data-hidden={!copied}>
              <Check size={13} />
            </span>
          </span>
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? "Address copied" : failed ? "Could not copy. Select the address instead." : ""}
        </span>
      </span>
    </div>
  );
}

export function ContactPanel({
  titleId,
  onBack,
  onClose,
  tab,
  onTab,
  prefill,
  fromTyping,
  focusField,
}: PanelProps & {
  tab: ContactTab;
  onTab: (tab: ContactTab) => void;
  prefill: CommandPrefill;
  fromTyping: boolean;
  /** Put the caret in the first empty field once the note has rendered. */
  focusField: boolean;
}) {
  const id = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: TABS.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (keys[event.key] + TABS.length) % TABS.length;
    onTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <Panel titleId={titleId} title={PANELS[tab].title} onBack={onBack} onClose={onClose} bodyClassName="pt-4">
      <div role="tablist" aria-label="How to reach me" className="flex justify-center gap-1.5">
        {TABS.map((item, index) => {
          const selected = item.id === tab;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTab(item.id)}
              onKeyDown={(event) => onTabKey(event, index)}
              className={cn("btn btn-sm", selected ? "btn-solid" : "btn-ghost")}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tab}`}
        className="mt-5"
      >
        {tab === "say-hi" ? (
          <WriteNote prefill={prefill} fromTyping={fromTyping} autoFocus={focusField} />
        ) : (
          <BookCall onWriteInstead={() => onTab("say-hi")} />
        )}
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <CopyAddress />
      </div>
    </Panel>
  );
}
