// Scoped styles for the guest house and the window panes the sign form
// borrows. Plain CSS (rendered once through React's <style href>), because
// the day / night switch has to run on its own clock:
//
// The site flips its theme with colour transitions suspended for a frame
// (lib/theme.ts), so anything keyed on `.dark` snaps. The house instead
// follows `data-night` on its root, which house.tsx sets two frames after
// the theme changed. Walls and plinth then fade over 0.8s while every lit
// window switches on its own short delay, so night falls on the model the
// way it does on Commit city: the facade darkens and the windows come on
// one by one. Before hydration (no data-night yet) `.dark` decides, so the
// static HTML is already right in either theme.
//
// Anything with `.gh` but no data-night (the sign form's panes) simply
// follows `.dark`.

export const NIGHT = `:is(.gh[data-night="1"], .dark .gh:not([data-night]))`;

export const HOUSE_CSS = /* css */ `
.gh {
  --gh-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --gh-star: 0;
  --gh-plinth-top: #e2e1de;
  --gh-plinth-front: #d6d4d0;
  --gh-plinth-side: #cdcbc7;
  --gh-plinth-rim: rgb(255 255 255 / 0.95);
  --gh-drop: rgb(30 28 36 / 0.16);
  --gh-shadow: rgb(46 44 56 / 0.2);
  --gh-shadow-a: 0.2;
  --gh-contact-a: 0.22;
  --gh-wall: #ffffff;
  --gh-wall-lo: #f4f3f0;
  --gh-wall-shade: 0.05;
  --gh-side: #e7e7e8;
  --gh-side-shade: 0.06;
  --gh-roof: #f5f5f4;
  --gh-deck: #ebebea;
  --gh-rim: rgb(255 255 255 / 1);
  --gh-slab: rgb(0 0 0 / 0.045);
  --gh-slab-side: rgb(0 0 0 / 0.05);
  --gh-jamb: #d9dadd;
  --gh-reveal-lit: #fbfbfa;
  --gh-glass: #c7d0db;
  --gh-glass-lift: 0.55;
  --gh-sill: #ffffff;
  --gh-sill-shadow: rgb(0 0 0 / 0.07);
  --gh-lobby: #cfd7e0;
  --gh-lobby-on: 0;
  --gh-mullion: #ffffff;
  --gh-text: rgb(0 0 0 / 0.42);
  --gh-tree: #e2e2e0;
  --gh-tree-hl: 1;
  --gh-trunk: #cfcfcd;
  --gh-lamp-on: 0;
  --gh-lamp-head: #d4d4d4;
  --gh-beacon: #d4574d;
  --gh-beacon-glow: 0;
  --gh-break: rgb(0 0 0 / 0.28);
  --gh-break-fill: #f2f2f2;
  --gh-room-hi: #fbf5ea;
  --gh-room-lo: #f1e7d6;
  --gh-ink: rgb(28 28 32 / 0.86);
  --gh-sheen: 0.55;
  --gh-free: color-mix(in oklab, var(--foreground) 46%, transparent);
  --gh-free-glow: transparent;
  --gh-ring: color-mix(in oklab, var(--foreground) 35%, transparent);
}
${NIGHT} {
  --gh-star: 1;
  --gh-plinth-top: #3d3e41;
  --gh-plinth-front: #343538;
  --gh-plinth-side: #2f3033;
  --gh-plinth-rim: rgb(178 192 232 / 0.22);
  --gh-drop: rgb(0 0 0 / 0.5);
  --gh-shadow: rgb(0 0 0 / 0.38);
  --gh-shadow-a: 0.42;
  --gh-contact-a: 0.45;
  --gh-wall: #4a4b4f;
  --gh-wall-lo: #3f4043;
  --gh-wall-shade: 0.16;
  --gh-side: #37383b;
  --gh-side-shade: 0.14;
  --gh-roof: #5b5c60;
  --gh-deck: #505155;
  --gh-rim: rgb(178 192 232 / 0.42);
  --gh-slab: rgb(0 0 0 / 0.16);
  --gh-slab-side: rgb(0 0 0 / 0.14);
  --gh-jamb: #2a2b2e;
  --gh-reveal-lit: #56575b;
  --gh-glass: #1b1c20;
  --gh-glass-lift: 0.05;
  --gh-sill: #5d5e62;
  --gh-sill-shadow: rgb(0 0 0 / 0.25);
  --gh-lobby: #1d1e22;
  --gh-lobby-on: 0.8;
  --gh-mullion: #55565a;
  --gh-text: rgb(255 228 190 / 0.55);
  --gh-tree: #3a3b3e;
  --gh-tree-hl: 0.22;
  --gh-trunk: #444548;
  --gh-lamp-on: 1;
  --gh-lamp-head: #ffe3b8;
  --gh-beacon: #ff5a4d;
  --gh-beacon-glow: 1;
  --gh-break: rgb(255 255 255 / 0.3);
  --gh-break-fill: #232323;
  --gh-ink: rgb(74 44 18 / 0.82);
  --gh-sheen: 0.1;
  --gh-free: rgb(255 214 160 / 0.78);
  --gh-free-glow: rgb(255 196 120 / 0.35);
  --gh-ring: rgb(255 210 150 / 0.75);
}

/* the scene ------------------------------------------------------------ */

/* Dusk and dawn on the model: a slow ease-in-out, so the windows have
   time to come on one by one while the walls darken. */
.gh-scene * {
  transition-property: fill, stroke, opacity;
  transition-duration: 1.1s;
  transition-timing-function: cubic-bezier(0.45, 0, 0.3, 1);
}
.gh[data-still] .gh-scene *,
.gh[data-still] .gh-win,
.gh[data-still] .gh-win * {
  transition: none !important;
}
/* The sky follows the page theme at once, like the panel it sits on. */
.gh-sky {
  background: radial-gradient(70% 90% at 12% 0%, rgb(255 255 255 / 0.7), transparent 70%);
}
.dark .gh-sky {
  background:
    radial-gradient(70% 90% at 12% 0%, rgb(150 160 190 / 0.06), transparent 70%),
    linear-gradient(180deg, rgb(10 10 14 / 0.35), transparent 60%);
}
.gh-star {
  position: absolute;
  will-change: opacity;
  width: 2px;
  height: 2px;
  border-radius: 9999px;
  background: rgb(235 238 255);
  opacity: calc(var(--gh-star) * var(--a, 0.6));
  transition: opacity 1.2s var(--gh-ease) var(--d, 0s);
}
${NIGHT}[data-inview] .gh-star {
  animation: gh-twinkle var(--t, 5s) ease-in-out var(--d, 0s) infinite;
}
@keyframes gh-twinkle {
  50% { opacity: calc(var(--a, 0.6) * 0.35); }
}
.gh-beacon-glow {
  position: absolute;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  border-radius: 9999px;
  background: radial-gradient(closest-side, rgb(255 90 77 / 0.7), rgb(255 90 77 / 0));
  opacity: var(--gh-beacon-glow);
  transition: opacity 1.1s cubic-bezier(0.45, 0, 0.3, 1);
  pointer-events: none;
  will-change: opacity;
}
${NIGHT}[data-inview] .gh-beacon-glow {
  animation: gh-breathe 2.8s ease-in-out infinite;
}
@keyframes gh-breathe {
  50% { opacity: 0.25; }
}
.gh-lamp-glow { opacity: var(--gh-lamp-on); transition-delay: 0.15s; }
.gh-lobby-light { opacity: var(--gh-lobby-on); transition-delay: 0.3s; }

/* windows -------------------------------------------------------------- */

.gh-win {
  position: absolute;
  display: block;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: none;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gh-win::before {
  /* the hit area: the whole cell, gaps included */
  content: "";
  position: absolute;
  inset: -34% -16%;
}
.gh-win > span,
.gh-win > svg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.gh-room {
  background: linear-gradient(180deg, var(--gh-room-hi), var(--gh-room-lo));
  opacity: 0;
  transition: opacity 0.6s var(--gh-ease) var(--gh-delay, 0s);
}
.gh-lamp {
  background:
    radial-gradient(120% 95% at 50% -10%, rgb(var(--gh-l)) 0%, color-mix(in srgb, rgb(var(--gh-l)) 86%, rgb(var(--gh-l-lo))) 45%, rgb(var(--gh-l-lo)) 100%);
  box-shadow:
    0 0 0 0.5px rgb(var(--gh-l) / 0.6),
    0 0 10px 1px rgb(var(--gh-l) / 0.36),
    0 0 30px 6px rgb(var(--gh-l) / 0.13);
  opacity: 0;
  transition: opacity 0.55s var(--gh-ease) var(--gh-delay, 0s);
}
.gh-lamp::after,
.gh-room::after {
  /* brighter while its note is out */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgb(255 252 244 / 0.2);
  opacity: 0;
  transition: opacity 0.3s var(--gh-ease);
}
.gh-win[data-active] .gh-lamp::after,
.gh-win[data-active] .gh-room::after { opacity: 1; }
.gh-ink {
  color: var(--gh-ink);
  padding: 11% 9%;
  opacity: 0;
  transition: opacity 0.6s var(--gh-ease) var(--gh-delay, 0s), color 0.6s var(--gh-ease) var(--gh-delay, 0s);
}
.gh-ink > svg { width: 100%; height: 100%; }
.gh-sheen {
  background: linear-gradient(118deg, transparent 22%, rgb(255 255 255 / 0.55) 34%, rgb(255 255 255 / 0.08) 47%, transparent 58%);
  opacity: var(--gh-sheen);
  transition: opacity 0.8s var(--gh-ease);
}
.gh-win[data-lit] .gh-room { opacity: 1; }
.gh-win[data-lit] .gh-ink { opacity: 1; }
${NIGHT} .gh-win[data-lit] .gh-room { opacity: 0; }
${NIGHT} .gh-win[data-lit] .gh-lamp { opacity: 1; }

.gh-win[data-kind="guest"]:hover,
.gh-win[data-active] {
  transform: translateY(-1px) scale(1.07);
  z-index: 2;
}
.gh-win[data-kind="guest"]:active { transform: scale(1.02); transition-duration: 0.12s; }
.gh-win:focus-visible {
  outline: 2px solid var(--foreground);
  outline-offset: 3px;
}

/* the free window: a dashed outline that breathes */
.gh-free {
  will-change: opacity;
  color: var(--gh-free);
  filter: drop-shadow(0 0 4px var(--gh-free-glow));
  overflow: visible;
}
.gh[data-inview] .gh-win[data-kind="free"] .gh-free,
.gh[data-inview] .gh-win[data-kind="arriving"] .gh-free {
  animation: gh-free 2.6s ease-in-out infinite;
}
.gh-win[data-kind="arriving"] .gh-free { animation-duration: 1.1s !important; }
@keyframes gh-free {
  50% { opacity: 0.45; }
}
.gh-win[data-kind="free"]:hover,
.gh-win[data-kind="free"][data-active] {
  transform: scale(1.07);
}

/* landing: a flash and a ring when a signature flies in */
.gh-win[data-landing] .gh-lamp,
.gh-win[data-landing] .gh-room {
  animation: gh-flash 1.1s var(--gh-ease) both;
  transition-delay: 0s;
}
.gh-win[data-landing] .gh-ink { transition-delay: 0s; }
.gh-win[data-landing]::after,
.gh-win[data-highlight]::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 4px;
  border: 1.5px solid var(--gh-ring);
  pointer-events: none;
  animation: gh-ring 1s var(--gh-ease) both;
}
.gh-win[data-highlight]::after { animation: gh-ring 1.4s var(--gh-ease) infinite; }
@keyframes gh-flash {
  0% { filter: brightness(1.9) saturate(0.7); }
  100% { filter: brightness(1); }
}
@keyframes gh-ring {
  0% { opacity: 0.95; scale: 1; }
  100% { opacity: 0; scale: 1.75 1.95; }
}

/* the window panes of the sign form ------------------------------------ */

.gh-pane {
  position: relative;
  border-radius: 10px;
  background: linear-gradient(180deg, color-mix(in oklab, var(--gh-glass) 34%, var(--float)), color-mix(in oklab, var(--gh-glass) 14%, var(--float)));
  box-shadow:
    inset 0 0 0 1px var(--edge),
    inset 3px 3px 0 -1px color-mix(in oklab, var(--foreground) 4%, transparent);
}
${NIGHT} .gh-pane {
  background: linear-gradient(180deg, #1d1e22, #24252a);
}
.gh-pane::after {
  /* the sill */
  content: "";
  position: absolute;
  left: -6px;
  right: -6px;
  bottom: -6px;
  height: 6px;
  border-radius: 0 0 5px 5px;
  background: var(--float);
  box-shadow: 0 1px 0 0 var(--edge-firm), 0 3px 6px -3px rgb(0 0 0 / 0.18);
  pointer-events: none;
}
.gh-pane-sheen {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(112deg, transparent 18%, rgb(255 255 255 / 0.5) 30%, transparent 46%);
  opacity: 0.6;
  pointer-events: none;
}
${NIGHT} .gh-pane-sheen { opacity: 0.08; }
.gh-pane[data-lit] {
  background: linear-gradient(180deg, var(--gh-room-hi), var(--gh-room-lo));
  transition: background 0.5s var(--gh-ease), box-shadow 0.5s var(--gh-ease);
}
${NIGHT} .gh-pane[data-lit] {
  background: radial-gradient(120% 100% at 50% -10%, rgb(255 222 176), rgb(255 206 140) 55%, rgb(214 150 82));
  box-shadow:
    inset 0 0 0 1px rgb(255 214 160 / 0.6),
    0 0 18px 2px rgb(255 196 120 / 0.3),
    0 0 60px 10px rgb(255 190 110 / 0.12);
}
.gh-pane[data-lit] .gh-pane-ink { color: var(--gh-ink); }

/* the register's window chip */
.gh-chip {
  display: inline-block;
  width: 16px;
  height: 11px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--gh-room-hi), var(--gh-room-lo));
  box-shadow: inset 0 0 0 1px var(--edge-firm);
}
${NIGHT} .gh-chip {
  background: radial-gradient(120% 100% at 50% -10%, rgb(255 222 176), rgb(255 200 132) 60%, rgb(214 150 82));
  box-shadow: 0 0 6px 0 rgb(255 196 120 / 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .gh-scene *, .gh-win, .gh-win * { transition-duration: 0.2s !important; transition-delay: 0s !important; }
  .gh-win[data-kind="guest"]:hover, .gh-win[data-active], .gh-win[data-kind="free"]:hover { transform: none; }
  .gh-win[data-landing]::after, .gh-win[data-highlight]::after { animation: none; opacity: 0.8; }
  .gh-free, .gh-star, .gh-beacon-glow { animation: none !important; }
}
`;
