"use client";

// Image lightbox on a native <dialog>, plus the small gallery wrapper that
// opens it.
//
//   <LightboxGallery items={items}>
//     …thumbnails rendered on the server, each an <a href={full image}
//        data-lightbox-index={i}>, optionally with <img data-still> inside…
//   </LightboxGallery>
//
// The gallery listens for clicks on its children (one delegated handler),
// so the thumbnails themselves stay server components and work as plain
// links to the image without JavaScript. It also fades thumbnails in once
// their image has loaded (`data-still` images) and shows a loading sheen on
// the tile meanwhile.
//
// The dialog: Esc or a click outside the panel closes it, ← / → step
// through the items, focus goes back to the thumbnail that opened it, and
// the page behind stops scrolling while it is open.

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronRight, Close } from "@/components/icons";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";

export type LightboxItem = {
  src: string;
  width: number;
  height: number;
  title: string;
  caption?: string;
  /** Defaults to "title: caption". */
  alt?: string;
};

/* ---------------------------------------------------------------------- */
/* styles                                                                  */
/* ---------------------------------------------------------------------- */

// Open/close is a CSS transition (display/overlay are animated discretely
// so the panel can fade out while the dialog is still in the top layer).
// Kept here rather than in globals.css because only this file uses it.
const css = `
.lightbox {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 16px;
  border: 0;
  background: transparent;
  color: inherit;
  overflow: hidden;
  outline: none;
  /* the image is sized against this box (cqw / cqh) */
  container-type: size;
  transition: display 240ms allow-discrete, overlay 240ms allow-discrete;
}
@media (min-width: 640px) {
  .lightbox { padding: 32px; }
}
.lightbox[open] {
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox::backdrop {
  background-color: transparent;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
  transition:
    background-color 240ms var(--ease-out),
    backdrop-filter 240ms var(--ease-out),
    -webkit-backdrop-filter 240ms var(--ease-out),
    display 240ms allow-discrete,
    overlay 240ms allow-discrete;
}
.lightbox[open]::backdrop {
  background-color: color-mix(in oklab, var(--background) 76%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.lightbox-panel {
  transition:
    opacity 240ms var(--ease-out),
    scale 240ms var(--ease-out),
    filter 240ms var(--ease-out),
    translate 240ms var(--ease-out);
}
.lightbox:not([open]) .lightbox-panel {
  opacity: 0;
  scale: 0.97;
  filter: blur(4px);
  translate: 0 6px;
}
@starting-style {
  .lightbox[open]::backdrop {
    background-color: transparent;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  .lightbox[open] .lightbox-panel {
    opacity: 0;
    scale: 0.97;
    filter: blur(4px);
    translate: 0 6px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .lightbox-panel { transition: opacity 150ms ease-out; }
  .lightbox:not([open]) .lightbox-panel { scale: 1; filter: none; translate: none; }
  @starting-style {
    .lightbox[open] .lightbox-panel { scale: 1; filter: none; translate: none; }
  }
}
html:has(.lightbox[open]) {
  overflow: hidden;
  scrollbar-gutter: stable;
}

/* thumbnails: hidden until loaded (only once JS is running, so nothing
   stays invisible without it), then they settle in */
[data-gallery-ready] img[data-still]:not([data-loaded]) {
  opacity: 0;
}
img[data-still][data-loaded="fade"] {
  animation: var(--animate-still-in);
}
[data-gallery-ready] [data-lightbox-index]:has(img[data-still]:not([data-loaded])) {
  background-image: linear-gradient(
    100deg,
    transparent 35%,
    color-mix(in oklab, var(--foreground) 4.5%, transparent) 50%,
    transparent 65%
  );
  background-repeat: no-repeat;
  background-size: 100vw 100%;
  background-attachment: fixed;
  animation: var(--animate-sheen);
}
@media (prefers-reduced-motion: reduce) {
  [data-gallery-ready] [data-lightbox-index]:has(img[data-still]:not([data-loaded])) {
    background-image: none;
    animation: none;
  }
}
`;

function LightboxStyles() {
  return (
    <style href="lightbox" precedence="default">
      {css}
    </style>
  );
}

/* ---------------------------------------------------------------------- */
/* gallery                                                                 */
/* ---------------------------------------------------------------------- */

