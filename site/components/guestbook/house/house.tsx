"use client";

// The guest house: the guestbook drawn as one building from Commit city's
// model world, where every guest who signed has a window.
//
// The look
// - A white card building on a grey plaster plinth by day (an architect's
//   massing model, like Commit city), graphite with a moonlit rim by night.
//   Front-on oblique, so the facade stays flat and every window is a clean
//   rectangle; the side wall, roof, machine room, two model trees and a
//   street lamp give it depth. A lobby with a glass front and a canopy
//   lettered GUESTBOOK sits at street level.
// - Five windows to a floor, filled in the order people signed, from the
//   first floor up. Each guest's window shows their own hand-drawn
//   signature on the pane: ink on a warm-lit room by day, a silhouette
//   against warm lamp light by night (each window its own colour, amber to
//   soft white, one cooler like a screen left on). Unsigned windows are
//   plain glass. The next free window is a dashed outline that breathes:
//   "your window". The building is as tall as its guests need, and once it
//   is taller than `maxFloors` the floors in between hide behind an
//   architectural break line.
//
// The motion model
// - First view: the lights come on in the order people signed, bottom
//   floor first, one quick beat apart (CSS transitions with per-window
//   delays: a cascade of ~1.5 s at most however many guests there are).
// - Theme: night falls on the model rather than snapping. The site flips
//   its theme with transitions suspended; the house follows two frames
//   later through its own data-night, so the walls fade over 0.8 s and the
//   windows switch on (or off) one by one, each on its own random beat.
// - Reading: point at (or tap, or arrow-key to) a window and its note
//   leans out of it: a single floating card (note-card.tsx) on springs
//   that glides between windows, morphs its height to the note and writes
//   the signature in. The window itself lifts out of the wall a touch on a
//   spring curve (CSS, overshooting).
// - The wow second: signing. The new window is reserved at once (a fast
//   breathing outline, and a new floor if the building needed one). When
//   the sign panel closes, the signature flies out of it into that window
//   (flight.ts), which lights with a flash, a ring and a soft switch-and-
//   glass sound. If the window isn't on screen it lights the moment you
//   scroll to it.
// - Everything is interruptible: the card retargets mid-glide, theme
//   changes mid-cascade just retarget the transitions.
//
// Reduced motion: lights are simply on, the card appears in place, no
// flight, no breathing, no twinkling. Offscreen (or in a hidden tab) the
// card's loop sleeps and the CSS animations pause.
//
// Accessibility: the windows are one tab stop (roving tabindex); arrow keys
// walk the facade, Home / End jump to the first guest and the free window.
// Each window's label carries the whole note, so the floating card is
// visual only. The free window opens the sign form.

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useInView, useLatest, useReducedMotion, useTheme } from "@/components/lab/hooks";
import type { GuestbookEntry } from "@/lib/guestbook";
import { cn } from "@/lib/cn";
import { openCommand } from "@/lib/command";
import type { GuestbookStatus } from "../data";
import { registerHouse } from "../flight";
import { formatEntryDate, windowNumber } from "../format";
import { Signature } from "../signature";
import { lightOn } from "../sound";
import { glassRect, HouseBody } from "./body";
import { beaconPoint, hashUnit, houseLayout, PER_FLOOR, type Slot } from "./layout";
import { NoteCard, type CardFace } from "./note-card";
import { HOUSE_CSS } from "./styles";

/** Warm window lights [lit, deeper edge], amber to soft white, one cool. */
const LIGHTS: ReadonlyArray<readonly [string, string]> = [
  ["255 204 138", "214 148 80"],
  ["255 220 172", "222 166 102"],
  ["255 192 118", "204 134 66"],
  ["255 232 200", "226 182 128"],
  ["255 212 156", "214 158 94"],
  ["255 226 186", "218 172 116"],
  ["234 238 248", "182 190 212"],
];

const FREE = "free";
const INK_STROKE = 1.3;

export type GuestHouseHandle = {
  /** Mark a window (e.g. while its row in the register is hovered). */
  highlight(id: string | null): void;
  /** Scroll a window into view, focus it and show its note. */
  reveal(id: string): void;
};

type WindowKind = "guest" | "arriving" | "anon" | "free";

