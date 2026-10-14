"use client";

// STUB from the Foundation step: the command-bar task replaces this file.
// Keeps the dock's footprint (300×48, 24px off the bottom on desktop) so
// screenshots of other areas look right meanwhile.

import { Logo } from "@/components/logo";
import { openCommand } from "@/lib/command";

export function CommandBar() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-4 sm:pb-6"
      style={{ viewTransitionName: "site-dock" }}
    >
      <button
        type="button"
        onClick={() => openCommand("palette")}
        className="pointer-events-auto flex h-12 w-[300px] max-w-full items-center gap-3 rounded-[20px] bg-raised ps-4 pe-2.5 text-start shadow-popover"
      >
        <Logo className="size-4 text-primary" />
        <span className="flex-1 text-[16px] text-tertiary sm:text-[14px]">Jump to…</span>
        <kbd className="flex h-7 items-center rounded-[10px] bg-control px-2.5 text-[11px] text-secondary">/</kbd>
      </button>
    </div>
  );
}
