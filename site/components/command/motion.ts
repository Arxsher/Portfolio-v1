// Motion for the Index sheet (DESIGN.md → Motion). The arrival (a 12px
// drop and a .98 → 1 scale over 420ms) and the view cross-fade are CSS in
// command.module.css; what needs script lives here: the quick exit before
// the native <dialog> closes, and the sheet's height easing from one view
// to the next. Reduced motion turns both into plain cuts.

export const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

/** The exit: the sheet lifts 8px and fades, the backdrop clears. */
export const EXIT_MS = 160;
/** The sheet's height between two views. */
export const RESIZE_MS = 300;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Play the exit on the dialog and its sheet; resolves when it is done (at once under reduced motion). */
export function playExit(dialog: HTMLDialogElement, sheet: HTMLElement | null): Promise<void> {
  if (prefersReducedMotion() || !sheet) return Promise.resolve();
  const options: KeyframeAnimationOptions = { duration: EXIT_MS, easing: EASE_OUT, fill: "forwards" };
  const animations = [sheet.animate([{ opacity: 1 }, { opacity: 0, translate: "0 -8px" }], options)];
  try {
    animations.push(dialog.animate([{ opacity: 1 }, { opacity: 0 }], { ...options, pseudoElement: "::backdrop" }));
  } catch {
    // ::backdrop animations are not everywhere; the backdrop then just goes.
  }
  const finished = Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  // A busy or paused timeline (a theme cross-fade in flight, a hidden tab)
  // must not keep the sheet open: give up waiting shortly after the exit.
  const deadline = new Promise<void>((resolve) => window.setTimeout(resolve, EXIT_MS + 140));
  return Promise.race([finished, deadline]).then(() => {
    // The animations hold their end state until the dialog has closed.
    requestAnimationFrame(() => animations.forEach((animation) => animation.cancel()));
  });
}

/** Ease the sheet from the height it had to the height it has now. */
export function playResize(sheet: HTMLElement, from: number) {
  if (prefersReducedMotion()) return;
  const to = sheet.getBoundingClientRect().height;
  if (!from || Math.abs(to - from) < 2) return;
  sheet.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: RESIZE_MS, easing: EASE_OUT });
}
