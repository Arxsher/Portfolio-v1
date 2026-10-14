"use client";

// The interactive parts of a piece page (/lab/<slug>/):
//
//   <PieceStage>    the paper stage the piece runs in: full width, a gently
//                   domed top edge with a hairline moulding around it and a
//                   terracotta keystone at the crown (575px tall from md,
//                   the piece's own aspect on phones). Full screen through
//                   the Fullscreen API, or a fixed overlay where the API is
//                   missing (e.g. iPhone Safari), with its exit control.
//   <PieceActions>  "Full screen" and "Copy link" pills; also ← / → to step
//                   through the pieces while focus is outside the stage,
//                   outside text fields and outside dialogs.
//
// The rest of the page is server-rendered (app/lab/[slug]/page.tsx).
// Controls floating on the stage read --lab-dome to keep clear of the dome
// (components/lab/ui.tsx).

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Check } from "@/components/icons";
import { Star } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { isTypingTarget } from "@/lib/shortcuts";
import { useInView, usePageVisible } from "./hooks";
import { Expand, LinkIcon, Shrink } from "./lab-icons";
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
.lab-stage {
  --lab-dome: 30px;
  border-radius: 50% 50% 10px 10px / var(--lab-dome) var(--lab-dome) 10px 10px;
  background-color: var(--paper);
  box-shadow: 0 0 0 1px var(--line), 0 1px 0 rgb(var(--shadow-rgb) / var(--shadow-a1)),
    0 22px 48px -26px rgb(var(--shadow-rgb) / var(--shadow-a2));
  outline: 1px solid var(--line);
  outline-offset: 6px;
}
@media (min-width: 768px) {
  .lab-stage { --lab-dome: 64px; }
}
.lab-stage:fullscreen,
.lab-stage[data-expanded] {
  --lab-dome: 0px;
  border-radius: 0;
  outline: none;
  box-shadow: none;
}
.lab-stage[data-expanded] {
  position: fixed;
  inset: 0;
  z-index: 60;
  width: 100%;
  height: 100%;
  min-height: 0;
  aspect-ratio: auto;
}
.lab-stage__key {
  position: absolute;
  top: -6px;
  left: 50%;
  translate: -50% -50%;
  box-sizing: content-box;
  padding: 3px 5px;
  border-radius: 50%;
  color: var(--terra-fill);
  background-color: var(--background);
  pointer-events: none;
}
`;

export function PieceStage({
  slug,
  title,
  aspect = 4 / 5,
  minHeight = 360,
  poster,
}: {
  slug: string;
  title: string;
  /** Phone aspect (width / height); from md up the stage is 575px tall. */
  aspect?: number;
  minHeight?: number;
  /** Shown while the piece loads, and instead of a piece that is still being built. */
  poster?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref);
  const visible = usePageVisible();
  const fullscreen = useStageFullscreen();

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
    <div className="relative">
      <style href="lab-stage" precedence="default">
        {stageCss}
      </style>
      <div
        ref={ref}
        id={STAGE_ID}
        data-lab-stage=""
        data-expanded={expanded && fullscreen ? "" : undefined}
        role="region"
        aria-label={`${title}, interactive piece`}
        className="lab-stage relative isolate w-full overflow-hidden aspect-(--stage-aspect) min-h-(--stage-min) md:aspect-auto md:h-[575px] md:min-h-0"
        style={{ "--stage-aspect": aspect, "--stage-min": `${minHeight}px` } as CSSProperties}
      >
        <LoadPiece slug={slug} mode="stage" active={(onScreen || fullscreen) && visible} poster={poster} />
        {fullscreen ? (
          <button
            type="button"
            onClick={exitFullscreen}
            aria-label="Exit full screen"
            title="Exit full screen"
            className="btn btn-soft btn-icon absolute end-3 top-3 z-30 bg-paper shadow-[0_0_0_1px_var(--line),0_10px_24px_-14px_rgb(var(--shadow-rgb)/var(--shadow-a2))] sm:end-4 sm:top-4"
          >
            <Shrink size={15} />
          </button>
        ) : null}
      </div>
      {/* the keystone at the crown of the dome (still: only niche keystones turn) */}
      <Star size={14} variant="inlaid" className="lab-stage__key" />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* actions                                                                 */
/* ---------------------------------------------------------------------- */

type Neighbour = { slug: string; title: string };

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Older browsers: a hidden field and execCommand.
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function PieceActions({
  title,
  previous,
  next,
  className,
}: {
  title: string;
  /** Kept for older callers (it was the share sheet's text). */
  summary?: string;
  previous: Neighbour;
  next: Neighbour;
  className?: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // ← / → step through the lab, unless focus is in the stage (the piece
  // may use the arrows), in a field, on a control that uses arrows, or in
  // an open dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (isTypingTarget(event.target) || isStageFullscreen()) return;
      const active = document.activeElement;
      if (
        active?.closest(
          "[data-lab-stage], [role='dialog'], dialog, [role='slider'], [role='radiogroup'], [role='tablist'], [data-shortcuts='off']",
        )
      )
        return;
      if (document.querySelector("[role='dialog'][data-open], dialog[open]")) return;
      event.preventDefault();
      router.push(`/lab/${event.key === "ArrowLeft" ? previous.slug : next.slug}/`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, previous.slug, next.slug]);

  const copy = async () => {
    await copyText(window.location.href.split("#")[0]);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button type="button" onClick={() => void enterFullscreen()} className="btn btn-soft btn-sm">
        <Expand size={13} />
        Full screen
        <span className="sr-only">: {title}</span>
      </button>
      <button type="button" onClick={() => void copy()} className="btn btn-soft btn-sm">
        <span className="icon-swap" data-keep-transition="">
          <span data-hidden={copied ? "true" : undefined} className="flex">
            <LinkIcon size={13} />
          </span>
          <span data-hidden={copied ? undefined : "true"} className="flex text-green">
            <Check size={13} />
          </span>
        </span>
        {copied ? "Copied" : "Copy link"}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link to this piece copied" : ""}
      </span>
    </div>
  );
}