export function LightboxGallery({
  items,
  className,
  children,
}: {
  items: ReadonlyArray<LightboxItem>;
  className?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  // Reveal each thumbnail when its image arrives. Images that finished
  // before hydration show at once; the rest fade in as they load.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLImageElement>("img[data-still]").forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        img.dataset.loaded = "instant";
        return;
      }
      const done = () => {
        img.dataset.loaded = "fade";
      };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      cleanups.push(() => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      });
    });
    setReady(true);
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    // Let modified clicks (new tab, download …) through to the link.
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const trigger = (event.target as Element).closest<HTMLElement>("[data-lightbox-index]");
    if (!trigger || !event.currentTarget.contains(trigger)) return;
    const next = Number(trigger.dataset.lightboxIndex);
    if (!Number.isInteger(next) || !items[next]) return;
    event.preventDefault();
    setIndex(next);
  };

  return (
    <div
      ref={rootRef}
      className={className}
      onClick={onClick}
      data-gallery-ready={ready ? "" : undefined}
    >
      <LightboxStyles />
      {children}
      <Lightbox items={items} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* dialog                                                                  */
/* ---------------------------------------------------------------------- */

const iconButton =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-secondary outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-control hover:text-primary focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.94]";

export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: ReadonlyArray<LightboxItem>;
  /** The open item, or null when closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const returnFocus = useRef<HTMLElement | null>(null);
  // Keep showing the last item while the panel fades out after closing.
  const [shown, setShown] = useState(index ?? 0);
  if (index !== null && index !== shown) setShown(index);
  // The large image is only put in the page once the lightbox has been
  // opened, so a closed lightbox never downloads anything.
  const [used, setUsed] = useState(index !== null);
  if (index !== null && !used) setUsed(true);

  const open = index !== null;
  const item = items[shown];
  const count = items.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const active = document.activeElement;
      returnFocus.current = active instanceof HTMLElement ? active : null;
      dialog.showModal();
      // Focus the dialog itself (it is labelled by the title) rather than
      // its first button, so no focus ring flashes on mouse open.
      dialog.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc (and any other close) ends up here.
  const handleClose = () => {
    onClose();
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  };

  const step = (delta: number) => {
    if (count < 2) return;
    onIndexChange((shown + delta + count) % count);
  };

  // Keys pressed inside the dialog stay inside it: ← / → step through the
  // items, and nothing reaches the page's global shortcuts ("/" for the
  // command bar …) while the lightbox is up. A native listener, because
  // React's own handlers only run once the event has bubbled to the root.
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      event.stopPropagation();
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        stepRef.current(event.key === "ArrowRight" ? 1 : -1);
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    return () => dialog.removeEventListener("keydown", onKeyDown);
  }, []);

  // A click that lands on the dialog box itself (not the panel) is a click
  // on the empty area around the panel.
  const onDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) dialogRef.current?.close();
  };

  if (!item) return null;

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      tabIndex={-1}
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={onDialogClick}
    >
      <div className="lightbox-panel flex max-h-full max-w-full flex-col overflow-hidden rounded-[20px] bg-raised p-1.5 shadow-popover">
        <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-[14px] bg-surface">
          {used ? (
            <img
              key={item.src}
              src={item.src}
              width={item.width}
              height={item.height}
              alt={item.alt ?? (item.caption ? `${item.title}: ${item.caption}` : item.title)}
              className="block h-auto max-h-[calc(100cqh-64px)] w-auto max-w-[min(960px,calc(100cqw-12px))] animate-fade-in"
            />
          ) : null}
        </div>
        <div className="flex w-0 min-w-full items-center gap-1 ps-2.5 pt-1.5">
          <div className="min-w-0 flex-1 py-1 leading-[1.3]" aria-live="polite">
            <p id={titleId} className="truncate text-[14px] text-primary">
              {item.title}
            </p>
            {item.caption ? <p className="line-clamp-2 text-[12.5px] text-tertiary">{item.caption}</p> : null}
          </div>
          {count > 1 ? (
            <>
              <span className="me-1 hidden shrink-0 text-[12px] text-tertiary tabular-nums sm:inline">
                {pad(shown + 1)}
                <span aria-hidden="true" className="mx-1 opacity-60">
                  /
                </span>
                <span className="sr-only">of</span>
                {pad(count)}
              </span>
              <button type="button" className={iconButton} onClick={() => step(-1)} aria-label="Previous image">
                <ChevronRight size={14} className="rotate-180" />
              </button>
              <button type="button" className={iconButton} onClick={() => step(1)} aria-label="Next image">
                <ChevronRight size={14} />
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={cn(iconButton, "ms-0.5")}
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            <Close size={14} />
          </button>
        </div>
      </div>
    </dialog>
  );
}
