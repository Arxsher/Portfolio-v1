"use client";

// The live mark in the header: the same star as `Logo`, but its eyes
// follow the pointer and blink now and then (components/star-eyes.ts).
// It renders exactly LOGO_PATH on the server and at rest, so it looks
// identical to the static mark; the eyes are holes in the even-odd path
// and keep showing whatever is behind them (the page, or the link's hover
// fill). Below 2 device pixels per grid unit (a 16px mark on a 1x screen)
// the eyes move in whole device pixels, so they stay crisp. `home` marks the header mark as the spot the first-load intro
// star flies to (components/star-intro.tsx); it is hidden while that
// plays.

import { useEffect, useRef } from "react";
import { LOGO_PATH, starPath } from "@/components/logo";
import { attachEyes } from "@/components/star-eyes";

export function StarLogo({
  className,
  size = 16,
  home = false,
}: {
  className?: string;
  size?: number;
  home?: boolean;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = svg.current;
    const shape = path.current;
    if (!el || !shape) return;
    let drawn = LOGO_PATH;
    const eyes = attachEyes(el, ({ x, y, open }) => {
      const scale = ((window.devicePixelRatio || 1) * size) / 16;
      const next = starPath(x, y, open, scale < 2 ? scale : undefined);
      if (next === drawn) return;
      drawn = next;
      shape.setAttribute("d", next);
    });
    return () => {
      eyes.detach();
      shape.setAttribute("d", LOGO_PATH);
    };
  }, [size]);

  return (
    <svg
      ref={svg}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className ? `shrink-0 fill-current ${className}` : "shrink-0 fill-current"}
      aria-hidden="true"
      focusable="false"
      data-star-home={home ? "" : undefined}
    >
      <path ref={path} d={LOGO_PATH} fillRule="evenodd" />
    </svg>
  );
}
