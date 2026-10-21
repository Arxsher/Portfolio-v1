// First-load intro: the star appears big in the middle of the screen,
// looks at the visitor, blinks, and flies home to the header mark along a
// loop-de-loop (components/star-path.ts has the choreography,
// components/star-flight.tsx runs it).
//
// It plays once per tab session (sessionStorage), never with reduced
// motion, and never on client-side navigations (the layout doesn't
// remount). The decision is made by the tiny inline script below while the
// page is still parsing, so on that first paint the header mark is already
// hidden and the big star is already on screen, even before React
// hydrates. Until then CSS keeps it alive: it pops in, breathes slowly and
// blinks once (BLINK_AT), so a slow hydration never looks like a frozen
// loader. The flight takes over from exactly where CSS left it and
// launches after the blink.
//
// The overlay never takes pointer events, so the page underneath is usable
// at once; a click or tap anywhere, or Esc, sends the star dashing home (a
// scroll does not: the star follows the mark). Should the script run but
// the app never hydrate, a CSS failsafe fades the star out and brings the
// header mark back after FAILSAFE_S.
//
// Rendered by app/layout.tsx at the top of <body>.

import { StarFlight } from "@/components/star-flight";
import { BLINK_AT, BLINK_LEN, FAILSAFE_S, INTRO_ATTR, INTRO_KEY, POP } from "@/components/star-path";

const script = `(function(){try{var d=document.documentElement;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${INTRO_KEY}"))return;sessionStorage.setItem("${INTRO_KEY}","1");window.__starIntro={at:performance.now()};d.setAttribute("${INTRO_ATTR}","")}catch(e){}})()`;

// The star's start size is clamp(112px, 32vmin, 152px) (the flight reads
// it back from the element); the smear copies share it. `data-star-intro=""`
// is the pre-hydration state; the flight sets it to "live", which also
// cancels the failsafe. The blink squashes each eye towards its bottom
// edge, like the lid the eye engine draws (fill: both keeps it findable
// with getAnimations() once it has run, so the flight doesn't blink twice).
const css = `
.star-intro{display:none}
html[${INTRO_ATTR}] .star-intro{display:block;position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden;contain:strict}
.star-intro-star,.star-intro-ghost{position:absolute;width:clamp(112px,32vmin,152px);height:clamp(112px,32vmin,152px);color:var(--foreground)}
.star-intro-star{left:50%;top:50%;translate:-50% -50%}
.star-intro-ghost{left:0;top:0;opacity:0;transform-origin:0 0}
.star-intro svg{display:block;width:100%;height:100%;overflow:visible}
html[${INTRO_ATTR}] .star-intro-star{animation:star-intro-pop ${POP}s cubic-bezier(.3,1.45,.55,1) both}
html[${INTRO_ATTR}] .star-intro-star>svg{animation:star-intro-breathe 1.1s cubic-bezier(.37,0,.63,1) ${POP}s infinite alternate}
html[${INTRO_ATTR}] .star-intro-star ellipse{transform-box:fill-box;transform-origin:50% 100%;animation:star-intro-blink ${BLINK_LEN}s ${BLINK_AT}s both}
html[${INTRO_ATTR}] [data-star-home]{opacity:0}
html[${INTRO_ATTR}=""] .star-intro{animation:star-intro-failsafe .3s ${FAILSAFE_S}s both}
html[${INTRO_ATTR}=""] [data-star-home]{animation:star-home-failsafe .3s ${FAILSAFE_S}s both}
@keyframes star-intro-pop{from{scale:.25;rotate:-16deg;opacity:0}40%{opacity:1}}
@keyframes star-intro-breathe{to{scale:1.012;translate:0 -2px}}
@keyframes star-intro-blink{0%{transform:scaleY(1);animation-timing-function:cubic-bezier(.55,0,1,.45)}30%,48%{transform:scaleY(.08);animation-timing-function:cubic-bezier(0,.55,.45,1)}to{transform:scaleY(1)}}
@keyframes star-intro-failsafe{to{opacity:0;visibility:hidden}}
@keyframes star-home-failsafe{from{opacity:0}to{opacity:1}}
@media print{.star-intro{display:none!important}}
`;

export function StarIntro() {
  return (
    <>
      <style href="star-intro" precedence="default">
        {css}
      </style>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <StarFlight />
    </>
  );
}
