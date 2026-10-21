// First-load intro: the star appears big in the middle of the screen,
// looks at the visitor, blinks, and flies home to the header mark along a
// loop-de-loop (components/star-path.ts has the choreography,
// components/star-flight.tsx runs it).
//
// It plays once per tab session (sessionStorage), never with reduced
// motion, and never on client-side navigations (the layout doesn't
// remount). The decision is made by the tiny inline script below while the
// page is still parsing, so on that first paint the header mark is already
// hidden and the big star is already on screen (popping in with CSS),
// even before React hydrates; the flight starts once it has.
//
// The overlay never takes pointer events, so the page underneath is usable
// at once; a click or tap anywhere, or Esc, skips straight to the end (a
// scroll does not: the star follows the mark). Should the script run but
// the app never hydrate, a CSS failsafe fades the star out and brings the
// header mark back after FAILSAFE_S.
//
// Rendered by app/layout.tsx at the top of <body>.

import { StarFlight } from "@/components/star-flight";
import { FAILSAFE_S, INTRO_ATTR, INTRO_KEY, POP } from "@/components/star-path";

const script = `(function(){try{var d=document.documentElement;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${INTRO_KEY}"))return;sessionStorage.setItem("${INTRO_KEY}","1");window.__starIntro={at:performance.now()};d.setAttribute("${INTRO_ATTR}","")}catch(e){}})()`;

// The star's start size is clamp(112px, 32vmin, 152px) (the flight reads
// it back from the element). `data-star-intro=""` is the pre-hydration
// state; the flight sets it to "live", which also cancels the failsafe.
const css = `
.star-intro{display:none}
html[${INTRO_ATTR}] .star-intro{display:block;position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden;contain:strict}
.star-intro-star{position:absolute;left:50%;top:50%;width:clamp(112px,32vmin,152px);height:clamp(112px,32vmin,152px);translate:-50% -50%;color:var(--foreground)}
.star-intro-star svg{display:block;width:100%;height:100%;overflow:visible}
html[${INTRO_ATTR}] .star-intro-star{animation:star-intro-pop ${POP}s cubic-bezier(.3,1.45,.55,1) both}
html[${INTRO_ATTR}] [data-star-home]{opacity:0}
html[${INTRO_ATTR}=""] .star-intro{animation:star-intro-failsafe .3s ${FAILSAFE_S}s both}
html[${INTRO_ATTR}=""] [data-star-home]{animation:star-home-failsafe .3s ${FAILSAFE_S}s both}
@keyframes star-intro-pop{from{scale:.25;rotate:-16deg;opacity:0}40%{opacity:1}}
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
