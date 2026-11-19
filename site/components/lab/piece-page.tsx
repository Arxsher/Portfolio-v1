"use client";

// The interactive parts of a piece page (/lab/<slug>/):
//
//   <PieceStage>    the big rounded stage card the piece runs in, with full
//                   screen (Fullscreen API, or a fixed overlay where the API
//                   is missing, e.g. iPhone Safari) and its exit control
//   <PieceActions>  full screen, Share (native share sheet, else copy the
//                   link with a "Link copied" toast), previous / next; also
//                   ← / → to step through the pieces while focus is outside
//                   the stage and outside text fields
//
// The rest of the page is server-rendered (app/lab/[slug]/page.tsx).
//
// Contract for pieces that adapt to full screen (stable, safe to read):
// the stage element carries `data-lab-stage`; in native full screen it is
// `document.fullscreenElement`, and in the overlay fallback <html> carries
// `data-lab-expanded` (the stage also gets `data-expanded`). Esc leaves the
// overlay; a piece that uses Esc itself should ignore it while either holds.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Check } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useInView, usePageVisible } from "./hooks";
import { ChevronLeft, ChevronRightSmall, Expand, Share, Shrink } from "./lab-icons";
import { LoadPiece } from "./load-piece";

const STAGE_ID = "lab-stage";

/* ---------------------------------------------------------------------- */
/* full screen                                                             */
/* ---------------------------------------------------------------------- */

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
};

/** The overlay fallback for browsers without element full screen. */
let expanded = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function setExpanded(value: boolean) {
  if (expanded === value) return;
  expanded = value;
  document.documentElement.toggleAttribute("data-lab-expanded", value);
  notify();
}

function stageElement(): FullscreenElement | null {
  return document.getElementById(STAGE_ID) as FullscreenElement | null;
}

function nativeFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function isStageFullscreen(): boolean {
  const stage = stageElement();
  return expanded || Boolean(stage && nativeFullscreenElement() === stage);
}

function subscribeFullscreen(listener: () => void) {
  listeners.add(listener);
  document.addEventListener("fullscreenchange", listener);
  document.addEventListener("webkitfullscreenchange", listener);
  return () => {
    listeners.delete(listener);
    document.removeEventListener("fullscreenchange", listener);
    document.removeEventListener("webkitfullscreenchange", listener);
  };
}

function useStageFullscreen(): boolean {
  return useSyncExternalStore(subscribeFullscreen, isStageFullscreen, () => false);
}

async function enterFullscreen() {
  const stage = stageElement();
  if (!stage) return;
  const request = stage.requestFullscreen ?? stage.webkitRequestFullscreen;
  if (request && (document.fullscreenEnabled ?? true)) {
    try {
      await request.call(stage, { navigationUI: "hide" });
      return;
    } catch {
      // Refused (iframe, permissions …): fall back to the overlay.
    }
  }
  setExpanded(true);
}

function exitFullscreen() {
  const doc = document as FullscreenDocument;
  if (nativeFullscreenElement()) {
    const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
    void Promise.resolve(exit?.call(doc)).catch(() => {});
  }
  setExpanded(false);
}

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

const stageCss = `
html[data-lab-expanded] { overflow: hidden; }
.lab-stage:fullscreen { border-radius: 0; }
.lab-stage[data-expanded] {
  position: fixed;
  inset: 0;
  z-index: 60;
  width: 100%;
  height: 100%;
  min-height: 0;
  aspect-ratio: auto;
  border-radius: 0;
}
`;

