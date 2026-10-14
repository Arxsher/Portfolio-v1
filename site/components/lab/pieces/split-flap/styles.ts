// The look of the board. Everything is sized from --u, the width of one
// cell in px (set by piece.tsx to fit the stage or tile), so the board is
// the same drawing at every size and stays crisp at any pixel ratio.
//
// Materials
//   flaps    matte indigo-black plastic, the top half a shade lighter than
//            the bottom (lit from above), a dark hinge gap with axle
//            notches at both ends, sand letters in Instrument Sans at its
//            narrowest width; status words inked green, ochre or lavender.
//   bay      the recess the flaps sit in: near-black, inner shadow at the
//            top, a faint top light and a darker foot over the whole bay.
//   housing  by day cream enamel (it belongs on sand paper), by night
//            indigo lacquer with a sand rim; four slotted screws, the
//            header printed on it: an inlaid star, "Départs" in Fraunces
//            italic, the Casablanca clock in its own small bay.
//   lamps    one per row: green steady (on time), ochre breathing
//            (boarding), dark glass when off.

export const css = `
.sf {
  --h: calc(var(--u) * 1.44);
  --gx: calc(var(--u) * 0.12);
  --gy: calc(var(--u) * 0.2);
  --fs: calc(var(--u) * 1.2);
  --r: max(1.5px, calc(var(--u) * 0.085));
  --sf-gap: #04051a;
  --sf-ink: #f3ead9;
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
  background: linear-gradient(180deg, #2f335c 0%, #272b52 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.075), inset 0 -1px 0 rgb(0 0 0 / 0.32);
  transform-origin: 50% calc(100% + 0.5px);
}
.sf-b {
  bottom: 0;
  height: calc(50% - 0.5px);
  border-radius: 0.5px 0.5px var(--r) var(--r);
  background: linear-gradient(180deg, #24284c 0%, #1c1f42 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
  transform-origin: 50% -0.5px;
}
.sf-h::before {
  content: attr(data-c);
  position: absolute;
  inset-inline: 0;
  height: var(--h);
  font-family: var(--font-instrument), "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  font-size: var(--fs);
  line-height: var(--h);
  font-variation-settings: "wdth" 75;
  text-align: center;
  white-space: pre;
  translate: 0 var(--oy, 0em);
}
.sf-t::before { top: 0; }
.sf-b::before { bottom: 0; }
.sf-h::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: var(--s, 0);
  pointer-events: none;
}
.sf-t::after { background: linear-gradient(0deg, rgb(3 4 14 / 0.96), rgb(3 4 14 / 0.6)); }
.sf-b::after { background: linear-gradient(180deg, rgb(3 4 14 / 0.95), rgb(3 4 14 / 0.28)); }
.sf-h[data-o="l"]::after { background: linear-gradient(180deg, rgb(255 246 228 / 0.62), rgb(255 246 228 / 0.06)); }
.sf-h[data-t="green"] { color: #74d9ad; }
.sf-h[data-t="ochre"] { color: #f0c066; }
.sf-h[data-t="muted"] { color: #aaa4c0; }

.sf-grid { display: flex; flex-direction: column; gap: var(--gy); }
.sf-row { display: flex; align-items: center; gap: var(--gx); }
.sf-grid[data-touch] .sf-cell { cursor: pointer; }

/* ---- the bay ----------------------------------------------------------- */

.sf-bay {
  position: relative;
  padding: calc(var(--u) * 0.3);
  border-radius: calc(var(--u) * 0.2);
  background: linear-gradient(180deg, #08091f, #05061a);
  box-shadow: inset 0 calc(var(--u) * 0.1) calc(var(--u) * 0.3) rgb(0 0 0 / 0.8), inset 0 0 0 1px rgb(0 0 0 / 0.7),
    0 1px 0 var(--sf-lip, rgb(255 255 255 / 0.06));
}
/* a fine brass rim set into the housing around every bay */
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
  background: linear-gradient(180deg, rgb(255 250 240 / 0.05), transparent 24%, transparent 68%, rgb(0 0 0 / 0.24));
}

/* ---- lamps ------------------------------------------------------------- */

.sf-lamp {
  flex: none;
  width: calc(var(--u) * 0.24);
  height: calc(var(--u) * 0.24);
  margin-inline-start: calc(var(--u) * 0.24);
  border-radius: 50%;
  background: radial-gradient(circle at 40% 34%, #30335a, #14162f 72%);
  box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.7), 0 1px 0 rgb(255 255 255 / 0.05);
}
.sf-lamp[data-tone="green"] {
  background: radial-gradient(circle at 38% 32%, #e6fff2, #66d6a4 42%, #1f7a58 100%);
  box-shadow: 0 0 calc(var(--u) * 0.36) rgb(102 214 164 / 0.55), 0 0 calc(var(--u) * 0.1) rgb(102 214 164 / 0.9);
}
.sf-lamp[data-tone="ochre"] {
  background: radial-gradient(circle at 38% 32%, #fff3d6, #f0c066 42%, #a46c1c 100%);
  box-shadow: 0 0 calc(var(--u) * 0.36) rgb(240 192 102 / 0.55), 0 0 calc(var(--u) * 0.1) rgb(240 192 102 / 0.9);
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
  --sf-label: #625c70;
  --sf-print: #1f45a0;
  --sf-star: #c4643b;
  --sf-lip: rgb(255 255 255 / 0.85);
  --sf-rim: rgb(150 108 40 / 0.34);
  background:
    radial-gradient(120% 70% at 50% 0%, rgb(255 255 255 / 0.5), transparent 60%),
    linear-gradient(180deg, #f4ebd9 0%, #ece1cb 55%, #e3d6bc 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.95), inset 0 0 0 1px rgb(26 29 58 / 0.07),
    inset 0 -2px 0 rgb(26 29 58 / 0.07), 0 1px 1px rgb(26 29 58 / 0.14), 0 1px 0 rgb(26 29 58 / 0.06),
    0 calc(var(--u) * 0.5) calc(var(--u) * 0.9) calc(var(--u) * -0.3) rgb(26 29 58 / 0.3),
    0 calc(var(--u) * 1.6) calc(var(--u) * 2.6) calc(var(--u) * -1.2) rgb(26 29 58 / 0.42);
}
.sf-housing[data-theme="dark"] {
  --sf-label: #a29cb4;
  --sf-print: #9db7f7;
  --sf-star: #d9784b;
  --sf-lip: rgb(242 233 216 / 0.07);
  --sf-rim: rgb(230 182 90 / 0.2);
  background:
    radial-gradient(120% 70% at 50% 0%, rgb(160 180 255 / 0.07), transparent 60%),
    linear-gradient(180deg, #1d2149 0%, #161a3d 55%, #111432 100%);
  box-shadow: inset 0 1px 0 rgb(242 233 216 / 0.13), inset 0 0 0 1px rgb(242 233 216 / 0.05),
    inset 0 -2px 0 rgb(0 0 0 / 0.35), 0 0 0 1px rgb(0 0 0 / 0.35),
    0 calc(var(--u) * 0.5) calc(var(--u) * 0.9) calc(var(--u) * -0.3) rgb(0 0 0 / 0.55),
    0 calc(var(--u) * 1.6) calc(var(--u) * 2.6) calc(var(--u) * -1.2) rgb(0 0 0 / 0.7);
}

.sf-screw {
  position: absolute;
  width: calc(var(--u) * 0.26);
  height: calc(var(--u) * 0.26);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fffaf0, #cbbd9f 45%, #8d7c5c 100%);
  box-shadow: 0 0.5px 0 rgb(255 255 255 / 0.7), inset 0 0 0 0.5px rgb(60 45 20 / 0.45);
}
.sf-housing[data-theme="dark"] .sf-screw {
  background: radial-gradient(circle at 35% 30%, #8e93b8, #444a78 50%, #23264a 100%);
  box-shadow: 0 0.5px 0 rgb(255 255 255 / 0.08), inset 0 0 0 0.5px rgb(0 0 0 / 0.6);
}
.sf-screw::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  top: calc(50% - 0.5px);
  height: 1px;
  background: rgb(40 30 15 / 0.55);
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
.sf-title { display: flex; align-items: center; gap: calc(var(--u) * 0.34); min-width: 0; }
.sf-title svg { width: calc(var(--u) * 0.56); height: calc(var(--u) * 0.56); color: var(--sf-star); flex: none; }
.sf-departs {
  font-family: var(--font-fraunces), "Fraunces", ui-serif, Georgia, serif;
  font-style: italic;
  font-weight: 380;
  font-size: calc(var(--u) * 1.06);
  line-height: 1;
  letter-spacing: -0.01em;
  font-variation-settings: "SOFT" 100, "WONK" 1;
  color: var(--sf-print);
  white-space: nowrap;
}
.sf-caps {
  font-family: var(--font-instrument), "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  font-size: max(7px, calc(var(--u) * 0.3));
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-variation-settings: "wdth" 92;
  color: var(--sf-label);
  white-space: nowrap;
}
.sf-title .sf-caps { align-self: flex-end; padding-bottom: calc(var(--u) * 0.14); }
.sf-clock { display: flex; align-items: center; gap: calc(var(--u) * 0.42); }
.sf-place { display: flex; flex-direction: column; align-items: flex-end; gap: calc(var(--u) * 0.16); }
.sf-arabic {
  font-family: var(--font-reem-kufi), "Reem Kufi", system-ui, sans-serif;
  font-size: calc(var(--u) * 0.46);
  line-height: 1;
  color: var(--sf-star);
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
  padding: 0 calc(var(--u) * 1.04) calc(var(--u) * 0.2) calc(var(--u) * 0.34);
  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
.sf-cols[data-off] { opacity: 0; }

/* ---- the tile ------------------------------------------------------------ */

.sf-tile {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(90% 55% at 50% 22%, rgb(120 140 230 / 0.16), transparent 70%),
    linear-gradient(180deg, #151946 0%, #0e1127 58%, #0a0c20 100%);
}
.sf-tile-board {
  position: absolute;
  left: 50%;
  top: 64%;
  translate: -50% -50%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sf-tile .sf-caps { color: #e6b65a; font-size: max(7px, calc(var(--u) * 0.5)); letter-spacing: 0.26em; margin-bottom: calc(var(--u) * 0.62); padding-inline-start: 0.26em; }
.sf-tile-foot {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 0.36);
  margin-top: calc(var(--u) * 0.8);
}
.sf-tile-foot .sf-lamp { margin: 0; }
.sf-tile-foot i {
  display: block;
  width: calc(var(--u) * 2.6);
  height: calc(var(--u) * 0.16);
  border-radius: 99px;
  background: rgb(242 233 216 / 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .sf-lamp[data-tone] { animation: none; }
  .sf-cols { transition: none; }
}
`;
