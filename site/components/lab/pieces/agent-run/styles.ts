// Styles that Tailwind utilities can't say on their own: keyframes, the
// shimmer clipped to text, odometer strips, the graph's edge states and the
// collapsible rows. Everything is scoped under .ar and drawn from the
// site's tokens, so it follows light and dark with the rest of the page.

export const css = `
.ar {
  --ar-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --ar-live: var(--accent);
  --ar-live-wash: var(--accent-wash);
  font-feature-settings: "cv11" 1;
}
.ar-mono {
  font-family: var(--ar-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.ar-num { color: var(--ar-live); }
.ar-label {
  margin: 0 0 4px;
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tertiary);
}
.ar[data-paused] *,
.ar[data-paused] *::before,
.ar[data-paused] *::after { animation-play-state: paused !important; }

/* the card */
.ar-card {
  background: var(--float);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.06),
    0 1px 2px -1px rgb(0 0 0 / 0.08),
    0 10px 24px -10px rgb(0 0 0 / 0.12),
    0 28px 56px -28px rgb(0 0 0 / 0.14);
}
.dark .ar-card {
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.075),
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    0 2px 4px -2px rgb(0 0 0 / 0.5),
    0 22px 48px -18px rgb(0 0 0 / 0.65);
}

/* entrances */
@keyframes ar-in { from { opacity: 0; translate: 0 5px; filter: blur(3px); } }
.ar-in { animation: ar-in 420ms var(--ease-out) both; }
@keyframes ar-fade { from { opacity: 0; } }
.ar-fade { animation: ar-fade 300ms var(--ease-out) both; }
@keyframes ar-word { from { opacity: 0; filter: blur(4px); } }
.ar-word { animation: ar-word 460ms var(--ease-out) both; }
@keyframes ar-pop { 0% { scale: 0.35; opacity: 0; } 60% { opacity: 1; } }
.ar-pop { animation: ar-pop 480ms var(--ease-spring) both; transform-box: fill-box; transform-origin: center; }
@keyframes ar-draw { from { stroke-dashoffset: var(--len, 12); } }
.ar-draw { stroke-dasharray: var(--len, 12); animation: ar-draw 380ms 110ms var(--ease-out) both; }

/* in progress */
@keyframes ar-spin { to { rotate: 360deg; } }
.ar-spin { animation: ar-spin 0.8s linear infinite; transform-box: view-box; transform-origin: 50% 50%; }
@keyframes ar-shimmer { from { background-position: 100% 0; } to { background-position: 0% 0; } }
.ar-shimmer {
  color: transparent;
  background-image: linear-gradient(
    90deg,
    var(--tertiary) 0%,
    var(--tertiary) 38%,
    var(--foreground) 50%,
    var(--tertiary) 62%,
    var(--tertiary) 100%
  );
  background-size: 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ar-shimmer 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes ar-dot { 0%, 100% { opacity: 0.32; } 35% { opacity: 1; } }
.ar-dots > circle { animation: ar-dot 1.2s ease-in-out infinite; }
.ar-dots > circle:nth-of-type(2) { animation-delay: 0.2s; }
.ar-dots > circle:nth-of-type(3) { animation-delay: 0.4s; }
@keyframes ar-ping { from { scale: 1; opacity: 0.6; } to { scale: 2.8; opacity: 0; } }
.ar-ping { animation: ar-ping 1.6s var(--ease-out) infinite; }
@keyframes ar-halo { from { scale: 1; opacity: 0.5; } to { scale: 1.75; opacity: 0; } }
.ar-halo { box-shadow: 0 0 0 1.5px var(--ar-live); animation: ar-halo 1.8s var(--ease-out) infinite; }
@keyframes ar-blink { 50% { opacity: 0; } }
.ar-caret {
  display: inline-block;
  width: 0.5em;
  height: 1.05em;
  margin-inline-start: 1px;
  vertical-align: -0.17em;
  border-radius: 1.5px;
  background: color-mix(in oklab, var(--foreground) 55%, transparent);
  animation: ar-blink 1s steps(1) infinite;
}

/* collapsible rows */
.ar-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 380ms var(--ease-out), opacity 240ms var(--ease-out);
}
.ar-collapse[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ar-collapse > * { min-height: 0; overflow: hidden; }

/* the transcript fades out under the header and above the bottom edge */
.ar-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar) transparent;
  overscroll-behavior: contain;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 22px), transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 22px), transparent 100%);
}

/* odometer */
.ar-odo-col {
  position: relative;
  display: inline-block;
  height: 1.25em;
  line-height: 1.25em;
  transition: color 400ms var(--ease-out);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%);
}
.ar-odo-strip {
  position: absolute;
  inset: 0 0 auto 0;
  display: flex;
  flex-direction: column;
  will-change: transform;
}
.ar-odo-strip > span { height: 1.25em; line-height: 1.25em; text-align: center; }
.ar-odo-sep { transition: color 400ms var(--ease-out); }
.ar-odo-col[data-lead],
.ar-odo-sep[data-lead] { color: color-mix(in oklab, currentColor 26%, transparent); }

/* graph */
.ar-edge {
  fill: none;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke: var(--line-firm);
  transition: stroke 400ms var(--ease-out), stroke-opacity 400ms var(--ease-out);
}
.ar-edge[data-state="pending"] { stroke: var(--line-dash); stroke-dasharray: 2 3.5; }
.ar-edge[data-state="live"] { stroke: var(--ar-live); stroke-opacity: 0.5; }
.ar-edge[data-state="done"] { stroke: color-mix(in oklab, var(--foreground) 30%, transparent); }
.ar-edge[data-state="stopped"] { stroke: var(--line-firm); }
.ar-packet { fill: var(--ar-live); }
.ar-packet-glow { fill: var(--ar-live); opacity: 0.16; }
.ar-pill {
  border-radius: 999px;
  background: var(--float);
  box-shadow: inset 0 0 0 1px var(--line-firm), 0 1px 2px rgb(0 0 0 / 0.04);
  transition: box-shadow 360ms var(--ease-out), background-color 360ms var(--ease-out), opacity 360ms var(--ease-out);
}
.ar-pill-glyph { color: var(--secondary); transition: color 360ms var(--ease-out); }
.ar-pill[data-state="queued"] { opacity: 0.55; box-shadow: inset 0 0 0 1px var(--line-dash); background: transparent; }
.ar-pill[data-state="pending"] .ar-pill-glyph { color: var(--tertiary); }
.ar-pill[data-state="running"] {
  background: color-mix(in oklab, var(--ar-live) 7%, var(--float));
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ar-live) 55%, transparent), 0 0 0 3px var(--ar-live-wash);
}
.ar-pill[data-state="running"] .ar-pill-glyph { color: var(--ar-live); }
.ar-pill[data-state="done"] .ar-pill-glyph { color: var(--foreground); }
.dark .ar-pill { box-shadow: inset 0 0 0 1px var(--line-firm); }
.ar-pill[data-size="tile"] { box-shadow: inset 0 0 0 0.75px var(--line-firm); }
.ar-pill[data-size="tile"][data-state="queued"] { box-shadow: inset 0 0 0 0.75px var(--line-dash); }
.ar-pill[data-size="tile"][data-state="running"] {
  box-shadow: inset 0 0 0 0.75px color-mix(in oklab, var(--ar-live) 60%, transparent), 0 0 0 1.5px var(--ar-live-wash);
}

/* the tile's miniature card */
.ar-tile-card {
  background: var(--float);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.055),
    0 1px 2px -1px rgb(0 0 0 / 0.07),
    0 8px 18px -8px rgb(0 0 0 / 0.12);
  transition: translate 360ms var(--ease-out), box-shadow 360ms var(--ease-out);
}
.dark .ar-tile-card {
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.035), 0 14px 28px -14px rgb(0 0 0 / 0.7);
}
.group:hover .ar-tile-card { translate: 0 -2px; }
.ar-swap { transition: opacity 420ms var(--ease-out), filter 420ms var(--ease-out), translate 420ms var(--ease-out); }
.ar-swap[data-out] { opacity: 0; filter: blur(3px); translate: 0 -3px; }

@media (prefers-reduced-motion: reduce) {
  .ar-spin, .ar-shimmer, .ar-dots > circle, .ar-ping, .ar-halo, .ar-caret { animation: none; }
  .ar-shimmer { color: var(--tertiary); background: none; }
  .ar-collapse, .ar-swap, .ar-tile-card, .ar-pill, .ar-edge { transition: none; }
  .ar-halo { display: none; }
}
`;