type Win = {
  key: string;
  slot: Slot;
  kind: WindowKind;
  entry: GuestbookEntry | null;
};

type Target = { id: string; el: HTMLElement; pinned: boolean; source: "hover" | "focus" | "tap" | "auto" };

export function GuestHouse({
  ref,
  entries,
  count,
  status,
  enabled,
  maxFloors,
  size = "teaser",
  hint,
  action,
  className,
}: {
  ref?: Ref<GuestHouseHandle>;
  /** Newest first. */
  entries: GuestbookEntry[];
  /** Total signatures (null while unknown: the entries are counted). */
  count: number | null;
  status: GuestbookStatus;
  enabled: boolean;
  maxFloors: number;
  /** "page" draws the house at full size. */
  size?: "teaser" | "page";
  /** Top-left of the panel (a line of text). */
  hint?: ReactNode;
  /** Top-right of the panel (a button). */
  action?: ReactNode;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const windows = useRef(new Map<string, HTMLElement>());
  const theme = useTheme();
  const reduced = useReducedMotion();
  const inView = useInView(rootRef, { rootMargin: "80px" });
  const inViewRef = useLatest(inView);

  const ready = status === "ready";
  const total = Math.max(count ?? 0, entries.length);
  const layout = useMemo(() => houseLayout(ready ? total : 0, maxFloors), [ready, total, maxFloors]);

  /* day and night ---------------------------------------------------- */

  const [night, setNight] = useState<boolean | null>(null);
  const [still, setStill] = useState(true);
  const lastTheme = useRef<string | null>(null);
  useEffect(() => {
    if (lastTheme.current === null) {
      lastTheme.current = theme;
      setNight(theme === "dark");
      return;
    }
    if (lastTheme.current === theme) return;
    lastTheme.current = theme;
    // Follow once the site's transition freeze (lib/theme.ts) has lifted.
    const root = document.documentElement;
    let frame = 0;
    const apply = () => {
      if (root.hasAttribute("data-theme-changing")) frame = requestAnimationFrame(apply);
      else setNight(theme === "dark");
    };
    frame = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(frame);
  }, [theme]);
  useEffect(() => {
    if (!still || night === null) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setStill(false));
    });
    return () => cancelAnimationFrame(frame);
  }, [still, night]);

  /* who lives where -------------------------------------------------- */

  const known = useRef<Set<string> | null>(null);
  const [arriving, setArriving] = useState<ReadonlySet<string>>(() => new Set());
  const [landing, setLanding] = useState<ReadonlySet<string>>(() => new Set());
  const pendingFlash = useRef(new Set<string>());

  useEffect(() => {
    if (!ready) return;
    if (!known.current) {
      known.current = new Set(entries.map((entry) => entry.id));
      return;
    }
    const seen = known.current;
    const fresh = entries.filter((entry) => !seen.has(entry.id)).map((entry) => entry.id);
    if (!fresh.length) return;
    fresh.forEach((id) => seen.add(id));
    setArriving((prev) => new Set([...prev, ...fresh]));
  }, [entries, ready]);

  const wins = useMemo<Win[]>(() => {
    const byIndex = new Map<number, GuestbookEntry>();
    entries.forEach((entry, i) => byIndex.set(total - 1 - i, entry));
    const out: Win[] = [];
    for (const slot of layout.slots) {
      if (!ready && status !== "disabled" && status !== "error") continue;
      if (slot.index < (ready ? total : 0)) {
        const entry = byIndex.get(slot.index) ?? null;
        if (!entry) out.push({ key: `anon-${slot.index}`, slot, kind: "anon", entry: null });
        else out.push({ key: entry.id, slot, kind: arriving.has(entry.id) ? "arriving" : "guest", entry });
      } else if (slot.index === (ready ? total : 0) && status !== "error") {
        out.push({ key: FREE, slot, kind: "free", entry: null });
      }
    }
    return out;
  }, [entries, total, layout, ready, status, arriving]);

  /* the first-view cascade ------------------------------------------- */

  const [revealed, setRevealed] = useState(false);
  const [cascaded, setCascaded] = useState(false);
  const guests = useMemo(() => wins.filter((w) => w.kind === "guest" || w.kind === "anon"), [wins]);
  const step = Math.min(60, 1500 / Math.max(1, guests.length));
  useEffect(() => {
    if (!revealed && ready && inView) setRevealed(true);
  }, [revealed, ready, inView]);
  useEffect(() => {
    if (!revealed || cascaded) return;
    const timer = window.setTimeout(() => setCascaded(true), reduced ? 0 : guests.length * step + 900);
    return () => window.clearTimeout(timer);
  }, [revealed, cascaded, reduced, guests.length, step]);
  const cascadeOrder = useMemo(() => {
    const order = new Map<string, number>();
    [...guests].sort((a, b) => a.slot.index - b.slot.index).forEach((w, k) => order.set(w.key, k));
    return order;
  }, [guests]);

  /* landing ---------------------------------------------------------- */

  const landingTimers = useRef(new Map<string, number>());
  const flash = useCallback(
    (id: string, flown: boolean) => {
      if (reduced) return;
      setLanding((prev) => new Set(prev).add(id));
      if (flown) lightOn();
      const old = landingTimers.current.get(id);
      if (old) window.clearTimeout(old);
      landingTimers.current.set(
        id,
        window.setTimeout(() => {
          landingTimers.current.delete(id);
          setLanding((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 1300),
      );
    },
    [reduced],
  );

  const land = useCallback(
    (id: string, flown: boolean) => {
      setArriving((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (inViewRef.current) flash(id, flown);
      else pendingFlash.current.add(id);
    },
    [flash, inViewRef],
  );

  // Flash what landed while the house was out of sight, once it is back.
  useEffect(() => {
    if (!inView || pendingFlash.current.size === 0) return;
    const ids = [...pendingFlash.current];
    pendingFlash.current.clear();
    const timer = window.setTimeout(() => ids.forEach((id) => flash(id, false)), 250);
    return () => window.clearTimeout(timer);
  }, [inView, flash]);

  // A reserved window that no flight claims lights up on its own.
  useEffect(() => {
    if (arriving.size === 0) return;
    const timers = [...arriving].map((id) => window.setTimeout(() => land(id, false), 6000));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [arriving, land]);

  useEffect(() => {
    const timers = landingTimers.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const locate = useCallback((id: string) => {
    const el = windows.current.get(id);
    const ink = el?.querySelector<HTMLElement>(".gh-ink");
    const svg = ink?.querySelector("svg");
    if (!ink || !svg) return null;
    return { rect: svg.getBoundingClientRect(), color: getComputedStyle(ink).color, stroke: INK_STROKE };
  }, []);

  useEffect(() => registerHouse({ locate, land }), [locate, land]);

  /* the note card ---------------------------------------------------- */

  const [target, setTarget] = useState<Target | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const hideTimer = useRef(0);
  const lastPointer = useRef<string>("mouse");

  const show = useCallback((id: string, source: Target["source"], pinned = false) => {
    window.clearTimeout(hideTimer.current);
    const el = windows.current.get(id);
    if (!el) return;
    setTarget((prev) => (prev && prev.id === id && prev.el === el && prev.pinned === pinned && prev.source === source ? prev : { id, el, pinned, source }));
  }, []);
  const hide = useCallback((sources?: Array<Target["source"]>) => {
    window.clearTimeout(hideTimer.current);
    setTarget((prev) => (!prev || (sources && !sources.includes(prev.source)) ? prev : null));
  }, []);
  const hideSoon = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setTarget((prev) => (prev && !prev.pinned && prev.source === "hover" ? null : prev));
    }, 160);
  }, []);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // Tap or click anywhere else lets go of a pinned note.
  useEffect(() => {
    if (!target?.pinned) return;
    const onDown = (event: PointerEvent) => {
      const el = event.target as Element | null;
      if (el?.closest?.(".gh-win")) return;
      hide();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [target?.pinned, hide]);

  // Nothing to read yet: the free window introduces itself.
  const hasGuests = wins.some((w) => w.kind !== "free");
  const calloutText = !hasGuests && (ready || status === "disabled") ? (enabled ? "Your window" : "Not open yet") : null;
  const [autoAnchor, setAutoAnchor] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setAutoAnchor(calloutText ? (windows.current.get(FREE) ?? null) : null);
  }, [calloutText, layout]);

  const byKey = useMemo(() => new Map(wins.map((w) => [w.key, w])), [wins]);
  const current = target ? byKey.get(target.id) : undefined;
  const face = useMemo<CardFace | null>(() => {
    if (current?.kind === "guest" && current.entry) {
      const entry = current.entry;
      const date = formatEntryDate(entry.created_at);
      return {
        key: entry.id,
        width: 272,
        node: (
          <div className="px-3.5 pt-3 pb-3">
            <Signature path={entry.signature} draw drawMs={560} strokeWidth={1.7} className="h-[44px] w-full max-w-[220px] text-primary" />
            <p className="mt-2 text-[14px]/[1.45] text-pretty break-words text-primary">{entry.message}</p>
            <p className="mt-2 flex items-baseline gap-1.5 text-[12px] text-tertiary">
              <span className="min-w-0 truncate text-secondary">{entry.name}</span>
              {date ? (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={entry.created_at} className="shrink-0 tabular-nums">
                    {date}
                  </time>
                </>
              ) : null}
              <span className="ms-auto shrink-0 ps-2 tabular-nums">No. {windowNumber(current.slot.index)}</span>
            </p>
          </div>
        ),
      };
    }
    if (current?.kind === "free") {
      return {
        key: FREE,
        width: 236,
        node: (
          <div className="px-3.5 py-3">
            <p className="text-[14px] text-primary">{enabled ? `Window ${windowNumber(current.slot.index)} is free` : "Not open yet"}</p>
            <p className="mt-0.5 text-[13px]/[1.45] text-pretty text-tertiary">
              {enabled
                ? "Sign the guestbook and it lights up with your signature."
                : "The guestbook isn't connected yet. Windows light up once it is."}
            </p>
          </div>
        ),
      };
    }
    if (!target && calloutText) {
      return {
        key: `callout-${calloutText}`,
        width: "auto",
        node: <p className="px-3 py-[6px] text-center text-[13px] whitespace-nowrap text-primary">{calloutText}</p>,
      };
    }
    return null;
  }, [current, target, calloutText, enabled]);
  const anchor = target && current && current.kind !== "anon" ? target.el : !target && calloutText ? autoAnchor : null;

  /* keyboard --------------------------------------------------------- */

  const focusable = useMemo(
    () =>
      wins
        .filter((w) => w.kind === "guest" || w.kind === "free")
        .sort((a, b) => b.slot.floor - a.slot.floor || a.slot.col - b.slot.col),
    [wins],
  );
  const [roving, setRoving] = useState<string | null>(null);
  const defaultStop = useMemo(() => {
    const guestsByIndex = focusable.filter((w) => w.kind === "guest").sort((a, b) => b.slot.index - a.slot.index);
    return guestsByIndex[0]?.key ?? focusable[0]?.key ?? null;
  }, [focusable]);
  const tabStop = roving && byKey.has(roving) ? roving : defaultStop;

  const moveFocus = (id: string | undefined) => {
    if (!id) return;
    setRoving(id);
    windows.current.get(id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const id = (event.target as HTMLElement).dataset.win;
    if (!id) return;
    const here = byKey.get(id);
    if (!here) return;
    const byIndex = new Map(focusable.map((w) => [w.slot.index, w.key]));
    const indices = focusable.map((w) => w.slot.index).sort((a, b) => a - b);
    const i = here.slot.index;
    let next: string | undefined;
    switch (event.key) {
      case "ArrowLeft":
        next = byIndex.get(i - 1);
        break;
      case "ArrowRight":
        next = byIndex.get(i + 1);
        break;
      case "ArrowUp":
        next = byIndex.get(i + PER_FLOOR) ?? (i + PER_FLOOR <= indices[indices.length - 1] ? byIndex.get(indices[indices.length - 1]) : undefined);
        break;
      case "ArrowDown":
        next = byIndex.get(i - PER_FLOOR);
        break;
      case "Home":
        next = byIndex.get(indices[0]);
        break;
      case "End":
        next = byIndex.get(indices[indices.length - 1]);
        break;
      case "Escape":
        if (target) {
          event.preventDefault();
          hide();
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    moveFocus(next);
  };

  /* handle ----------------------------------------------------------- */

  useImperativeHandle(
    ref,
    () => ({
      highlight: (id) => setHighlighted(id),
      reveal: (id) => {
        const el = windows.current.get(id);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        setRoving(id);
        el.focus({ preventScroll: true });
        show(id, "tap", true);
      },
    }),
    [reduced, show],
  );

  /* height changes: grow, don't jump --------------------------------- */

  const lastHeight = useRef(0);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const next = panel.getBoundingClientRect().height;
    const prev = lastHeight.current;
    lastHeight.current = next;
    if (!prev || Math.abs(prev - next) < 1 || reduced || typeof panel.animate !== "function") return;
    panel.animate([{ height: `${prev}px` }, { height: `${next}px` }], { duration: 700, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  }, [layout.box.h, reduced]);

  /* render ----------------------------------------------------------- */

  const { box, core } = layout;
  const maxScale = size === "page" ? 1 : 0.86;
  const boxStyle: CSSProperties = {
    width: `min(${(box.w * maxScale).toFixed(1)}px, calc(100% * ${(box.w / core.w).toFixed(4)}))`,
    aspectRatio: `${box.w.toFixed(2)} / ${box.h.toFixed(2)}`,
    marginLeft: "50%",
    translate: `${(-((core.x + core.w / 2 - box.x) / box.w) * 100).toFixed(3)}% 0`,
  };
  const pct = (value: number, of: number) => `${((value / of) * 100).toFixed(4)}%`;

  const lit = revealed || (reduced && ready);
  const groupLabel = !enabled
    ? "Guestbook building, not open yet"
    : ready
      ? `Guestbook building: ${total} ${total === 1 ? "window" : "windows"} lit, one for each signature`
      : "Guestbook building";

  return (
    <div
      ref={rootRef}
      className={cn("gh relative", className)}
      data-night={night === null ? undefined : night ? "1" : "0"}
      data-still={still ? "" : undefined}
      data-inview={inView ? "" : undefined}
    >
      <style href="guest-house" precedence="default">
        {HOUSE_CSS}
      </style>
      <div ref={panelRef} className="relative flex flex-col justify-end overflow-hidden rounded-panel bg-tile">
        <div aria-hidden="true" className="gh-sky pointer-events-none absolute inset-0">
          <Stars />
        </div>
        {hint || action ? (
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3.5 sm:p-4">
            <div className="min-w-0 pt-1.5 text-[13px]/[1.4] text-pretty text-tertiary">{hint}</div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        ) : null}
        <div className={cn("relative pb-3", size === "page" ? "pt-14" : "pt-10")}>
          <div className="relative" style={boxStyle}>
            <svg
              aria-hidden="true"
              viewBox={`${box.x.toFixed(2)} ${box.y.toFixed(2)} ${box.w.toFixed(2)} ${box.h.toFixed(2)}`}
              className="absolute inset-0 size-full overflow-visible"
            >
              <HouseBody layout={layout} uid={uid} />
            </svg>
            {/* The beacon's breathing glow lives outside the SVG, on its own
                layer, so the night animation never repaints the building. */}
            <span
              aria-hidden="true"
              className="gh-beacon-glow"
              style={{ left: pct(beaconPoint(layout)[0] - box.x, box.w), top: pct(beaconPoint(layout)[1] - box.y, box.h) }}
            />
            <div
              role="group"
              aria-label={groupLabel}
              aria-busy={status === "loading" || undefined}
              onKeyDown={onKeyDown}
              onPointerLeave={(event) => {
                if (event.pointerType !== "touch") hideSoon();
              }}
            >
              {wins.map((w) => {
                const g = glassRect(w.slot.rect);
                const light = LIGHTS[Math.floor(hashUnit(w.key, 3) * LIGHTS.length)];
                const order = cascadeOrder.get(w.key) ?? 0;
                const delay = reduced ? 0 : cascaded ? hashUnit(w.key, 9) * 900 : order * step;
                const style = {
                  left: pct(g.x - box.x, box.w),
                  top: pct(g.y - box.y, box.h),
                  width: pct(g.w, box.w),
                  height: pct(g.h, box.h),
                  "--gh-l": light[0],
                  "--gh-l-lo": light[1],
                  "--gh-delay": `${Math.round(delay)}ms`,
                } as CSSProperties;
                const isLit = lit && (w.kind === "guest" || w.kind === "anon");
                const common = {
                  "data-kind": w.kind,
                  "data-lit": isLit ? "" : undefined,
                  "data-active": target?.id === w.key ? "" : undefined,
                  "data-landing": landing.has(w.key) ? "" : undefined,
                  "data-highlight": highlighted === w.key ? "" : undefined,
                };
                const register = (el: HTMLElement | null) => {
                  if (el) windows.current.set(w.key, el);
                  else windows.current.delete(w.key);
                };
                const layers = (
                  <>
                    <span className="gh-room" />
                    <span className="gh-lamp" />
                    {w.entry ? (
                      <span className="gh-ink">
                        <Signature path={w.entry.signature} align="center" strokeWidth={INK_STROKE} className="size-full" />
                      </span>
                    ) : null}
                    {w.kind === "free" || w.kind === "arriving" ? <FreeOutline /> : null}
                    <span className="gh-sheen" />
                  </>
                );
                if (w.kind === "anon" || w.kind === "arriving") {
                  return (
                    <span key={w.key} ref={register} aria-hidden="true" className="gh-win pointer-events-none" style={style} {...common}>
                      {layers}
                    </span>
                  );
                }
                const label =
                  w.kind === "free"
                    ? enabled
                      ? `Window ${windowNumber(w.slot.index)} is free. Sign the guestbook to take it.`
                      : "Free window. The guestbook isn't open yet."
                    : `${w.entry!.name}: “${w.entry!.message}”${formatEntryDate(w.entry!.created_at) ? `, ${formatEntryDate(w.entry!.created_at)}` : ""}. Window ${windowNumber(w.slot.index)}, floor ${w.slot.floor}.`;
                return (
                  <button
                    key={w.key}
                    ref={register}
                    type="button"
                    data-win={w.key}
                    tabIndex={tabStop === w.key ? 0 : -1}
                    aria-label={label}
                    className="gh-win"
                    style={style}
                    {...common}
                    onPointerDown={(event) => {
                      lastPointer.current = event.pointerType;
                    }}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") show(w.key, "hover");
                    }}
                    onFocus={(event) => {
                      setRoving(w.key);
                      if (event.currentTarget.matches(":focus-visible")) show(w.key, "focus");
                    }}
                    onBlur={(event) => {
                      const next = event.relatedTarget as Element | null;
                      if (!next?.closest?.(".gh-win")) hide(["focus"]);
                    }}
                    onClick={(event) => {
                      if (w.kind === "free") {
                        openCommand("guestbook");
                        return;
                      }
                      const touch = lastPointer.current === "touch" || event.detail === 0;
                      if (!touch) return;
                      if (target?.id === w.key && target.pinned) hide();
                      else show(w.key, "tap", true);
                    }}
                  >
                    {layers}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <NoteCard wrapRef={rootRef} anchor={anchor} face={anchor ? face : null} active={inView} reducedMotion={reduced} />
    </div>
  );
}

function FreeOutline() {
  return (
    <svg className="gh-free" viewBox="0 0 52 36" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="50.5" height="34.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3.5 2.5" vectorEffect="non-scaling-stroke" />
      <path d="M26 13.5v9M21.5 18h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const STARS = Array.from({ length: 26 }, (_, i) => ({
  left: hashUnit(`star-${i}`, 1) * 100,
  top: 14 + Math.pow(hashUnit(`star-${i}`, 2), 1.4) * 42,
  a: 0.25 + hashUnit(`star-${i}`, 4) * 0.6,
  d: hashUnit(`star-${i}`, 5) * 1.4,
  t: 4 + hashUnit(`star-${i}`, 6) * 5,
  big: hashUnit(`star-${i}`, 7) > 0.85,
}));

function Stars() {
  return (
    <>
      {STARS.map((star, i) => (
        <span
          key={i}
          className="gh-star"
          style={
            {
              left: `${star.left.toFixed(2)}%`,
              top: `${star.top.toFixed(2)}%`,
              "--a": star.a.toFixed(2),
              "--d": `${star.d.toFixed(2)}s`,
              "--t": `${star.t.toFixed(2)}s`,
              width: star.big ? 2.5 : 1.5,
              height: star.big ? 2.5 : 1.5,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
