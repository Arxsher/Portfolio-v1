// Styles that Tailwind utilities can't say on their own: keyframes, the
// shimmer clipped to text, the rolling labels, odometer strips, the graph
// (edge states and current, packets, the sweeping border light, the merge
// pulse) and the collapsible rows. Everything is scoped under .ar and drawn
// from the site's tokens, so it follows light and dark with the rest of the
// page.

export const css = `
@property --ar-beam {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
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

/* a label that rolls: the old text rises out as the new one rises in */
@keyframes ar-roll-in { from { opacity: 0; translate: 0 0.6em; filter: blur(2px); } }
@keyframes ar-roll-out { to { opacity: 0; translate: 0 -0.6em; filter: blur(2px); } }
.ar-roll-in { animation: ar-roll-in 240ms var(--ease-out) both; }
.ar-roll-out { animation: ar-roll-out 220ms var(--ease-out) both; }

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
@keyframes ar-halo { from { scale: 1; opacity: 0.45; } to { scale: 1.6; opacity: 0; } }
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

/* odometer: a resting digit sits between 23% and 77% of its column, so the
   fade only ever touches a strip that is moving */
.ar-odo-col {
  position: relative;
  display: inline-block;
  height: 1.4em;
  line-height: 1.4em;
  margin-block: -0.075em;
  transition: opacity 220ms var(--ease-out);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 22%, #000 78%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 22%, #000 78%, transparent 100%);
}
.ar-odo-strip {
  position: absolute;
  inset: 0 0 auto 0;
  display: flex;
  flex-direction: column;
  will-change: transform;
}
.ar-odo-strip > span { height: 1.4em; line-height: 1.4em; text-align: center; }
.ar-odo-sep { transition: opacity 220ms var(--ease-out); }
.ar-odo-col[data-lead],
.ar-odo-sep[data-lead] { opacity: 0; }

/* the panel the graph sits on: a faint dot grid, lit from the middle */
.ar-panel {
  position: relative;
  isolation: isolate;
  background: var(--background);
  box-shadow: inset 0 0 0 1px var(--border);
}
.dark .ar-panel { background: color-mix(in oklab, var(--background) 70%, var(--float)); }
.ar-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background-image: radial-gradient(circle, color-mix(in oklab, var(--foreground) 16%, transparent) 0.75px, transparent 1.1px);
  background-size: 12px 12px;
  background-position: 6px 6px;
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 42%, #000 20%, transparent 100%);
  mask-image: radial-gradient(ellipse 70% 80% at 50% 42%, #000 20%, transparent 100%);
}

/* graph: edges */
.ar-edge {
  fill: none;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke: var(--line-firm);
  transition: stroke 400ms var(--ease-out), stroke-opacity 400ms var(--ease-out);
}
.ar-graph[data-variant="wide"] .ar-edge { stroke-width: 1.4; }
.ar-graph[data-variant="tile"] .ar-edge { stroke-width: 0.9; }
.ar-edge[data-state="pending"] { stroke: var(--line-dash); stroke-dasharray: 2 3.5; }
.ar-graph[data-variant="tile"] .ar-edge[data-state="pending"] { stroke-dasharray: 1.4 2.4; }
.ar-edge[data-state="live"] { stroke: var(--ar-live); stroke-opacity: 0.32; }
.ar-edge[data-state="done"] { stroke: var(--foreground); stroke-opacity: 0.28; }
.ar-edge[data-state="stopped"] { stroke: var(--line-firm); }
/* a faint current flowing along a live edge */
@keyframes ar-current { to { stroke-dashoffset: -9; } }
.ar-current {
  fill: none;
  stroke: var(--ar-live);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-dasharray: 0.01 9;
  stroke-opacity: 0.7;
  animation: ar-current 0.55s linear infinite;
}
.ar-graph[data-variant="tile"] .ar-current { stroke-width: 1; stroke-dasharray: 0.01 5; }
/* when the last result lands every edge flashes ink once */
@keyframes ar-flash { from { stroke-opacity: 0.9; stroke-width: 2; } }
.ar-graph[data-merged] .ar-edge { animation: ar-flash 1.1s var(--ease-out); }
.ar-graph[data-variant="tile"][data-merged] .ar-edge { animation-name: ar-flash-tile; }
@keyframes ar-flash-tile { from { stroke-opacity: 0.85; stroke-width: 1.2; } }

/* graph: packets */
.ar-trail { fill: none; stroke-linecap: round; }
.ar-stop { stop-color: var(--ar-live); }
.ar-packet { fill: var(--ar-live); }
.ar-packet-glow { fill: var(--ar-live); opacity: 0.17; }
.dark .ar-packet { fill: color-mix(in oklab, var(--ar-live) 72%, #fff); }
.dark .ar-packet-glow { opacity: 0.24; }

/* graph: the lead's glow while it hands out work */
@keyframes ar-breathe { 50% { scale: 0.86; opacity: 0.7; } }
.ar-lead-glow {
  position: absolute;
  translate: -50% -50%;
  border-radius: 999px;
  pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--ar-live) 24%, transparent), color-mix(in oklab, var(--ar-live) 7%, transparent) 55%, transparent);
  opacity: 0;
  transition: opacity 700ms var(--ease-out);
}
.dark .ar-lead-glow {
  background: radial-gradient(closest-side, color-mix(in oklab, var(--ar-live) 32%, transparent), color-mix(in oklab, var(--ar-live) 10%, transparent) 55%, transparent);
}
.ar-lead-glow[data-on] { opacity: 1; animation: ar-breathe 2.6s ease-in-out infinite; }
.ar-lead { box-shadow: 0 1px 2px rgb(0 0 0 / 0.14), 0 4px 10px -4px rgb(0 0 0 / 0.25); }
.ar-graph[data-variant="tile"] .ar-lead { box-shadow: none; }

/* graph: the merge pulse */
@keyframes ar-merge-ring { from { scale: 1; opacity: 0.5; } to { scale: 2.5; opacity: 0; } }
@keyframes ar-merge-glow { from { opacity: 1; } to { opacity: 0; } }
.ar-merge-ring { box-shadow: 0 0 0 1.5px var(--foreground); animation: ar-merge-ring 900ms var(--ease-out) both; pointer-events: none; }
.ar-merge-ring::before {
  content: "";
  position: absolute;
  inset: -40%;
  border-radius: inherit;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--foreground) 16%, transparent), transparent);
  animation: ar-merge-glow 900ms var(--ease-out) both;
}

/* graph: sub-agent nodes */
.ar-node {
  --ar-node-fill: var(--float);
  border-radius: 999px;
  border: 1px solid var(--line-firm);
  background: var(--ar-node-fill);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  transition: border-color 360ms var(--ease-out), background-color 360ms var(--ease-out), opacity 360ms var(--ease-out), box-shadow 360ms var(--ease-out);
}
.ar-node[data-variant="wide"] { border-radius: 14px; box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 6px 16px -10px rgb(0 0 0 / 0.14); }
.ar-node[data-variant="tile"] { border-width: 0.75px; box-shadow: none; }
.dark .ar-node { box-shadow: none; }
.ar-node-glyph { color: var(--secondary); transition: color 360ms var(--ease-out); }
.ar-node[data-state="queued"] { opacity: 0.6; border-style: dashed; border-color: var(--line-dash); background: transparent; box-shadow: none; }
.ar-node[data-state="queued"] .ar-node-glyph,
.ar-node[data-state="pending"] .ar-node-glyph { color: var(--tertiary); }
.ar-node[data-state="done"] .ar-node-glyph { color: var(--foreground); }
/* running: a light sweeps round the border, from ink into the accent */
@keyframes ar-beam { to { --ar-beam: 1turn; } }
.ar-node[data-state="running"] {
  --ar-node-fill: color-mix(in oklab, var(--ar-live) 6%, var(--float));
  --ar-rim: color-mix(in oklab, var(--ar-live) 34%, var(--float));
  border-color: transparent;
  background:
    linear-gradient(var(--ar-node-fill), var(--ar-node-fill)) padding-box,
    conic-gradient(
      from var(--ar-beam),
      var(--ar-rim) 0turn,
      var(--ar-rim) 0.62turn,
      color-mix(in oklab, var(--foreground) 45%, var(--ar-live)) 0.8turn,
      var(--ar-live) 0.9turn,
      var(--ar-rim) 1turn
    ) border-box;
  box-shadow: 0 0 0 3px var(--ar-live-wash), 0 6px 16px -8px color-mix(in oklab, var(--ar-live) 50%, transparent);
  animation: ar-beam 2.2s linear infinite;
}
.ar-node[data-variant="tile"][data-state="running"] { box-shadow: 0 0 0 1.5px var(--ar-live-wash); }
.ar-node[data-state="running"] .ar-node-glyph { color: var(--ar-live); }
.ar-node[data-state="stopped"] { opacity: 0.8; }
@keyframes ar-pulse { 50% { opacity: 0.4; scale: 0.75; } }
.ar-node-live {
  display: block;
  border-radius: 999px;
  background: var(--ar-live);
  box-shadow: 0 0 0 2.5px var(--ar-live-wash);
  animation: ar-pulse 1.1s ease-in-out infinite;
}

/* the tile's miniature card */
.ar-tile-card {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--float);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.055),
    0 1px 2px -1px rgb(0 0 0 / 0.07),
    0 8px 18px -8px rgb(0 0 0 / 0.12);
  transition: translate 420ms var(--ease-out), box-shadow 420ms var(--ease-out);
}
.dark .ar-tile-card {
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.035), 0 14px 28px -14px rgb(0 0 0 / 0.7);
}
.group:hover .ar-tile-card {
  translate: 0 -4px;
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.055),
    0 2px 4px -2px rgb(0 0 0 / 0.08),
    0 16px 28px -12px rgb(0 0 0 / 0.16);
}
.dark .group:hover .ar-tile-card {
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.04), 0 20px 34px -14px rgb(0 0 0 / 0.75);
}
.ar-swap { transition: opacity 420ms var(--ease-out), filter 420ms var(--ease-out), translate 420ms var(--ease-out); }
.ar-swap[data-out] { opacity: 0; filter: blur(3px); translate: 0 -3px; }

@media (prefers-reduced-motion: reduce) {
  .ar-spin, .ar-shimmer, .ar-dots > circle, .ar-ping, .ar-halo, .ar-caret, .ar-current, .ar-node-live,
  .ar-lead-glow[data-on], .ar-merge-ring, .ar-merge-ring::before, .ar-roll-in, .ar-roll-out,
  .ar-node[data-state="running"], .ar-graph[data-merged] .ar-edge { animation: none; }
  .ar-roll-out { display: none; }
  .ar-shimmer { color: var(--tertiary); background: none; }
  .ar-collapse, .ar-swap, .ar-tile-card, .ar-node, .ar-edge, .ar-lead-glow, .ar-odo-col, .ar-odo-sep { transition: none; }
  .ar-halo, .ar-merge-ring { display: none; }
}
`;
