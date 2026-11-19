// Fonts that only some lab pieces use. Geist Sans is loaded by the root
// layout; Geist Mono is defined here with preload off, because a piece's
// font would otherwise be preloaded on every page that can show the piece
// (home, /lab/, every piece page) and go unused on most of them, which
// browsers warn about. Same file, same CSS variable as `geist/font/mono`:
//
//   <div className={labMono.variable}> … font-family: var(--font-geist-mono) …
//
// The pieces load after hydration anyway, so the font arrives with them.

import localFont from "next/font/local";

export const labMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Roboto Mono", "Menlo", "Monaco", "Liberation Mono", "DejaVu Sans Mono", "Courier New", "monospace"],
});
