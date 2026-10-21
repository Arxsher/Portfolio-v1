"use client";

// The sky band: visitors' paper planes drifting by (planes/sky.ts draws
// them on one canvas). Everything people use lives in the DOM around it:
//
//   • pointer: hover a plane and it slows, wiggles and shows whose it is;
//     click or tap it to catch it (it glides to the middle and unfolds into
//     the note); click anywhere, press Esc (wherever focus is) or × to let
//     it fold up and fly back. Touch scrolls the page as usual; only a tap
//     catches.
//   • keyboard and screen readers: a visually hidden list with one button
//     per plane in the sky; focusing one rings the plane on the canvas and
//     shows its name tag, Enter catches it. The open note is a non-modal
//     dialog holding the note as text, with the × button.
//   • "Fold a plane" opens the send flow in the command bar. With no
//     planes yet, one dashed outline waits in the middle instead. If the
//     planes couldn't load, the band says so and offers "Try again".

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { GuestbookEntry } from "@/lib/guestbook";
import { Close } from "@/components/icons";
import { cn } from "@/lib/cn";
import { openCommand } from "@/lib/command";
import { planeLook, readPageTokens } from "./planes/look";
import { PlaneSky, formatPlaneDate, skyCapacity, type SkyKind } from "./planes/sky";
import type { Rect } from "./planes/note";

/* ---------------------------------------------------------------------- */
/* shared bits                                                             */
/* ---------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(listener: () => void) {
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

/** prefers-reduced-motion, live. False on the server. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

function subscribePalette(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-palette"] });
  return () => observer.disconnect();
}

function readPalette(): string {
  const root = document.documentElement;
  return root.getAttribute("data-palette") ?? (root.classList.contains("dark") ? "dark" : "light");
}

/** The palette on screen ("light", "red-dragon", "amoled" …), live. */
export function usePaletteName(): string {
  return useSyncExternalStore(subscribePalette, readPalette, () => "light");
}

