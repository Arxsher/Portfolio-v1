"use client";

// The theme button in the header and its small menu.
//
//   mouse click             flips light <-> the last dark palette (AMOLED,
//                           the main one, until Red Dragon is picked)
//   mouse hover             shows the menu: Light, AMOLED, Red Dragon, each
//                           a swatch row with a check on the one on screen
//   Enter / Space / ↓ / ↑   (keyboard and screen readers) open the menu, as
//                           a menu button does, with focus on the checked
//                           row (↑: the last row); arrows, Home and End move
//                           around it, Enter or Space picks, Esc closes
//   tap (touch, pen)        opens the menu instead of flipping, with a
//                           light/dark toggle row on top and taller rows
//
// The menu stays in the DOM so it can fade both ways; while closed it is
// `visibility: hidden` (out of the tab order and the accessibility tree).

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { Check, Moon, Sun } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  PALETTES,
  THEME_SWITCH_END,
  isThemeSwitching,
  paletteLabel,
  setTheme,
  syncTheme,
  toggleTheme,
  useDarkPalette,
  usePalette,
  type Palette,
} from "@/lib/theme";

type OpenedBy = "hover" | "keys" | "touch";

/** Hover this long before the menu shows, so passing over it does nothing. */
const OPEN_DELAY = 110;
/** Grace period for crossing from the button to the menu (and back). */
const CLOSE_DELAY = 240;

// Enter: fade, rise 4px, unblur and grow from the button's corner. Leave
// is quicker; visibility flips only once it has faded.
const SHOWN: CSSProperties = {
  transition:
    "opacity 180ms var(--ease-out), scale 220ms var(--ease-out), translate 220ms var(--ease-out), filter 180ms var(--ease-out), visibility 0s linear 0s",
};
const HIDDEN: CSSProperties = {
  transition:
    "opacity 130ms var(--ease-out), scale 130ms var(--ease-out), translate 130ms var(--ease-out), filter 130ms var(--ease-out), visibility 0s linear 130ms",
};

/** Tiny preview: the page colour with an accent dot and a text bar on it. */
function Swatch({ palette }: { palette: Palette }) {
  const { swatch } = PALETTES.find((entry) => entry.id === palette)!;
  return (
    <span
      aria-hidden="true"
      className="flex h-[18px] w-7 shrink-0 items-center gap-[3px] rounded-[6px] ps-[5px] shadow-[inset_0_0_0_1px_var(--edge-firm)]"
      style={{ background: swatch.bg }}
    >
      <span className="size-[6px] rounded-full" style={{ background: swatch.main }} />
      <span className="h-[3px] w-[9px] rounded-full" style={{ background: swatch.text }} />
    </span>
  );
}

// Hover fills the row; keyboard focus also draws the 2px ring every other
// control on the site uses (inset, so the rounded panel doesn't clip it).
const ROW =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2 text-start text-[13px] outline-none transition-[background-color,color] duration-150 ease-out hover:bg-well focus-visible:bg-well focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

