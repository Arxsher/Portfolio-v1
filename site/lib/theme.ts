// Theme state lives on <html>: `class="dark"` plus an inline
// `style="color-scheme: …"`. The preference ("light" | "dark" | "system")
// is stored in localStorage under THEME_KEY. The inline script in
// app/layout.tsx applies it before first paint; everything after that goes
// through this module.

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export { THEME_KEY, themeScript } from "./theme-script";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const isBrowser = () => typeof window !== "undefined";

function readStored(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {}
  return "system";
}

function systemTheme(): ResolvedTheme {
  return isBrowser() && window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? systemTheme() : theme;
}

/* ---------------------------------------------------------------------- */
/* subscribers                                                             */
/* ---------------------------------------------------------------------- */

const listeners = new Set<() => void>();
let watching = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function watch() {
  if (watching || !isBrowser()) return;
  watching = true;
  // Follow the OS while the preference is "system".
  window.matchMedia(DARK_QUERY).addEventListener("change", () => {
    if (readStored() === "system") paint(systemTheme(), false);
  });
  // Keep tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY) paint(resolve(readStored()), false);
  });
}

function subscribe(listener: () => void) {
  watch();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ---------------------------------------------------------------------- */
/* applying                                                                */
/* ---------------------------------------------------------------------- */

function write(resolved: ResolvedTheme) {
  const root = document.documentElement;
  // Suspend colour transitions for the frame the class flips in.
  root.setAttribute("data-theme-changing", "");
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  // Force a style flush so the new colours land without transitions.
  void window.getComputedStyle(root).color;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.removeAttribute("data-theme-changing"));
  });
  notify();
}

function paint(resolved: ResolvedTheme, animate: boolean) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  if (root.classList.contains("dark") === (resolved === "dark")) {
    root.style.colorScheme = resolved;
    notify();
    return;
  }
  const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  if (!animate || reduced || typeof document.startViewTransition !== "function") {
    write(resolved);
    return;
  }
  root.setAttribute("data-theme-switch", "");
  try {
    const transition = document.startViewTransition(() => write(resolved));
    transition.finished.finally(() => root.removeAttribute("data-theme-switch"));
  } catch {
    root.removeAttribute("data-theme-switch");
    write(resolved);
  }
}

/* ---------------------------------------------------------------------- */
/* public API                                                              */
/* ---------------------------------------------------------------------- */

/** The stored preference ("system" when nothing was chosen). */
export function getTheme(): Theme {
  if (!isBrowser()) return "system";
  return readStored();
}

/** What is actually on screen right now. */
export function getResolvedTheme(): ResolvedTheme {
  if (!isBrowser()) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Store a preference and apply it (cross-fades unless reduced motion). */
export function setTheme(theme: Theme) {
  if (!isBrowser()) return;
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {}
  paint(resolve(theme), true);
  notify();
}

/** Flip between light and dark based on what is currently shown. */
export function toggleTheme() {
  setTheme(getResolvedTheme() === "dark" ? "light" : "dark");
}

/**
 * Re-apply the stored preference to <html>. React's dev-mode remount resets
 * <html> attributes that the inline script set; call this from a layout
 * effect in a component that is always mounted (the header does).
 */
export function syncTheme() {
  if (!isBrowser()) return;
  const resolved = resolve(readStored());
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/** Resolved theme as React state. Renders "light" on the server. */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, getResolvedTheme, () => "light");
}

/** Stored preference as React state. Renders "system" on the server. */
export function useThemePreference(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "system");
}
