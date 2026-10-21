// Wiring a SwitchModel and SwitchView to the DOM: canvas sizing (DPR aware,
// re-sized on layout and zoom changes) and the input on the switch element
// (pointer with capture, hover lean for mice, ← → held keys, Enter / Space).
// Shared by the header toggle and the lab piece.

import { useRef, type RefObject } from "react";
import { useIsoLayoutEffect, useLatest } from "../../hooks";
import type { SwitchModel } from "./model";
import type { SwitchView } from "./render";

/**
 * Sizes the canvas's backing store to its CSS box × DPR (capped) and tells
 * the view. `onResize` runs after each resize (redraw there: resizing clears
 * the canvas). The first size is taken synchronously in a layout effect, so
 * the first frame can be drawn before the browser paints.
 */
export function useSwitchCanvas(
  view: SwitchView,
  maxDpr: number,
  onResize: () => void,
): RefObject<HTMLCanvasElement | null> {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const latest = useLatest(onResize);

  useIsoLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    view.attach(canvas);
    let cssW = canvas.clientWidth;
    let cssH = canvas.clientHeight;
    const apply = () => {
      if (cssW < 1 || cssH < 1) return;
      const dpr = Math.max(1, Math.min(maxDpr, window.devicePixelRatio || 1));
      const pw = Math.max(1, Math.round(cssW * dpr));
      const ph = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      view.resize(cssW, cssH, pw / cssW);
      latest.current();
    };
    apply();
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentBoxSize?.[0];
      cssW = box ? box.inlineSize : entry.contentRect.width;
      cssH = box ? box.blockSize : entry.contentRect.height;
      apply();
    });
    observer.observe(canvas);
    let query: MediaQueryList | null = null;
    const onDpr = () => {
      query?.removeEventListener("change", onDpr);
      query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      query.addEventListener("change", onDpr);
      apply();
    };
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    query.addEventListener("change", onDpr);
    return () => {
      observer.disconnect();
      query?.removeEventListener("change", onDpr);
      view.attach(null);
    };
  }, [view, maxDpr, latest]);

  return ref;
}

export type InputOptions = {
  model: SwitchModel;
  /** The view whose track the pointer drags along (its travel in CSS px). */
  view: SwitchView;
  /** Restart a sleeping frame loop. */
  wake: () => void;
  /** Called from every press or key on the switch (a user gesture: start audio here). */
  onGesture?: () => void;
  /** Listen for keys (only on the focusable switch). Default true. */
  keys?: boolean;
};

/**
 * Binds pointer and keyboard input on `element` to the model. Returns the
 * cleanup. A tap toggles; a drag carries the knob; Enter and Space toggle;
 * ← and → push the knob while held. Clicks that follow a handled pointer or
 * key are ignored, so a click reaching the button (e.g. from assistive tech)
 * toggles exactly once.
 */
export function bindSwitch(element: HTMLElement, options: () => InputOptions): () => void {
  let pointerId: number | null = null;
  let handledAt = -Infinity;

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button > 0) return;
    const { model, view, wake, onGesture } = options();
    pointerId = event.pointerId;
    try {
      element.setPointerCapture(event.pointerId);
    } catch {}
    model.down(event.clientX, view.track.travel, performance.now());
    onGesture?.();
    wake();
  };
  const onPointerMove = (event: PointerEvent) => {
    const { model, wake } = options();
    if (event.pointerId === pointerId) {
      model.move(event.clientX, performance.now());
      wake();
      return;
    }
    if (event.pointerType === "mouse" && !model.hovering) {
      model.hovering = true;
      wake();
    }
  };
  const finish = (event: PointerEvent, cancelled: boolean) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    const { model, wake } = options();
    if (cancelled) model.cancel();
    else model.up(event.clientX, performance.now());
    handledAt = performance.now();
    if (event.pointerType !== "mouse") model.hovering = false;
    wake();
  };
  const onPointerUp = (event: PointerEvent) => finish(event, false);
  const onPointerCancel = (event: PointerEvent) => finish(event, true);
  const onEnter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const { model, wake } = options();
    model.hovering = true;
    wake();
  };
  const onLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const { model, wake } = options();
    model.hovering = false;
    wake();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const { model, wake, onGesture, keys = true } = options();
    if (!keys || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handledAt = performance.now();
      if (event.repeat) return;
      onGesture?.();
      model.flip();
      wake();
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const rtl = getComputedStyle(element).direction === "rtl";
      const right = event.key === "ArrowRight" !== rtl;
      if (!event.repeat) onGesture?.();
      model.keyDown(right ? 1 : -1);
      wake();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const { model, wake } = options();
      model.keyUp();
      handledAt = performance.now();
      wake();
    } else if (event.key === " ") {
      // the button would click on Space's keyup; that toggle already happened
      handledAt = performance.now();
    }
  };
  const onBlur = () => {
    const { model, wake } = options();
    model.keyUp();
    wake();
  };
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    if (performance.now() - handledAt < 600) return;
    const { model, wake, onGesture } = options();
    onGesture?.();
    model.flip();
    wake();
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerUp);
  element.addEventListener("pointercancel", onPointerCancel);
  element.addEventListener("pointerenter", onEnter);
  element.addEventListener("pointerleave", onLeave);
  element.addEventListener("keydown", onKeyDown);
  element.addEventListener("keyup", onKeyUp);
  element.addEventListener("blur", onBlur);
  element.addEventListener("click", onClick);
  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
    element.removeEventListener("pointercancel", onPointerCancel);
    element.removeEventListener("pointerenter", onEnter);
    element.removeEventListener("pointerleave", onLeave);
    element.removeEventListener("keydown", onKeyDown);
    element.removeEventListener("keyup", onKeyUp);
    element.removeEventListener("blur", onBlur);
    element.removeEventListener("click", onClick);
  };
}
