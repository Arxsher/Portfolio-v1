// Server-safe pieces of the theme setup (no React imports), used by
// app/layout.tsx. The client API lives in lib/theme.ts.

export const THEME_KEY = "theme";

/**
 * Runs synchronously in <head> before first paint: reads the stored
 * preference (falling back to the OS setting) and applies `class="dark"`
 * and `color-scheme` to <html>.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}})()`;
