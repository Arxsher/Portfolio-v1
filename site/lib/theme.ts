// Theme state lives on <html>: `class="dark"` for either dark palette,
// `data-palette="light" | "red-dragon" | "amoled"` for which one, and an
// inline `style="color-scheme: …"`. The choice is stored in localStorage
// under THEME_KEY (absent = follow the OS: light, or Red Dragon on a dark
// OS); the last dark palette used is kept under DARK_PALETTE_KEY so the
// light/dark toggle comes back to it. The inline script in app/layout.tsx
// applies it before first paint; everything after that goes through this
// module.
//
// Backward compatible: setTheme("dark") still works (it picks the last
// dark palette), getResolvedTheme()/useResolvedTheme() still answer
// "light" | "dark", and toggleTheme() still flips light and dark.

import { useSyncExternalStore } from "react";
import { DARK_PALETTE_KEY, DEFAULT_DARK_PALETTE, PALETTE_BACKGROUND, THEME_KEY } from "./theme-script";

export { DARK_PALETTE_KEY, THEME_KEY, themeScript } from "./theme-script";

/** The two dark palettes. */
export type DarkPalette = "red-dragon" | "amoled";
/** What is on screen: light or one of the dark palettes. */
export type Palette = "light" | DarkPalette;
/** What can be picked and stored ("system" follows the OS). */
export type ThemeChoice = Palette | "system";
/** What setTheme accepts: a choice, or "dark" for the last dark palette. */
export type Theme = ThemeChoice | "dark";
/** Light or dark, whichever palette. */
export type ResolvedTheme = "light" | "dark";

/** Names and preview colours for menus (header theme menu, command panel).
    `bg` is the page, `tile` a card on it, `main` the accent and `text` the
    main text colour. */
export const PALETTES: ReadonlyArray<{
  id: Palette;
  label: string;
  swatch: { bg: string; tile: string; main: string; text: string; line: string };
}> = [
  {
    id: "light",
    label: "Light",
    swatch: { bg: PALETTE_BACKGROUND.light, tile: "#f2f2f2", main: "#171717", text: "#6e6e6e", line: "#e4e4e4" },
  },
  {
    id: "red-dragon",
    label: "Red Dragon",
    swatch: { bg: PALETTE_BACKGROUND["red-dragon"], tile: "#0e0506", main: "#ff3a32", text: "#e2a528", line: "#5a3a1c" },
  },
  {
    id: "amoled",
    label: "AMOLED",
    swatch: { bg: PALETTE_BACKGROUND.amoled, tile: "#171717", main: "#eeeeee", text: "#8f8f8f", line: "#2a2a2a" },
  },
];

export const paletteLabel = (palette: Palette) => PALETTES.find((entry) => entry.id === palette)?.label ?? palette;

const DARK_QUERY = "(prefers-color-scheme: dark)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const isBrowser = () => typeof window !== "undefined";
const isDarkPalette = (value: unknown): value is DarkPalette => value === "red-dragon" || value === "amoled";
const isPalette = (value: unknown): value is Palette => value === "light" || isDarkPalette(value);

/* ---------------------------------------------------------------------- */
/* storage (falls back to memory when localStorage is blocked)             */
/* ---------------------------------------------------------------------- */

const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function store(key: string, value: string | null) {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}

function readDark(): DarkPalette {
  const value = read(DARK_PALETTE_KEY);
  return isDarkPalette(value) ? value : DEFAULT_DARK_PALETTE;
}

function readStored(): ThemeChoice {
  const value = read(THEME_KEY);
  if (isPalette(value)) return value;
  if (value === "dark") return readDark();
  return "system";
}

function systemPalette(): Palette {
  return isBrowser() && window.matchMedia(DARK_QUERY).matches ? DEFAULT_DARK_PALETTE : "light";
}

function resolve(choice: ThemeChoice): Palette {
  return choice === "system" ? systemPalette() : choice;
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
  // Follow the OS while the choice is "system".
  window.matchMedia(DARK_QUERY).addEventListener("change", () => {
    if (readStored() === "system") paint(systemPalette(), false);
  });
  // Keep tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY || event.key === DARK_PALETTE_KEY || event.key === null) {
      paint(resolve(readStored()), false);
      notify();
    }
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

/** Puts a palette on <html> (and the browser chrome colour). */
function apply(palette: Palette) {
  const root = document.documentElement;
  const dark = palette !== "light";
  root.classList.toggle("dark", dark);
  root.setAttribute("data-palette", palette);
  root.style.colorScheme = dark ? "dark" : "light";
  // The theme-color metas carry per-OS-scheme colours; once a palette is
  // on screen, both should show it.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = PALETTE_BACKGROUND[palette];
  });
}