export function PieceStage({
  slug,
  title,
  aspect = 4 / 5,
  minHeight = 360,
}: {
  slug: string;
  title: string;
  /** Phone aspect (width / height); from md up the stage is 575px tall. */
  aspect?: number;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref);
  const visible = usePageVisible();
  const fullscreen = useStageFullscreen();
  const exitRef = useRef<HTMLButtonElement>(null);

  // Esc closes the overlay fallback (native full screen handles its own).
  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && expanded) {
        event.preventDefault();
        exitFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  // Leaving the page never leaves the overlay behind.
  useEffect(() => () => setExpanded(false), []);

  return (
    <div
      ref={ref}
      id={STAGE_ID}
      data-lab-stage=""
      data-expanded={expanded && fullscreen ? "" : undefined}
      role="region"
      aria-label={`${title}, interactive piece`}
      className="lab-stage relative isolate w-full overflow-hidden rounded-[24px] bg-tile aspect-(--stage-aspect) min-h-(--stage-min) md:aspect-auto md:h-[575px] md:min-h-0"
      style={{ "--stage-aspect": aspect, "--stage-min": `${minHeight}px` } as CSSProperties}
    >
      <style href="lab-stage" precedence="default">
        {stageCss}
      </style>
      <LoadPiece slug={slug} mode="stage" active={(onScreen || fullscreen) && visible} />
      {fullscreen ? (
        <button
          ref={exitRef}
          type="button"
          onClick={exitFullscreen}
          aria-label="Exit full screen"
          title="Exit full screen"
          className="absolute end-3 top-3 z-30 flex size-9 cursor-pointer items-center justify-center rounded-[12px] bg-float text-secondary shadow-float outline-none transition-[color,scale] duration-150 ease-out hover:text-primary active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:end-4 sm:top-4"
        >
          <Shrink size={15} />
        </button>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* actions                                                                 */
/* ---------------------------------------------------------------------- */

const actionClass =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-well text-[13px] font-medium text-primary outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-well-hover active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const stepClass =
  "flex h-9 w-[34px] items-center justify-center text-secondary outline-none transition-[color,background-color] duration-150 ease-out hover:bg-well-hover hover:text-primary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

type Neighbour = { slug: string; title: string };

export function PieceActions({
  title,
  summary,
  previous,
  next,
}: {
  title: string;
  summary: string;
  previous: Neighbour;
  next: Neighbour;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // ← / → step through the lab, unless focus is in the stage (the piece
  // may use the arrows), in a field, or in an open dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (isTypingTarget(event.target) || isStageFullscreen()) return;
      const active = document.activeElement;
      if (active?.closest("[data-lab-stage], [role='dialog'], [role='slider'], [role='radiogroup'], [role='tablist']")) return;
      if (document.querySelector("[role='dialog'][data-open]")) return;
      event.preventDefault();
      router.push(`/lab/${event.key === "ArrowLeft" ? previous.slug : next.slug}/`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, previous.slug, next.slug]);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: summary, url });
        return;
      } catch (error) {
        // Closing the share sheet is not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: a hidden field and execCommand.
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => void enterFullscreen()}
        aria-label="Full screen"
        title="Full screen"
        className={cn(actionClass, "w-[34px]")}
      >
        <Expand size={14} />
      </button>
      <span className="relative">
        <button type="button" onClick={() => void share()} className={cn(actionClass, "w-[34px] sm:w-auto sm:ps-3 sm:pe-3.5")}>
          <Share size={14} />
          <span className="sr-only sm:not-sr-only">Share</span>
        </button>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute end-0 top-full z-20 mt-2 flex h-7 items-center gap-1.5 rounded-[9px] bg-ink px-2.5 text-[12px] font-medium whitespace-nowrap text-on-ink shadow-float transition-[opacity,translate,filter] duration-200 ease-out",
            copied ? "translate-y-0 opacity-100 blur-none" : "-translate-y-1 opacity-0 blur-[2px]",
          )}
        >
          <Check size={12} />
          Link copied
        </span>
        <span className="sr-only" aria-live="polite">
          {copied ? "Link copied" : ""}
        </span>
      </span>
      <span className="flex rounded-[12px] bg-well">
        <Link
          href={`/lab/${previous.slug}/`}
          aria-label={`Previous: ${previous.title}`}
          title={`Previous: ${previous.title}`}
          aria-keyshortcuts="ArrowLeft"
          className={cn(stepClass, "rounded-s-[12px]")}
        >
          <ChevronLeft size={14} />
        </Link>
        <Link
          href={`/lab/${next.slug}/`}
          aria-label={`Next: ${next.title}`}
          title={`Next: ${next.title}`}
          aria-keyshortcuts="ArrowRight"
          className={cn(stepClass, "rounded-e-[12px]")}
        >
          <ChevronRightSmall size={14} />
        </Link>
      </span>
    </div>
  );
}