/** A small folded-plane glyph for buttons (16 grid, currentColor). */
export function PlaneGlyph({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M14.2 2.1 1.9 7.2c-.4.2-.4.8.1.9l3.6 1.1 1.2 4c.1.4.7.5.9.1l1.9-2.7 3.1 2c.3.2.8 0 .8-.4L15 2.8c.1-.5-.4-.9-.8-.7Z" fill="currentColor" fillOpacity="0.16" />
      <path
        d="M14.2 2.1 1.9 7.2c-.4.2-.4.8.1.9l3.6 1.1 1.2 4c.1.4.7.5.9.1l1.9-2.7 3.1 2c.3.2.8 0 .8-.4L15 2.8c.1-.5-.4-.9-.8-.7ZM5.6 9.2l8.6-7.1M9.5 10.6 6.8 13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const foldButtonClass =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[11px] bg-ink ps-2.5 pe-3 text-[13px] font-medium text-on-ink shadow-lift transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] focus-ring";

/* ---------------------------------------------------------------------- */
/* the band                                                                */
/* ---------------------------------------------------------------------- */

type Status = "disabled" | "loading" | "ready" | "error";

export function PlaneSkyBand({
  kind,
  entries,
  status,
  onRetry,
  className,
}: {
  kind: SkyKind;
  /** Newest first. */
  entries: GuestbookEntry[];
  status: Status;
  /** Load again after an error. */
  onRetry?: () => void;
  className?: string;
}) {
  const bandRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PlaneSky | null>(null);
  const palette = usePaletteName();
  const reduced = useReducedMotion();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // A released note is still refolding on its way home: keep the band's
  // own controls out of its way until it is back in its lane.
  const [settling, setSettling] = useState(false);
  const [noteRect, setNoteRect] = useState<Rect | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Nothing to show: an honest empty sky (one dashed outline) only when the
  // list really is empty; a failed load gets its own message and a retry.
  const failed = status === "error" && entries.length === 0;
  const empty = (status === "ready" || status === "disabled") && entries.length === 0;
  const capacity = size ? skyCapacity(kind, size.width, size.height) : 0;
  const flying = useMemo(() => entries.slice(0, capacity), [entries, capacity]);
  const byId = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const openEntry = openId ? byId.get(openId) ?? null : null;

  // engine lifetime
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new PlaneSky(canvas, kind, {
      onOpen: (id) => {
        setOpenId(id);
        setNoteRect(id ? engine.noteRect() : null);
        if (!id) setSettling(true);
      },
      onSettle: () => setSettling(false),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [kind]);

  // size
  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const measure = () => {
      const rect = band.getBoundingClientRect();
      const next = { width: Math.round(rect.width), height: Math.round(rect.height) };
      setSize((current) => (current && current.width === next.width && current.height === next.height ? current : next));
      engineRef.current?.setSize(next.width, next.height);
      if (engineRef.current?.openNote) setNoteRect(engineRef.current.noteRect());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(band);
    return () => observer.disconnect();
  }, [kind]);

  // only animate while on screen
  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const observer = new IntersectionObserver(
      ([entry]) => engineRef.current?.setVisible(entry.isIntersecting),
      { rootMargin: "80px 0px" },
    );
    observer.observe(band);
    return () => observer.disconnect();
  }, [kind]);

  useEffect(() => engineRef.current?.setLook(planeLook(palette, readPageTokens())), [palette, kind]);
  useEffect(() => engineRef.current?.setReducedMotion(reduced), [reduced, kind]);
  useEffect(() => {
    if (!size) return;
    engineRef.current?.setEntries(entries);
  }, [entries, size, kind]);
  useEffect(() => engineRef.current?.setGhost(empty), [empty, kind]);

  /* pointer ------------------------------------------------------------ */

  const press = useRef<{ x: number; y: number; time: number; type: string } | null>(null);

  const local = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine || event.pointerType === "touch") return;
    const { x, y } = local(event);
    if (engine.openNote) {
      engine.setHover(null);
      event.currentTarget.style.cursor = "pointer";
      return;
    }
    const id = engine.planeAt(x, y);
    engine.setHover(id);
    event.currentTarget.style.cursor = id ? "pointer" : "";
  };

  const onPointerLeave = () => {
    engineRef.current?.setHover(null);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const { x, y } = local(event);
    press.current = { x, y, time: performance.now(), type: event.pointerType };
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const start = press.current;
    press.current = null;
    const engine = engineRef.current;
    if (!start || !engine) return;
    const { x, y } = local(event);
    if (Math.hypot(x - start.x, y - start.y) > 10 || performance.now() - start.time > 700) return;
    const slack = start.type === "touch" ? 16 : 8;
    if (engine.openNote) {
      const other = engine.isOverNote(x, y) ? null : engine.planeAt(x, y, slack);
      if (other) {
        opener.current = null;
        engine.open(other);
      } else closeNote(false);
      return;
    }
    const id = engine.planeAt(x, y, slack);
    if (id) {
      opener.current = null;
      engine.open(id);
    }
  };

  /* keyboard ----------------------------------------------------------- */

  const closeNote = useCallback((restoreFocus: boolean) => {
    const engine = engineRef.current;
    if (!engine?.openNote) return;
    const id = engine.openNote;
    engine.close();
    if (restoreFocus) {
      const target =
        opener.current ?? bandRef.current?.querySelector<HTMLButtonElement>(`[data-plane="${CSS.escape(id)}"]`) ?? null;
      target?.focus({ preventScroll: true });
    }
    opener.current = null;
  }, []);

  // Esc lets the note go from anywhere on the page, however it was caught
  // (a click or tap leaves focus on the page, not in the band). Keys meant
  // for something else are left alone: an Esc already handled, or one
  // pressed inside another dialog (the command bar, a lab piece …).
  useEffect(() => {
    if (!openId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
      const target = event.target instanceof Element ? event.target : null;
      const band = bandRef.current;
      const otherDialog = target?.closest('[role="dialog"], [role="alertdialog"], dialog');
      if (otherDialog && !(band && band.contains(otherDialog))) return;
      if (!engineRef.current?.openNote) return;
      event.preventDefault();
      closeNote(opener.current != null || Boolean(band && target && band.contains(target)));
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openId, closeNote]);

  // The note takes focus when it opens from the keyboard, so its text is
  // read out and Tab reaches the close button.
  useEffect(() => {
    if (!openId || !opener.current) return;
    dialogRef.current?.focus({ preventScroll: true });
  }, [openId]);

  const hint = kind === "page" ? "Catch a plane to read its note" : "Catch a plane to read it";

  return (
    <div
      ref={bandRef}
      className={cn(
        "relative isolate overflow-hidden rounded-panel",
        "bg-[linear-gradient(180deg,color-mix(in_oklab,#dbe5ef_42%,var(--tile))_0%,var(--tile)_78%)]",
        "dark:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--foreground)_7%,var(--tile))_0%,var(--tile)_82%)]",
        kind === "page" ? "h-[340px] sm:h-[440px]" : "h-[288px] sm:h-[320px]",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          press.current = null;
        }}
        className="absolute inset-0 size-full touch-pan-y select-none"
      />

      {/* planes for keyboards and screen readers */}
      {flying.length ? (
        <ul id={listId} aria-label="Paper planes in the sky" className="sr-only">
          {flying.map((entry) => {
            const date = formatPlaneDate(entry.created_at);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  data-plane={entry.id}
                  onFocus={() => engineRef.current?.setFocus(entry.id)}
                  onBlur={() => engineRef.current?.setFocus(null)}
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    engineRef.current?.open(entry.id);
                  }}
                >
                  {`Paper plane from ${entry.name}${date ? `, ${date}` : ""}. Catch it to read the note.`}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* the open note */}
      {openEntry && noteRect ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="false"
          aria-label={`Note from ${openEntry.name}`}
          tabIndex={-1}
          className="pointer-events-none absolute outline-none"
          style={{ left: noteRect.x, top: noteRect.y, width: noteRect.w, height: noteRect.h }}
        >
          <div className="sr-only">
            <p>{openEntry.message}</p>
            <p>
              From {openEntry.name}
              {formatPlaneDate(openEntry.created_at) ? `, ${formatPlaneDate(openEntry.created_at)}` : ""}
            </p>
          </div>
          {/* 28px to look at, 44px to hit (the ::after). On a narrow band
              the note nearly fills it, so the button sits inside the
              note's corner instead of hanging off the band's edge. */}
          <button
            type="button"
            aria-label="Fold it back up"
            onClick={() => closeNote(true)}
            className={cn(
              "pointer-events-auto absolute flex size-7 animate-pop-in cursor-pointer items-center justify-center rounded-full bg-float text-secondary shadow-float transition-colors duration-150 [animation-delay:700ms] after:absolute after:-inset-2 after:rounded-full hover:text-primary focus-ring motion-reduce:[animation-delay:0ms]",
              size && size.width < 520 ? "end-1.5 top-1.5" : "-end-2.5 -top-2.5",
            )}
          >
            <Close size={13} />
          </button>
        </div>
      ) : null}

      {/* the planes didn't load */}
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
          <p className="text-[14px] text-primary">The planes didn&apos;t load</p>
          <p className="text-[13px] text-pretty text-tertiary">The sky is out of reach right now. It may just need another try.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-8 cursor-pointer items-center rounded-[11px] bg-float px-3 text-[13px] text-primary shadow-float transition-[opacity,scale] duration-150 ease-out hover:opacity-80 active:scale-[0.96] focus-ring"
              >
                Try again
              </button>
            ) : null}
            {kind === "home" ? (
              <button type="button" onClick={() => openCommand("guestbook")} className={foldButtonClass}>
                <PlaneGlyph size={15} />
                Fold a plane
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* empty sky */}
      {empty ? (
        <button
          type="button"
          onClick={() => openCommand("guestbook")}
          className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-end pb-[17%] outline-none sm:pb-[15%]"
        >
          <span className="rounded-[10px] px-2 py-1 text-[14px] text-primary transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary">
            Be the first to send one
          </span>
          <span className="px-4 text-center text-[13px] text-tertiary">Fold a note into a paper plane and throw it here.</span>
        </button>
      ) : null}

      {/* fold one (the page has its own button just above) */}
      {!empty && !failed ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 transition-opacity duration-200 ease-out",
            (openId || settling) && "opacity-0",
          )}
        >
          {kind === "home" ? (
            <button
              type="button"
              inert={Boolean(openId || settling)}
              onClick={() => openCommand("guestbook")}
              className={cn(foldButtonClass, "pointer-events-auto")}
            >
              <PlaneGlyph size={15} />
              Fold a plane
            </button>
          ) : (
            <span />
          )}
          <span aria-hidden="true" className="pb-1.5 pe-1 text-[12px] text-tertiary max-[380px]:hidden">
            {status === "loading" ? "" : hint}
          </span>
        </div>
      ) : null}

      {status === "loading" ? (
        <span className="sr-only" role="status">
          Loading paper planes
        </span>
      ) : null}
    </div>
  );
}
