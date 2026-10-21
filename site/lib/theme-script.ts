// Server-safe pieces of the theme setup (no React imports), used by
// app/layout.tsx. The client API lives in lib/theme.ts.

/** The chosen theme: "light", "red-dragon" or "amoled" (absent = follow the
    OS). An older "dark" value means "the last dark palette". */
export const THEME_KEY = "theme";

/** The dark palette used last ("red-dragon" | "amoled"): the light/dark
    toggle comes back to it. */
export const DARK_PALETTE_KEY = "theme-dark";

/** The default dark palette, also what "system" shows on a dark OS. */
export const DEFAULT_DARK_PALETTE = "red-dragon";

/** Page backgrounds per palette, for <meta name="theme-color">. Keep in
    step with --background in app/globals.css. */
export const PALETTE_BACKGROUND = {
  light: "#fbfbfb",
  "red-dragon": "#1a0b0c",
  amoled: "#000000",
} as const;

/**
 * Runs synchronously in <head> before first paint: reads the stored theme
 * (falling back to the OS setting) and applies `class="dark"`,
 * `data-palette="light|red-dragon|amoled"` and `color-scheme` to <html>.
 * Storage and matchMedia are read separately so a blocked localStorage
 * still follows the OS.
 */
export const themeScript = `(function(){var e=document.documentElement,s=null,k=null,p;try{s=localStorage.getItem("${THEME_KEY}");k=localStorage.getItem("${DARK_PALETTE_KEY}")}catch(_){}if(s==="light"||s==="red-dragon"||s==="amoled")p=s;else if(s==="dark")p=k==="amoled"?"amoled":"${DEFAULT_DARK_PALETTE}";else{try{p=matchMedia("(prefers-color-scheme: dark)").matches?"${DEFAULT_DARK_PALETTE}":"light"}catch(_){p="light"}}var d=p!=="light";e.classList.toggle("dark",d);e.setAttribute("data-palette",p);e.style.colorScheme=d?"dark":"light"})()`;
