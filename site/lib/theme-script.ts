// Server-safe pieces of the theme setup (no React imports), used by
// app/layout.tsx. The client API lives in lib/theme.ts.

/** The chosen theme: "light", "amoled" or "red-dragon" (absent = follow the
    OS). An older "dark" value means "the last dark palette". */
export const THEME_KEY = "theme";

/** The dark palette picked last ("amoled" | "red-dragon"): the light/dark
    toggle comes back to it. Absent until one is picked or toggled to. */
export const DARK_PALETTE_KEY = "theme-dark";

/** The main dark palette: what a dark OS gets on a first visit and under
    "system", and where the light/dark toggle goes until a dark palette is
    picked. Red Dragon is the alternative; once picked it is stored and
    kept. Plain `.dark` (no data-palette) in app/globals.css is AMOLED to
    match. */
export const DEFAULT_DARK_PALETTE = "amoled";

/** Page backgrounds per palette, for <meta name="theme-color">. Keep in
    step with --background in app/globals.css. */
export const PALETTE_BACKGROUND = {
  light: "#fbfbfb",
  amoled: "#000000",
  "red-dragon": "#1a0b0c",
} as const;

/**
 * Runs synchronously in <head> before first paint: reads the stored theme
 * (falling back to the OS setting: light, or AMOLED when it is dark) and
 * applies `class="dark"`, `data-palette="light|amoled|red-dragon"` and
 * `color-scheme` to <html>. Storage and matchMedia are read separately so
 * a blocked localStorage still follows the OS. An older stored "dark"
 * means the last dark palette picked (AMOLED if none was).
 */
export const themeScript = `(function(){var e=document.documentElement,s=null,k=null,p;try{s=localStorage.getItem("${THEME_KEY}");k=localStorage.getItem("${DARK_PALETTE_KEY}")}catch(_){}if(s==="light"||s==="red-dragon"||s==="amoled")p=s;else if(s==="dark")p=k==="amoled"||k==="red-dragon"?k:"${DEFAULT_DARK_PALETTE}";else{try{p=matchMedia("(prefers-color-scheme: dark)").matches?"${DEFAULT_DARK_PALETTE}":"light"}catch(_){p="light"}}var d=p!=="light";e.classList.toggle("dark",d);e.setAttribute("data-palette",p);e.style.colorScheme=d?"dark":"light"})()`;
