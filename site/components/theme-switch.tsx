"use client";

// The site's theme toggle: the lab's Daylight switch (components/lab/pieces/
// daylight), made small. A pill with a tiny landscape in its track; tap it,
// or drag the knob, and the sun sets behind the hills, the stars come out and
// the moon rises, and the page follows into dark mode as the knob lands.
//
// - Same model and renderer as the lab piece, at the "compact" level of
//   detail (sky, sun, moon, a few stars, a cloud, three ridges, the knob).
//   Canvas 2D, a 56 × 28 pill drawn at up to 3× for crisp edges; the frame
//   loop sleeps as soon as the knob is at rest, so an idle header costs
//   nothing.
// - Before hydration a static SVG of both resting ends sits under the
//   canvas and the `dark` class on <html> picks the right one, so the
//   switch is already correct on first paint; the canvas draws the same
//   frame in a layout effect and takes over before the browser paints.
// - Light / dark only (lib/theme.ts): "system" stays in the command
//   palette's Theme panel. When the theme changes elsewhere (palette, OS,
//   another tab, the lab's big switch) this one animates to match.
// - role="switch" named "Dark mode"; Enter / Space toggle, ← / → push the
//   knob (hold for a slow sunset). Reduced motion: it jumps.

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useLatest, useReducedMotion } from "@/components/lab/hooks";
import { bindSwitch, useSwitchCanvas } from "@/components/lab/pieces/daylight/bind";
import { FEEL, SwitchModel } from "@/components/lab/pieces/daylight/model";
import { SwitchView } from "@/components/lab/pieces/daylight/render";
import { SwitchStill } from "@/components/lab/pieces/daylight/still";
import { cn } from "@/lib/cn";
import { getResolvedTheme, setTheme, syncTheme, useResolvedTheme } from "@/lib/theme";

const W = 56;
const H = 28;

const shownSide = () => (getResolvedTheme() === "dark" ? 1 : 0);

export function ThemeSwitch({ className }: { className?: string }) {
  const dark = useResolvedTheme() === "dark";
  const reduced = useReducedMotion();
  const [model] = useState(() => new SwitchModel(FEEL.compact));
  const [view] = useState(() => new SwitchView("compact"));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clock = useRef(0);
  const id = `dl${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // Before anything draws: React's dev remount resets <html> attributes set
  // by the inline script, and the knob starts where the page already is.
  useLayoutEffect(() => {
    syncTheme();
    model.place(shownSide());
  }, [model]);

  const canvasRef = useSwitchCanvas(view, 3, () => {
    view.draw(model, clock.current);
    buttonRef.current?.setAttribute("data-live", "");
  });

  const wake = useFrame(true, (dt, time) => {
    clock.current = time;
    const moving = model.step(dt);
    view.draw(model, time);
    return moving;
  });

  useEffect(() => {
    model.reduced = reduced;
  }, [model, reduced]);

  useEffect(() => {
    model.onCommit = (side) => setTheme(side === 1 ? "dark" : "light");
    return () => {
      model.onCommit = null;
    };
  }, [model]);

  // Follow changes made elsewhere. Read the page itself, not `dark`: during
  // hydration `dark` is still the server's "light".
  useEffect(() => {
    model.sync(shownSide(), true);
    wake();
  }, [dark, model, wake]);

  const input = useLatest({ model, view, wake });
  useEffect(() => {
    const element = buttonRef.current;
    if (!element) return;
    return bindSwitch(element, () => input.current);
  }, [input]);

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      className={cn(
        "group/daylight relative block shrink-0 cursor-pointer touch-pan-y rounded-full outline-none select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        // a bigger target than the pill
        "before:absolute before:-inset-x-1.5 before:-inset-y-2 before:content-['']",
        className,
      )}
      style={{ width: W, height: H }}
    >
      <SwitchStill w={W} h={H} id={id} className="pointer-events-none absolute inset-0 group-data-[live]/daylight:invisible" />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full rounded-full" />
    </button>
  );
}
