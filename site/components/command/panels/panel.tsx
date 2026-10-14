"use client";

// Shared chrome for the Index sheet and its panels (DESIGN.md → Command
// palette and panels).
//
//                     ✦                         the inlaid star, centred under the dome
//   [←]          Get in touch          [×]      back, the title in serif italic, close
//            one quiet line about it
//   ───────────────────────────────────────
//   body …                                      scrolls inside the sheet
//
// The Index shows the same head without the back arrow (its close button
// appears on touch screens and phones, where there is no Esc key). Every
// title carries data-sheet-title so the sheet can hand focus to it.

import type { ReactNode } from "react";
import { Close } from "@/components/icons";
import { Arrow, Star } from "@/components/ornament";
import { cn } from "@/lib/cn";

export function SheetHead({
  titleId,
  title,
  description,
  onBack,
  onClose,
  closeOnTouchOnly = false,
  size = "panel",
}: {
  titleId: string;
  title: ReactNode;
  description?: ReactNode;
  /** Back to the Index (panels only). */
  onBack?: () => void;
  onClose: () => void;
  /** The Index: the close button only where there is no Esc key. */
  closeOnTouchOnly?: boolean;
  size?: "index" | "panel";
}) {
  return (
    <div className="shrink-0 px-4 pt-[22px] text-center sm:px-5 sm:pt-6">
      <Star size={size === "index" ? 18 : 15} variant="inlaid" className="mx-auto text-terra-fill" />
      <div className="mt-1 grid min-h-11 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
        <span className="flex justify-start">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="Back to the index" className="btn btn-icon">
              <Arrow className="rotate-180" />
            </button>
          ) : null}
        </span>
        <h2
          id={titleId}
          tabIndex={-1}
          data-sheet-title=""
          className={cn(
            "serif-italic truncate leading-[1.2] text-primary outline-none",
            size === "index" ? "text-[22px]" : "text-[20px]",
          )}
        >
          {title}
        </h2>
        <span className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "btn btn-icon max-sm:w-auto max-sm:px-3.5",
              closeOnTouchOnly && "hidden max-sm:inline-flex pointer-coarse:inline-flex",
            )}
          >
            <Close size={15} className="max-sm:hidden" />
            <span aria-hidden="true" className="text-[13.5px] sm:hidden">
              Close
            </span>
          </button>
        </span>
      </div>
      {description ? (
        <p className="mx-auto mt-0.5 max-w-[46ch] text-small text-pretty text-muted">{description}</p>
      ) : null}
    </div>
  );
}

export function Panel({
  titleId,
  title,
  description,
  onBack,
  onClose,
  children,
  bodyClassName,
}: {
  titleId: string;
  title: ReactNode;
  description?: ReactNode;
  onBack: () => void;
  onClose: () => void;
  children?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section aria-labelledby={titleId} className="flex min-h-0 flex-1 flex-col">
      <SheetHead titleId={titleId} title={title} description={description} onBack={onBack} onClose={onClose} />
      <div
        data-sheet-body=""
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6 sm:px-6", bodyClassName)}
      >
        {children}
      </div>
    </section>
  );
}

/** Props every panel gets from the sheet. */
export type PanelProps = {
  titleId: string;
  onBack: () => void;
  /** Close and put focus back where it was. */
  onClose: () => void;
};

/** A row in a panel's list: the sand band rises on hover and focus (DESIGN.md → Rows). */
export const panelRowClass = "group row-rise flex items-baseline gap-4 px-2 py-3 text-primary focus-ring";

/** The serif name in a panel row; turns italic cobalt with its row. */
export const panelNameClass =
  "min-w-0 truncate font-display text-[19px] leading-[1.25] tracking-[-0.01em] group-hover:turn group-focus-visible:turn";