function write(palette: Palette) {
  const root = document.documentElement;
  // Suspend colour transitions for the frame the palette flips in.
  root.setAttribute("data-theme-changing", "");
  apply(palette);
  // Force a style flush so the new colours land without transitions.
  void window.getComputedStyle(root).color;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.removeAttribute("data-theme-changing"));
  });
  notify();
}

/** Fired on window once a theme cross-fade has finished (see paint). */
export const THEME_SWITCH_END = "themeswitchend";

/** Counts cross-fades, so only the newest one ends the switch. */
let switches = 0;

/** Whether a theme cross-fade is running right now. */
export function isThemeSwitching(): boolean {
  return isBrowser() && document.documentElement.hasAttribute("data-theme-switch");
}

function paint(palette: Palette, animate: boolean) {
  if (!isBrowser()) return;
  if (getPalette() === palette) {
    apply(palette);
    notify();
    return;
  }
  const root = document.documentElement;
  const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  if (!animate || reduced || typeof document.startViewTransition !== "function") {
    write(palette);
    return;
  }
  // While the cross-fade runs, a snapshot covers the page and pointer
  // events are unreliable (the theme menu holds off closing until the
  // end). Picking again mid-fade skips the first one; only the newest
  // fade's end clears the flag and tells listeners.
  const id = ++switches;
  const end = () => {
    if (id !== switches) return;
    root.removeAttribute("data-theme-switch");
    window.dispatchEvent(new Event(THEME_SWITCH_END));
  };
  root.setAttribute("data-theme-switch", "");
  try {
    const transition = document.startViewTransition(() => write(palette));
    transition.finished.then(end, end);
  } catch {
    end();
    write(palette);
  }
}

/* ---------------------------------------------------------------------- */
/* public API                                                              */
/* ---------------------------------------------------------------------- */

/** The stored choice ("system" when nothing was chosen). */
export function getTheme(): ThemeChoice {
  if (!isBrowser()) return "system";
  return readStored();
}

/** The palette on screen right now. */
export function getPalette(): Palette {
  if (!isBrowser()) return "light";
  const root = document.documentElement;
  if (!root.classList.contains("dark")) return "light";
  const palette = root.getAttribute("data-palette");
  return isDarkPalette(palette) ? palette : DEFAULT_DARK_PALETTE;
}

/** Light or dark on screen right now, whichever palette. */
export function getResolvedTheme(): ResolvedTheme {
  if (!isBrowser()) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** The dark palette the toggle switches to (the last one used). */
export function getDarkPalette(): DarkPalette {
  if (!isBrowser()) return DEFAULT_DARK_PALETTE;
  return readDark();
}

/**
 * Store a choice and apply it (cross-fades unless reduced motion).
 * "dark" means the last dark palette; picking a dark palette also makes it
 * the one the toggle comes back to.
 */
export function setTheme(theme: Theme) {
  if (!isBrowser()) return;
  const choice: ThemeChoice = theme === "dark" ? readDark() : theme;
  store(THEME_KEY, choice === "system" ? null : choice);
  if (isDarkPalette(choice)) store(DARK_PALETTE_KEY, choice);
  paint(resolve(choice), true);
  notify();
}

/** Flip between light and the last dark palette, based on what is shown. */
export function toggleTheme() {
  setTheme(getResolvedTheme() === "dark" ? "light" : readDark());
}

/**
 * Re-apply the stored choice to <html>. React's dev-mode remount resets
 * <html> attributes that the inline script set; call this from a layout
 * effect in a component that is always mounted (the header does).
 */
export function syncTheme() {
  if (!isBrowser()) return;
  apply(resolve(readStored()));
}

/** Light or dark as React state. Renders "light" on the server. */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, getResolvedTheme, () => "light");
}

/** The palette on screen as React state. Renders "light" on the server. */
export function usePalette(): Palette {
  return useSyncExternalStore(subscribe, getPalette, () => "light");
}

/** The dark palette the toggle switches to, as React state. */
export function useDarkPalette(): DarkPalette {
  return useSyncExternalStore(subscribe, getDarkPalette, () => DEFAULT_DARK_PALETTE);
}

/** Stored choice as React state. Renders "system" on the server. */
export function useThemePreference(): ThemeChoice {
  return useSyncExternalStore(subscribe, getTheme, () => "system");
}
