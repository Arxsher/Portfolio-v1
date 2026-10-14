// Keyboard shortcuts for the whole site. The header mounts them once with
// useSiteShortcuts(); everything else just reads or flips the setting.
//
//   Ctrl/Cmd + K   open the Index (always on)
//   /              open the Index (handled by the command bar)
//   t              day / night
//   j / k          next / previous row (any element with data-row: work
//                  rows, lab niches, writing rows …)
//   g g / G        top / bottom of the page
//
// The single-key ones (t, j, k, g, G) can be turned off (WCAG 2.1.4): the
// footer's colophon has the switch, and the Index can offer it too through
// setSingleKeyShortcuts(). The choice is stored in localStorage
// ("shortcuts" = "off"). Keys are ignored while typing, with a modifier
// held, inside an open dialog, and inside anything marked
// [data-lab-stage] or [data-shortcuts="off"] (lab stages, games), so pieces
// keep their own keys.

import { useEffect, useState, useSyncExternalStore } from "react";
import { openCommand } from "./command";
import { toggleTheme } from "./theme";

const KEY = "shortcuts";

/* ---------------------------------------------------------------------- */
/* the setting                                                             */
/* ---------------------------------------------------------------------- */

const listeners = new Set<() => void>();
/** Used only when localStorage is unavailable. */
let memory: boolean | null = null;

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

/** Whether t / j / k / g / G do anything. On unless the visitor turned them off. */
export function singleKeyShortcutsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return memory ?? read();
}

export function setSingleKeyShortcuts(on: boolean) {
  try {
    if (on) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, "off");
  } catch {
    // Storage off: the choice lasts until the next reload.
    memory = on;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The setting as React state ("on" on the server). */
export function useSingleKeyShortcuts(): boolean {
  return useSyncExternalStore(subscribe, () => memory ?? read(), () => true);
}

/* ---------------------------------------------------------------------- */
/* helpers                                                                 */
/* ---------------------------------------------------------------------- */

/** True for text fields, editable content and anything that takes typing. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !["button", "checkbox", "radio", "range", "reset", "submit", "color", "file", "image"].includes(type);
  }
  const role = target.getAttribute("role");
  return role === "textbox" || role === "combobox" || role === "searchbox";
}

/** "⌘" on Apple devices, "Ctrl" elsewhere. "Ctrl" on the server and before mount. */
export function useModKey(): "⌘" | "Ctrl" {
  const [key, setKey] = useState<"⌘" | "Ctrl">("Ctrl");
  useEffect(() => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
      navigator.platform ||
      navigator.userAgent;
    if (/mac|iphone|ipad|ipod/i.test(platform)) setKey("⌘");
  }, []);
  return key;
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function visible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/** Move focus to the next (1) or previous (-1) [data-row] on the page. */
export function stepRow(direction: 1 | -1) {
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-row]")).filter(visible);
  if (!rows.length) return;
  const active = document.activeElement;
  let index = rows.findIndex((row) => row === active || row.contains(active));
  if (index === -1) {
    // Nothing focused yet: start from what is on screen.
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar")) || 64;
    if (direction === 1) {
      index = rows.findIndex((row) => row.getBoundingClientRect().top >= top - 1) - 1;
      if (index < -1) index = rows.length - 1;
    } else {
      const below = rows.findIndex((row) => row.getBoundingClientRect().bottom > window.innerHeight);
      index = below === -1 ? rows.length : below;
    }
  }
  const next = rows[Math.min(rows.length - 1, Math.max(0, index + direction))];
  const target = next.matches("a, button, [tabindex]") ? next : next.querySelector<HTMLElement>("a, button, [tabindex]");
  (target ?? next).focus({ preventScroll: true });
  next.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
}

function toEdge(edge: "top" | "bottom") {
  const behavior = reducedMotion() ? "auto" : "smooth";
  if (edge === "top") {
    window.scrollTo({ top: 0, behavior });
    document.getElementById("main")?.focus({ preventScroll: true });
  } else {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
  }
}

/* ---------------------------------------------------------------------- */
/* the listener                                                            */
/* ---------------------------------------------------------------------- */

const GG_WINDOW_MS = 600;

/** Install the site's shortcuts. Mount once (the header does). */
export function useSiteShortcuts() {
  useEffect(() => {
    let lastG = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const mod = event.metaKey || event.ctrlKey;

      // Ctrl/Cmd+K: the Index, from anywhere (even a text field).
      if (mod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommand("palette");
        return;
      }

      if (mod || event.altKey) return;
      if (!(memory ?? read())) return;
      if (isTypingTarget(event.target)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-lab-stage], [data-shortcuts='off'], [role='dialog'], [role='application'], dialog")) return;
      if (document.querySelector("[role='dialog'][data-open], dialog[open]")) return;

      switch (event.key) {
        case "t":
          event.preventDefault();
          toggleTheme();
          return;
        case "j":
        case "k":
          event.preventDefault();
          stepRow(event.key === "j" ? 1 : -1);
          return;
        case "g": {
          const now = event.timeStamp;
          if (now - lastG < GG_WINDOW_MS) {
            event.preventDefault();
            lastG = 0;
            toEdge("top");
          } else {
            lastG = now;
          }
          return;
        }
        case "G":
          event.preventDefault();
          toEdge("bottom");
          return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
