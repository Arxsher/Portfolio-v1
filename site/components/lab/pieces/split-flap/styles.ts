// The look of the board. Everything is sized from --u, the width of one
// cell in px (set by piece.tsx to fit the stage or the tile), so the board
// is the same drawing at every size and stays crisp at any pixel ratio.
//
// Materials (all neutral, to sit on the site's grey stage and tiles)
//   flaps    matte charcoal plastic, the top half a shade lighter than the
//            bottom (lit from above), a near-black hinge gap with axle
//            notches at both ends, white letters in Geist; status words
//            inked in the site's green, amber or a quiet grey.
//   bay      the recess the flaps sit in: near-black, an inner shadow at the
//            top, a faint top light and a darker foot over the whole bay, a
//            hairline rim where it meets the housing.
//   housing  satin white enamel in light mode, graphite in dark, with a soft
//            object shadow on the stage; four steel screws; the legend
//            printed on it in Geist: the mark, "Departures" and the day, the
//            local-time clock in its own small bay under its GMT offset.
//   lamps    one per row: green steady (on time), amber breathing
//            (boarding), dark glass when off.
//
// The tile is the same object in miniature (.sf-mini): the housing holding
// two rows of eight, its legend and a single lamp, on the tile's own ground.

export const css = `
.sf {
  --h: calc(var(--u) * 1.44);
  --gx: calc(var(--u) * 0.12);
  --gy: calc(var(--u) * 0.2);
  --fs: calc(var(--u) * 1.04);
  --r: max(1.5px, calc(var(--u) * 0.085));
  --sf-gap: #050505;
  --sf-ink: #f2f2f2;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* ---- one cell ---------------------------------------------------------- */

.sf-cell {
  position: relative;
  flex: none;
  width: var(--u);
  height: var(--h);
  border-radius: var(--r);
  background: var(--sf-gap);
  perspective: calc(var(--h) * 3.4);
  box-shadow: 0 calc(var(--u) * 0.05) calc(var(--u) * 0.1) rgb(0 0 0 / 0.6);
  contain: layout style;
}
/* axle notches: the hinge gap opens wider at both ends */
.sf-cell::after {
  content: "";
  position: absolute;
  z-index: 9;
  inset-inline: 0;
  top: calc(50% - var(--u) * 0.07);
  height: calc(var(--u) * 0.14);
  background: linear-gradient(90deg, var(--sf-gap) 0 calc(var(--u) * 0.06), transparent 0 calc(100% - var(--u) * 0.06), var(--sf-gap) 0);
  pointer-events: none;
}
.sf-h {
  position: absolute;
  inset-inline: 0;
  overflow: hidden;
  color: var(--sf-ink);
}
.sf-t {
  top: 0;
  height: calc(50% - 0.5px);
  border-radius: var(--r) var(--r) 0.5px 0.5px;
  background: linear-gradient(180deg, #2b2b2b 0%, #252525 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.07), inset 0 -1px 0 rgb(0 0 0 / 0.35);
  transform-origin: 50% calc(100% + 0.5px);
}
.sf-b {
  bottom: 0;
  height: calc(50% - 0.5px);
  border-radius: 0.5px 0.5px var(--r) var(--r);
  background: linear-gradient(180deg, #212121 0%, #1b1b1b 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.045);
  transform-origin: 50% -0.5px;
}
/*
 * The letter. Geist has no width axis, so the drum face is condensed with a
 * horizontal scale (0.88), and the three widest glyphs are drawn narrower
 * still, as flap typefaces do, so even W keeps an eighth of the flap clear on
 * each side. Geist's capitals already sit centred on the line, so --oy (the
 * measured cap-height correction) is ~0 unless a fallback font is in use.
 */
.sf-h::before {
  content: attr(data-c);
  position: absolute;
  inset-inline: 0;
  height: var(--h);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--fs);
  line-height: var(--h);
  text-align: center;
  white-space: pre;
  translate: 0 var(--oy, 0em);
  scale: var(--sx, 0.88) 1;
}
.sf-h[data-c="M"] { --sx: 0.84; }
.sf-h[data-c="W"] { --sx: 0.74; }
.sf-h[data-c="@"] { --sx: 0.78; }
.sf-t::before { top: 0; }
.sf-b::before { bottom: 0; }
.sf-h::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: var(--s, 0);
  pointer-events: none;
}
.sf-t::after { background: linear-gradient(0deg, rgb(0 0 0 / 0.94), rgb(0 0 0 / 0.58)); }
.sf-b::after { background: linear-gradient(180deg, rgb(0 0 0 / 0.92), rgb(0 0 0 / 0.26)); }
.sf-h[data-o="l"]::after { background: linear-gradient(180deg, rgb(255 255 255 / 0.46), rgb(255 255 255 / 0.04)); }
.sf-h[data-t="green"] { color: #3fcf6e; }
.sf-h[data-t="amber"] { color: #e3b341; }
.sf-h[data-t="muted"] { color: #9c9c9c; }

.sf-grid { display: flex; flex-direction: column; gap: var(--gy); }
.sf-row { display: flex; align-items: center; gap: var(--gx); }
.sf-grid[data-touch] .sf-cell { cursor: pointer; }
@media (hover: hover) {
  .sf-grid[data-touch] .sf-cell:hover > .sf-t:not(.sf-fall) { background: linear-gradient(180deg, #313131 0%, #2a2a2a 100%); }
  .sf-grid[data-touch] .sf-cell:hover > .sf-b:not(.sf-land) { background: linear-gradient(180deg, #252525 0%, #1e1e1e 100%); }
}

/* ---- the bay ----------------------------------------------------------- */

.sf-bay {
  position: relative;
  padding: calc(var(--u) * 0.3);
  border-radius: calc(var(--u) * 0.2);
  background: linear-gradient(180deg, #0d0d0d, #090909);
  box-shadow: inset 0 calc(var(--u) * 0.1) calc(var(--u) * 0.3) rgb(0 0 0 / 0.8), inset 0 0 0 1px rgb(0 0 0 / 0.7),
    0 1px 0 var(--sf-lip, rgb(255 255 255 / 0.06));
}
/* a hairline rim set into the housing around every bay */
.sf-housing .sf-bay::before {
  content: "";
  position: absolute;
  inset: calc(var(--u) * -0.1);
  border-radius: calc(var(--u) * 0.28);
  box-shadow: 0 0 0 1px var(--sf-rim);
  pointer-events: none;
}
.sf-housing .sf-clockbay::before { border-radius: calc(var(--u) * 0.24); }
.sf-bay::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 20;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.045), transparent 24%, transparent 68%, rgb(0 0 0 / 0.24));
}

/* keyboard: the bay is one focusable board; a ring marks the chosen flap */
.sf-bay[tabindex] { outline: none; }
.sf-bay[tabindex]:focus-visible,
.sf-bay[data-kbd]:focus {
  outline: 2px solid var(--foreground);
  outline-offset: calc(var(--u) * 0.16);
}
.sf-bay:focus-visible .sf-cell[data-cursor],
.sf-bay[data-kbd]:focus .sf-cell[data-cursor] {
  z-index: 1;
  outline: max(1.5px, calc(var(--u) * 0.07)) solid rgb(255 255 255 / 0.92);
  outline-offset: max(1px, calc(var(--u) * 0.05));
}

/* ---- lamps ------------------------------------------------------------- */

.sf-lamp {
  flex: none;
  width: calc(var(--u) * 0.24);
  height: calc(var(--u) * 0.24);
  margin-inline-start: calc(var(--u) * 0.24);
  border-radius: 50%;
  background: radial-gradient(circle at 40% 34%, #3a3a3a, #161616 72%);
  box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.7), 0 1px 0 rgb(255 255 255 / 0.05);
}
.sf-lamp[data-tone="green"] {
  background: radial-gradient(circle at 38% 32%, #eafff0, #3fcf6e 42%, #157a37 100%);
  box-shadow: 0 0 calc(var(--u) * 0.36) rgb(63 207 110 / 0.55), 0 0 calc(var(--u) * 0.1) rgb(63 207 110 / 0.9);
}
.sf-lamp[data-tone="amber"] {
  background: radial-gradient(circle at 38% 32%, #fff5da, #e3b341 42%, #8a6512 100%);
  box-shadow: 0 0 calc(var(--u) * 0.36) rgb(227 179 65 / 0.55), 0 0 calc(var(--u) * 0.1) rgb(227 179 65 / 0.9);
  animation: sf-breathe 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes sf-breathe { 50% { opacity: 0.38; } }

/* ---- the housing -------------------------------------------------------- */

.sf-board {
  position: absolute;
  left: 0;
  top: 0;
  width: max-content;
  opacity: 0;
}
.sf-board[data-ready] { opacity: 1; }
.sf-housing {
  position: relative;
  padding: calc(var(--u) * 0.5) calc(var(--u) * 0.66) calc(var(--u) * 0.66);
  border-radius: min(12px, calc(var(--u) * 0.34));
}
.sf-housing[data-theme="light"] {
  --sf-label: #6b6b6b;
  --sf-label-strong: #2a2a2a;
  --sf-lip: rgb(255 255 255 / 0.9);
  --sf-rim: rgb(0 0 0 / 0.1);
  background:
    radial-gradient(120% 70% at 50% 0%, rgb(255 255 255 / 0.6), transparent 60%),
    linear-gradient(180deg, #fdfdfd 0%, #f1f1f1 55%, #e8e8e8 100%);
  box-shadow: inset 0 1px 0 #ffffff, inset 0 0 0 1px rgb(0 0 0 / 0.06), inset 0 -2px 0 rgb(0 0 0 / 0.045),
    0 0 0 0.5px rgb(0 0 0 / 0.06), 0 1px 1px rgb(0 0 0 / 0.1),
    0 calc(var(--u) * 0.5) calc(var(--u) * 0.9) calc(var(--u) * -0.3) rgb(0 0 0 / 0.18),
    0 calc(var(--u) * 1.6) calc(var(--u) * 2.6) calc(var(--u) * -1.2) rgb(0 0 0 / 0.28);
}
.sf-housing[data-theme="dark"] {
  --sf-label: #9c9c9c;
  --sf-label-strong: #e6e6e6;
  --sf-lip: rgb(255 255 255 / 0.06);
  --sf-rim: rgb(255 255 255 / 0.07);
  background:
    radial-gradient(120% 70% at 50% 0%, rgb(255 255 255 / 0.05), transparent 60%),
    linear-gradient(180deg, #2e2e2e 0%, #252525 55%, #1e1e1e 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.11), inset 0 0 0 1px rgb(255 255 255 / 0.05),
    inset 0 -2px 0 rgb(0 0 0 / 0.3), 0 0 0 1px rgb(0 0 0 / 0.42),
    0 calc(var(--u) * 0.5) calc(var(--u) * 0.9) calc(var(--u) * -0.3) rgb(0 0 0 / 0.5),
    0 calc(var(--u) * 1.6) calc(var(--u) * 2.6) calc(var(--u) * -1.2) rgb(0 0 0 / 0.66);
}

.sf-screw {
  --i: calc(var(--u) * 0.2);
  position: absolute;
  width: calc(var(--u) * 0.26);
  height: calc(var(--u) * 0.26);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff, #c9c9c9 45%, #8a8a8a 100%);
  box-shadow: 0 0.5px 0 rgb(255 255 255 / 0.8), inset 0 0 0 0.5px rgb(0 0 0 / 0.35);
}
.sf-screw[data-p="tl"] { left: var(--i); top: var(--i); }
.sf-screw[data-p="tr"] { right: var(--i); top: var(--i); }
.sf-screw[data-p="bl"] { left: var(--i); bottom: var(--i); }
.sf-screw[data-p="br"] { right: var(--i); bottom: var(--i); }
.sf-housing[data-theme="dark"] .sf-screw {
  background: radial-gradient(circle at 35% 30%, #8f8f8f, #4a4a4a 50%, #262626 100%);
  box-shadow: 0 0.5px 0 rgb(255 255 255 / 0.07), inset 0 0 0 0.5px rgb(0 0 0 / 0.6);
}
.sf-screw::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  top: calc(50% - 0.5px);
  height: 1px;
  background: rgb(0 0 0 / 0.45);
  rotate: var(--a, 30deg);
}
.sf-housing[data-theme="dark"] .sf-screw::after { background: rgb(0 0 0 / 0.65); }

.sf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u) * 0.8);
  min-height: calc(var(--u) * 1.62);
  padding-inline: calc(var(--u) * 0.16) 0;
  margin-bottom: calc(var(--u) * 0.18);
}
.sf-title { display: flex; align-items: center; gap: calc(var(--u) * 0.3); min-width: 0; }
.sf-title svg { width: calc(var(--u) * 0.52); height: calc(var(--u) * 0.52); color: var(--sf-label); flex: none; }
.sf-departs {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: calc(var(--u) * 0.78);
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--sf-label-strong);
  white-space: nowrap;
}
.sf-caps {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: max(7px, calc(var(--u) * 0.3));
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--sf-label);
  white-space: nowrap;
}
.sf-title .sf-caps { align-self: flex-end; padding-bottom: calc(var(--u) * 0.12); margin-inline-start: calc(var(--u) * 0.08); }
.sf-clock { display: flex; align-items: center; gap: calc(var(--u) * 0.42); }
.sf-place { display: flex; flex-direction: column; align-items: flex-end; gap: calc(var(--u) * 0.16); }
.sf-zone {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: calc(var(--u) * 0.44);
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--sf-label);
  white-space: nowrap;
}
.sf-clockbay { display: flex; align-items: center; gap: var(--gx); padding: calc(var(--u) * 0.16); border-radius: calc(var(--u) * 0.16); }
.sf-colon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--u) * 0.32);
  width: calc(var(--u) * 0.22);
}
.sf-colon::before, .sf-colon::after {
  content: "";
  width: calc(var(--u) * 0.11);
  height: calc(var(--u) * 0.11);
  border-radius: 50%;
  background: var(--sf-ink);
  opacity: 0.85;
}
.sf-cols {
  display: flex;
  justify-content: space-between;
  padding: 0 calc(var(--u) * 1.04) calc(var(--u) * 0.24) calc(var(--u) * 0.34);
  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
.sf-cols[data-off] { opacity: 0; }

/* ---- the tile: the same object in miniature ----------------------------- */

.sf-tile {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.sf-mini {
  position: absolute;
  left: 50%;
  top: 50%;
  width: max-content;
  translate: -50% -52%;
  padding: calc(var(--u) * 0.24) calc(var(--u) * 0.5) calc(var(--u) * 0.5);
  border-radius: min(10px, calc(var(--u) * 0.36));
}
.sf-mini .sf-screw { --i: calc(var(--u) * 0.15); width: calc(var(--u) * 0.22); height: calc(var(--u) * 0.22); }
.sf-mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(var(--u) * 0.98);
  padding-inline: calc(var(--u) * 0.2) calc(var(--u) * 0.22);
}
.sf-mini-head .sf-caps { font-size: max(6px, calc(var(--u) * 0.36)); letter-spacing: 0.22em; }
.sf-mini-head .sf-lamp { margin: 0; width: calc(var(--u) * 0.26); height: calc(var(--u) * 0.26); }

@media (prefers-reduced-motion: reduce) {
  .sf-lamp[data-tone] { animation: none; }
  .sf-cols { transition: none; }
  .sf-board { transition: none !important; }
}
`;