export function ThemeMenu() {
  const palette = usePalette();
  const lastDark = useDarkPalette();
  const dark = palette !== "light";

  const [openedBy, setOpenedBy] = useState<OpenedBy | null>(null);
  // Whether the menu has the touch layout (toggle row, 44px rows); kept
  // after closing so the panel doesn't change shape while it fades out.
  const [touchLayout, setTouchLayout] = useState(false);
  const open = openedBy !== null;

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  const pointerType = useRef("");
  /** Last known mouse position (viewport px), for checking where it is
      after a theme cross-fade, when :hover can't be trusted. */
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  /** A close is scheduled (the timer belongs to it). */
  const leaving = useRef(false);
  /** Item to focus once the menu has rendered open. */
  const pendingFocus = useRef<number | null>(null);

  const menuId = useId();

  // React's dev remount resets <html> attributes set by the inline script.
  useLayoutEffect(() => {
    syncTheme();
  }, []);

  const clearTimer = () => {
    window.clearTimeout(timer.current);
    leaving.current = false;
  };

  const show = (by: OpenedBy) => {
    clearTimer();
    setTouchLayout(by === "touch");
    setOpenedBy(by);
  };
  const hide = () => {
    clearTimer();
    setOpenedBy(null);
  };

  /** Is the mouse over the button, the menu or the bridge between them? */
  const pointerInside = () => {
    const root = rootRef.current;
    if (!root) return false;
    const at = pointer.current;
    if (at) {
      const over = document.elementFromPoint(at.x, at.y);
      return over !== null && root.contains(over);
    }
    return root.matches(":hover");
  };

  /** Close a hover-opened menu once the mouse is really gone. Keyboard
      focus inside keeps it open (a mouse click's focus doesn't). */
  const leaveSoon = (delay: number) => {
    if (leaving.current) return;
    window.clearTimeout(timer.current);
    leaving.current = true;
    timer.current = window.setTimeout(() => {
      leaving.current = false;
      if (rootRef.current?.querySelector(":focus-visible")) return;
      if (!pointerInside()) hide();
    }, delay);
  };

  const items = () => itemsRef.current.filter(Boolean);

  // Rows above the palettes: the toggle row, only in the touch menu.
  const lead = open && touchLayout ? 1 : 0;
  const checkedRow = lead + Math.max(0, PALETTES.findIndex((entry) => entry.id === palette));

  /** Focus a menu row (wrapping), opening the menu first if needed. */
  const focusItem = (index: number) => {
    const count = lead + PALETTES.length;
    const next = ((index % count) + count) % count;
    if (open) {
      items()[next]?.focus();
    } else {
      pendingFocus.current = next;
      show("keys");
    }
  };

  useLayoutEffect(() => {
    if (!open || pendingFocus.current === null) return;
    items()[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  }, [open, touchLayout]);

  // A tap or click anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) hide();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // While a hover-opened menu is up, follow the mouse across the whole
  // page. pointerleave alone isn't enough: a theme cross-fade (a view
  // transition) puts a snapshot over the page, so the browser reports the
  // pointer as gone mid-fade and then never sends a leave for the real
  // exit. The fade's end re-checks where the mouse is.
  useEffect(() => {
    if (openedBy !== "hover") return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (isThemeSwitching()) return;
      if (rootRef.current?.contains(event.target as Node)) {
        if (leaving.current) clearTimer();
      } else {
        leaveSoon(CLOSE_DELAY);
      }
    };
    let frame = 0;
    const onSwitchEnd = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => leaveSoon(0));
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener(THEME_SWITCH_END, onSwitchEnd);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener(THEME_SWITCH_END, onSwitchEnd);
    };
  }, [openedBy]);

  useEffect(() => clearTimer, []);

  const returnFocus = () => buttonRef.current?.focus();

  /** Close after a pick; focus goes back to the button, as for any menu. */
  const finish = () => {
    const hadFocus = rootRef.current?.contains(document.activeElement);
    hide();
    if (hadFocus) returnFocus();
  };

  const pick = (next: Palette) => {
    setTheme(next);
    // A hovering mouse keeps the menu up to watch the check move; a tap or
    // a key press is done once something is picked.
    if (openedBy !== "hover") finish();
  };

  const onButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    const type = pointerType.current;
    pointerType.current = "";
    if (type === "touch" || type === "pen") {
      if (open) hide();
      else show("touch");
      return;
    }
    // detail 0: Enter or Space, or a screen reader's "activate". The
    // button is announced as a menu button, so it opens the menu.
    if (event.detail === 0) {
      if (openedBy === "keys") hide();
      else focusItem(checkedRow);
      return;
    }
    toggleTheme();
  };

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    pointerType.current = "";
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(checkedRow);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(-1);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      hide();
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(-1);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        hide();
        returnFocus();
        break;
      case "Tab":
        hide();
        break;
    }
  };

  let row = 0;
  const register = (index: number) => (node: HTMLButtonElement | null) => {
    if (node) itemsRef.current[index] = node;
    else delete itemsRef.current[index];
  };

  const rowSize = touchLayout ? "h-11" : "h-[34px]";
  const darkLabel = paletteLabel(lastDark);

  return (
    <div
      ref={rootRef}
      className="relative -me-2 shrink-0"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        pointer.current = { x: event.clientX, y: event.clientY };
        clearTimer();
        if (!open) timer.current = window.setTimeout(() => show("hover"), OPEN_DELAY);
        else if (openedBy === "touch") setOpenedBy("hover");
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        pointer.current = { x: event.clientX, y: event.clientY };
        // Not open yet: just cancel the pending open.
        if (!open) {
          clearTimer();
          return;
        }
        // Mid cross-fade this leave is the snapshot covering the page, not
        // the mouse; the fade's end decides (see the effect above).
        if (isThemeSwitching()) return;
        if (openedBy === "hover") leaveSoon(CLOSE_DELAY);
      }}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && rootRef.current?.contains(next)) return;
        if (openedBy === "keys") hide();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Theme: ${paletteLabel(palette)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onClick={onButtonClick}
        onKeyDown={onButtonKeyDown}
        className={cn(
          "relative flex size-9 cursor-pointer items-center justify-center rounded-[12px] text-secondary transition-[background-color,color,scale] duration-150 ease-out hover:bg-well hover:text-primary active:scale-[0.96] focus-ring",
          open && "bg-well text-primary",
        )}
      >
        {/* Which icon shows is decided by the `dark` class in CSS, so the
            right one is visible before hydration. */}
        <span className="grid place-items-center">
          <span className="theme-icon" data-icon="sun" data-keep-transition="">
            <Sun />
          </span>
          <span className="theme-icon" data-icon="moon" data-keep-transition="">
            <Moon />
          </span>
        </span>
      </button>

      {/* pt-1.5 is a hover bridge: the pointer can cross the gap. */}
      <div
        className={cn(
          "absolute end-0 top-full z-50 origin-top-right pt-1.5",
          open
            ? "visible opacity-100"
            : "pointer-events-none invisible -translate-y-1 scale-[0.96] opacity-0 blur-[2px] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:blur-none",
        )}
        style={open ? SHOWN : HIDDEN}
        data-open={open ? "" : undefined}
      >
        <div
          id={menuId}
          role="menu"
          aria-label="Theme"
          aria-orientation="vertical"
          onKeyDown={onMenuKeyDown}
          className={cn(
            "flex flex-col gap-px rounded-[14px] bg-float p-1 shadow-float",
            touchLayout ? "w-[232px]" : "w-[184px]",
          )}
        >
          {touchLayout ? (
            <>
              <button
                ref={register(row++)}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-label={dark ? "Light mode" : `Dark mode, ${darkLabel}`}
                onClick={() => {
                  toggleTheme();
                  finish();
                }}
                className={cn(ROW, rowSize, "text-secondary hover:text-primary focus-visible:text-primary")}
              >
                <span aria-hidden="true" className="grid w-7 shrink-0 place-items-center">
                  {dark ? <Sun /> : <Moon />}
                </span>
                <span className="flex-1 truncate">{dark ? "Light mode" : "Dark mode"}</span>
                {dark ? null : (
                  <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5 text-[12px] text-tertiary">
                    {darkLabel}
                    <Swatch palette={lastDark} />
                  </span>
                )}
              </button>
              <span aria-hidden="true" className="mx-2 my-0.5 h-px bg-border" />
            </>
          ) : null}
          {PALETTES.map(({ id, label }) => {
            const checked = palette === id;
            return (
              <button
                key={id}
                ref={register(row++)}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                onClick={() => pick(id)}
                className={cn(
                  ROW,
                  rowSize,
                  checked ? "font-medium text-primary" : "text-secondary hover:text-primary focus-visible:text-primary",
                )}
              >
                <Swatch palette={id} />
                <span className="flex-1 truncate">{label}</span>
                <Check
                  size={14}
                  className={cn(
                    "shrink-0 text-ring transition-[opacity,scale] duration-200 ease-out",
                    checked ? "opacity-100" : "scale-50 opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
