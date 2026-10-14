"use client";

// The floating "Jump to…" bar at the bottom of every page, and everything
// it opens.
//
// Closed, it is a 300×48 pill: the mark, an input, and a "/" hint. Open,
// it widens to 540px and grows upward into a panel over the page (no
// backdrop): the list of shortcuts, or one of the views (Say hi, Book a
// call, the guestbook, Work, Theme …). The input stays at the bottom the
// whole time and drives it: typing filters the list, typing a view's name
// opens that view, and typing a note ("hi, i'm sam, sam@site.com, love
// your work") opens Say hi with the form filled in.
//
// Open with "/" (outside a text field), by clicking the bar,
// or from anywhere through lib/command.ts: openCommand("say-hi", prefill).
// Close with Esc, the "esc" chip, a view's ×, or a click outside.
//
// Motion (see motion.ts): the width eases over 240ms, the height follows
// a spring, views cross-fade, and the "/" and "esc" chips swap with a
// blur-and-scale pop. Reduced motion turns it all into plain cuts.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { Logo } from "@/components/logo";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { onCommand, type CommandPrefill, type CommandView } from "@/lib/command";
import { SOCIAL_VIEWS, VIEWS, paletteItems, resolveQuery, type DockView, type PaletteItem, type PanelView } from "./items";
import { EASE_OUT, SPRING_FOLD, SPRING_GROW, Spring, VIEW_IN_MS, VIEW_OUT_MS, prefersReducedMotion } from "./motion";
import { Palette, optionId } from "./palette";
import { BookCallPanel } from "./panels/book-call";
import { GitHubPanel } from "./panels/github";
import { GuestbookPanel } from "./panels/guestbook";
import { LabPanel } from "./panels/lab";
import { Panel } from "./panels/panel";
import { SayHiPanel } from "./panels/say-hi";
import { SocialPanel } from "./panels/social";
import { ThemePanel } from "./panels/theme";
import { WorkPanel } from "./panels/work";
import { WritingPanel } from "./panels/writing";

const WIDTH_CLOSED = 300;
const WIDTH_OPEN = 540;

/* ---------------------------------------------------------------------- */
/* state                                                                   */
/* ---------------------------------------------------------------------- */

/** What the open bar shows. */
type Live = {
  view: DockView;
  query: string;
  /** Active row of the list. */
  active: number;
  prefill: CommandPrefill;
  /** The prefill was read from the typed query (Say hi shows what it picked up). */
  fromTyping: boolean;
  /** The view should move focus into its first field when it mounts. */
  autoFocus: boolean;
};

/** One rendered view. The current one has no `frozen`; views on their way out keep the state they left with. */
type Entry = { key: number; view: DockView; frozen?: Live };

type State = { open: boolean; live: Live; entries: Entry[]; seq: number };

type Action =
  | { type: "show"; live: Live }
  | { type: "active"; index: number }
  | { type: "close" }
  | { type: "exited"; key: number };

const IDLE: Live = { view: "palette", query: "", active: 0, prefill: {}, fromTyping: false, autoFocus: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "show": {
      const current = state.entries.find((entry) => !entry.frozen);
      if (state.open && current && current.view === action.live.view) return { ...state, live: action.live };
      const seq = state.seq + 1;
      const entries = state.entries.map((entry) => (entry === current ? { ...entry, frozen: state.live } : entry));
      return { open: true, live: action.live, entries: [...entries, { key: seq, view: action.live.view }], seq };
    }
    case "active":
      return action.index === state.live.active ? state : { ...state, live: { ...state.live, active: action.index } };
    case "close":
      if (!state.open) return state;
      return {
        ...state,
        open: false,
        live: IDLE,
        entries: state.entries.map((entry) => (entry.frozen ? entry : { ...entry, frozen: state.live })),
      };
    case "exited":
      return { ...state, entries: state.entries.filter((entry) => entry.key !== action.key) };
  }
}

/** The state a typed query leads to. */
function fromQuery(query: string): Live {
  const resolved = resolveQuery(query);
  if ("parsed" in resolved) {
    const { name, email, message } = resolved.parsed;
    return { view: "say-hi", query, active: 0, prefill: { name, email, message }, fromTyping: true, autoFocus: false };
  }
  return { ...IDLE, view: resolved.view, query };
}

const viewLive = (view: PanelView, prefill: CommandPrefill = {}, autoFocus = false): Live => ({
  view,
  query: VIEWS[view].input,
  active: 0,
  prefill,
  fromTyping: false,
  autoFocus,
});

/* ---------------------------------------------------------------------- */
/* helpers                                                                 */
/* ---------------------------------------------------------------------- */

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

function focusablesIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.closest("[inert]") &&
      !element.closest('[aria-hidden="true"]') &&
      element.getClientRects().length > 0,
  );
}

/** One view, fading in when it mounts and out when it is replaced or the bar closes. */
function ViewSlot({ leaving, onExited, children }: { leaving: boolean; onExited: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const exited = useRef(onExited);
  useLayoutEffect(() => {
    exited.current = onExited;
  });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: VIEW_IN_MS, easing: EASE_OUT });
  }, []);

  useLayoutEffect(() => {
    if (!leaving) return;
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      exited.current();
      return;
    }
    const from = getComputedStyle(element).opacity;
    element.getAnimations().forEach((animation) => animation.cancel());
    const animation = element.animate([{ opacity: from }, { opacity: 0 }], {
      duration: VIEW_OUT_MS,
      easing: EASE_OUT,
      fill: "forwards",
    });
    animation.onfinish = () => exited.current();
    return () => animation.cancel();
  }, [leaving]);

  return (
    <div
      ref={ref}
      inert={leaving}
      aria-hidden={leaving || undefined}
      className={leaving ? "pointer-events-none absolute inset-x-0 top-0" : "relative"}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* the bar                                                                 */
/* ---------------------------------------------------------------------- */

export function CommandBar() {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const [state, dispatch] = useReducer(reducer, { open: false, live: IDLE, entries: [], seq: 0 });
  const { open, live } = state;

  const dockRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef<"input" | "field" | "panel" | null>(null);

  const items = useMemo(() => (live.view === "palette" ? paletteItems(live.query) : []), [live.view, live.query]);

  // Latest values for the window listeners below.
  const latest = useRef({ open, live, items, pathname });
  useLayoutEffect(() => {
    latest.current = { open, live, items, pathname };
  });

  /* height: a spring toward the current view's height ------------------ */

  useLayoutEffect(() => {
    const wrap = heightRef.current;
    const content = contentRef.current;
    if (!wrap || !content) return;
    const motion = new Spring((value) => {
      wrap.style.height = `${Math.max(0, value)}px`;
    });
    motion.set(0);
    let pending = 0;
    const observer = new ResizeObserver(() => {
      // To the nearest pixel, like the reference: a view 372.4px tall gets a
      // 372px wrapper and its bottom hairline is shaved by a fraction.
      const target = Math.round(content.getBoundingClientRect().height);
      cancelAnimationFrame(pending);
      if (prefersReducedMotion()) {
        motion.set(target);
        return;
      }
      // The height starts a frame after the width does (open and close
      // alike), so the dock widens a beat before it grows or folds.
      pending = requestAnimationFrame((frame) => motion.to(target, target === 0 ? SPRING_FOLD : SPRING_GROW, frame));
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(pending);
      motion.stop();
    };
  }, []);

  /* on-screen keyboards ------------------------------------------------ */

  // Phones lay the keyboard over the page without moving fixed elements,
  // so the bar rides on top of the visual viewport instead, and its views
  // cap their height to the room that is left (--dock-room).
  useEffect(() => {
    const viewport = window.visualViewport;
    const dock = dockRef.current;
    if (!viewport || !dock) return;
    const update = () => {
      const zoomed = Math.abs(viewport.scale - 1) > 0.01;
      const lift = zoomed ? 0 : Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
      dock.style.setProperty("--dock-lift", `${lift}px`);
      dock.style.setProperty("--dock-room", `${Math.round(zoomed ? window.innerHeight : viewport.height)}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  /* opening and closing ------------------------------------------------ */

  function rememberFocus() {
    if (latest.current.open) return;
    const current = document.activeElement;
    returnFocus.current = current instanceof HTMLElement && current !== document.body ? current : null;
  }

  function show(next: Live, focus: "input" | "field" | "panel" | null = null) {
    rememberFocus();
    pendingFocus.current = focus;
    dispatch({ type: "show", live: next });
  }

  function openPalette(focus = true) {
    if (latest.current.open && latest.current.live.view === "palette") {
      if (focus) inputRef.current?.focus({ preventScroll: true });
      return;
    }
    show({ ...IDLE }, focus ? "input" : null);
  }

  /**
   * Open a view from outside the bar (page buttons, openCommand). Like the
   * reference, with a mouse or trackpad focus stays on the button that
   * opened it, so no field lights up; Tab goes straight into the panel.
   * Touch screens move focus to the panel itself (no keyboard pops up).
   */
  function openFromOutside(view: CommandView, prefill?: CommandPrefill) {
    if (view === "palette") return openPalette(true);
    show(viewLive(view, prefill ?? {}), finePointer() ? null : "panel");
  }

  /**
   * Fold the bar away. `restore` puts focus back where it was before the
   * bar opened (Esc, ×, "esc"); without it focus is left alone (a click
   * outside already moved it) unless `blur` lets go of it (navigation, so
   * keys on the next page do not land in the bar).
   */
  function close({ restore, blur = false }: { restore: boolean; blur?: boolean }) {
    if (!latest.current.open) return;
    dispatch({ type: "close" });
    const panel = panelRef.current;
    const target = returnFocus.current;
    returnFocus.current = null;
    const active = document.activeElement;
    const focusInside = active instanceof HTMLElement && Boolean(panel?.contains(active));
    if (!restore) {
      if (blur && focusInside) (active as HTMLElement).blur();
      return;
    }
    if (target && target.isConnected && !panel?.contains(target)) target.focus({ preventScroll: true });
    else if (target !== inputRef.current && focusInside) (active as HTMLElement).blur();
  }

  // Focus requests run once the view they point into has rendered.
  useEffect(() => {
    const want = pendingFocus.current;
    if (!want) return;
    pendingFocus.current = null;
    if (want === "input") {
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    if (want === "panel") {
      panelRef.current?.focus({ preventScroll: true });
      return;
    }
    // A frame later, so a form that fills itself in on mount has done so.
    requestAnimationFrame(() => {
      const slot = contentRef.current?.querySelector<HTMLElement>(":scope > div:not([inert])");
      const field = slot?.querySelector<HTMLElement>('input:not([type="checkbox"]):not([disabled]), textarea:not([disabled])');
      (field ?? inputRef.current)?.focus({ preventScroll: true });
    });
  });

  /* actions ------------------------------------------------------------ */

  const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? "auto" : "smooth");

  function goHome() {
    close({ restore: false, blur: true });
    if (latest.current.pathname !== "/") router.push("/");
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }

  function navigate(href: string) {
    close({ restore: false, blur: true });
    router.push(href);
  }

  function openLab() {
    close({ restore: false, blur: true });
    const section = latest.current.pathname === "/" ? document.getElementById("lab") : null;
    if (section) section.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    else router.push("/#lab");
  }

  function openProfile(view: PanelView) {
    const name = (Object.keys(SOCIAL_VIEWS) as Array<keyof typeof SOCIAL_VIEWS>).find((key) => SOCIAL_VIEWS[key] === view);
    const profile = site.socials.find((entry) => entry.name === name);
    if (!profile) return;
    window.open(profile.href, "_blank", "noopener,noreferrer");
    close({ restore: true });
  }

  function run(item: PaletteItem | undefined) {
    if (!item) return;
    if (item.kind === "project") return navigate(`/projects/${item.slug}/`);
    if (item.kind === "message") {
      const resolved = resolveQuery(latest.current.live.query);
      const parsed = "parsed" in resolved ? resolved.parsed : null;
      return show(viewLive("say-hi", { name: parsed?.name, email: parsed?.email, message: item.message }));
    }
    if (item.view === "home") return goHome();
    show(viewLive(item.view));
  }

  /** Enter while a view is open. */
  function runView(view: DockView) {
    switch (view) {
      case "home":
        return goHome();
      case "work":
        return navigate("/projects/");
      case "writing":
        return navigate("/writing/");
      case "lab":
        return openLab();
      case "github":
      case "x":
      case "instagram":
      case "spotify":
        return openProfile(view);
      case "book-call":
        if (!site.calLink) show(viewLive("say-hi"));
        return;
      case "say-hi":
      case "guestbook": {
        const slot = contentRef.current?.querySelector<HTMLElement>(":scope > div:not([inert])");
        const fields = [...(slot?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input:not([type=checkbox]), textarea") ?? [])];
        (fields.find((field) => !field.value.trim()) ?? fields[0])?.focus({ preventScroll: true });
        return;
      }
      default:
        return;
    }
  }

  /* listeners ---------------------------------------------------------- */

  // The latest handlers for listeners registered once.
  const handlers = useRef({ openPalette, openFromOutside, close });
  useLayoutEffect(() => {
    handlers.current = { openPalette, openFromOutside, close };
  });

  useEffect(
    () =>
      onCommand((event) => {
        if (event.type === "close") handlers.current.close({ restore: true });
        else handlers.current.openFromOutside(event.view, event.prefill);
      }),
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const isOpen = latest.current.open;
      const mod = event.metaKey || event.ctrlKey;
      if (event.key === "/" && !mod && !event.altKey && !isOpen && !isTypingTarget(event.target)) {
        event.preventDefault();
        handlers.current.openPalette(true);
        return;
      }
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        handlers.current.close({ restore: true });
        return;
      }
      // Tab from outside the open panel lands inside it.
      const panel = panelRef.current;
      if (event.key === "Tab" && panel && !panel.contains(document.activeElement)) {
        const nodes = focusablesIn(panel);
        if (nodes.length) {
          event.preventDefault();
          (event.shiftKey ? nodes[nodes.length - 1] : nodes[0]).focus({ preventScroll: true });
        }
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!latest.current.open) return;
      if (panelRef.current?.contains(event.target as Node)) return;
      handlers.current.close({ restore: false });
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  // Leaving the page (back/forward, a link elsewhere) folds the bar away.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    handlers.current.close({ restore: false });
  }, [pathname]);

  /* input -------------------------------------------------------------- */

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const { key } = event;
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === "/") {
        event.preventDefault();
        openPalette(true);
      }
      return;
    }
    const list = live.view === "palette" ? items : null;
    if (list && (key === "ArrowDown" || key === "ArrowUp")) {
      event.preventDefault();
      if (!list.length) return;
      const next = Math.min(list.length - 1, Math.max(0, live.active + (key === "ArrowDown" ? 1 : -1)));
      dispatch({ type: "active", index: next });
      return;
    }
    if (list && (key === "Home" || key === "End") && list.length) {
      event.preventDefault();
      dispatch({ type: "active", index: key === "Home" ? 0 : list.length - 1 });
      return;
    }
    if (key === "Enter") {
      event.preventDefault();
      if (list) run(list[live.active]);
      else runView(live.view);
    }
  }

  function onInputChange(value: string) {
    if (!open) rememberFocus();
    dispatch({ type: "show", live: fromQuery(value) });
  }

  /** Tab stays inside the open panel. */
  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !open || !panelRef.current) return;
    const nodes = focusablesIn(panelRef.current);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const current = document.activeElement;
    if (event.shiftKey && (current === first || current === panelRef.current)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  /* views -------------------------------------------------------------- */

  const closeRestoring = () => close({ restore: true });
  const closeForNavigation = () => close({ restore: false, blur: true });

  function renderView(entry: Entry) {
    const view = entry.frozen ?? live;
    switch (entry.view) {
      case "palette": {
        const list = entry.frozen ? paletteItems(view.query) : items;
        return (
          <Palette
            listId={entry.frozen ? `${listId}-out-${entry.key}` : listId}
            items={list}
            active={Math.min(view.active, Math.max(0, list.length - 1))}
            onActive={(index) => dispatch({ type: "active", index })}
            onRun={run}
          />
        );
      }
      case "say-hi":
        return (
          <SayHiPanel prefill={view.prefill} fromTyping={view.fromTyping} autoFocus={view.autoFocus} onClose={closeRestoring} />
        );
      case "book-call":
        return <BookCallPanel onClose={closeRestoring} onSayHi={() => show(viewLive("say-hi", {}, finePointer()))} />;
      case "guestbook":
        return (
          <GuestbookPanel
            prefill={{ name: view.prefill.name, message: view.prefill.message }}
            onClose={closeRestoring}
          />
        );
      case "work":
        return <WorkPanel onClose={closeRestoring} onNavigate={closeForNavigation} />;
      case "writing":
        return <WritingPanel onClose={closeRestoring} onNavigate={closeForNavigation} />;
      case "lab":
        return <LabPanel onClose={closeRestoring} onOpenLab={openLab} />;
      case "theme":
        return <ThemePanel onClose={closeRestoring} />;
      case "github":
        return <GitHubPanel onClose={closeRestoring} />;
      case "x":
      case "instagram":
      case "spotify":
        return <SocialPanel view={entry.view} onClose={closeRestoring} />;
      case "home":
        return <Panel title={VIEWS.home.title} description={VIEWS.home.description} icon="home" onClose={closeRestoring} />;
    }
  }

  /* render ------------------------------------------------------------- */

  const showEsc = open && (live.query !== "" || live.view !== "palette");
  const listOpen = open && live.view === "palette";
  const activeItem = listOpen ? items[Math.min(live.active, items.length - 1)] : undefined;
  const title = live.view === "palette" ? "Jump to" : VIEWS[live.view].title;
  const announcement = !open
    ? ""
    : live.view === "palette"
      ? live.query
        ? items.length
          ? `${items.length} ${items.length === 1 ? "result" : "results"}`
          : "No results"
        : ""
      : title;

  const chip =
    "flex h-7 items-center rounded-[10px] bg-well px-2.5 text-[11px] text-secondary transition-[opacity,scale,filter] duration-[280ms] ease-swap [grid-area:1/1] motion-reduce:transition-opacity";
  // The hidden chip is taken out of flow, so the slot (and the room left for
  // the input) is only as wide as the chip on show.
  const chipHidden =
    "pointer-events-none absolute end-0 top-0 scale-[0.25] opacity-0 blur-[4px] motion-reduce:scale-100 motion-reduce:blur-none";

  return (
    <div
      ref={dockRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex translate-y-[calc(-1*var(--dock-lift,0px))] justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6"
      style={{ viewTransitionName: "site-dock" }}
    >
      <div
        ref={panelRef}
        role={open ? "dialog" : undefined}
        aria-modal={open ? false : undefined}
        aria-label={open ? title : undefined}
        tabIndex={-1}
        data-open={open || undefined}
        onKeyDown={onPanelKeyDown}
        onPointerDown={(event) => {
          if (open || event.button !== 0) return;
          // A press anywhere on the closed pill opens it with the caret in the input.
          if (event.target !== inputRef.current) event.preventDefault();
          openPalette(true);
        }}
        className={cn(
          "pointer-events-auto max-w-full overflow-hidden rounded-[20px] bg-float shadow-float outline-none transition-[width] duration-[240ms] ease-out motion-reduce:transition-none",
          "[&:not([data-open]):has(input:focus-visible)]:outline-2 [&:not([data-open]):has(input:focus-visible)]:outline-offset-2 [&:not([data-open]):has(input:focus-visible)]:outline-primary [&:not([data-open]):has(input:focus-visible)]:outline-solid",
        )}
        style={{ width: open ? WIDTH_OPEN : WIDTH_CLOSED }}
      >
        <div ref={heightRef} className="overflow-hidden" style={{ height: 0 }}>
          <div ref={contentRef} className="relative">
            {state.entries.map((entry) => (
              <ViewSlot
                key={entry.key}
                leaving={Boolean(entry.frozen)}
                onExited={() => dispatch({ type: "exited", key: entry.key })}
              >
                {renderView(entry)}
              </ViewSlot>
            ))}
          </div>
        </div>

        <div className="flex h-12 items-center gap-x-3 ps-4 pe-2.5">
          <Logo className="size-4 text-primary" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Jump to"
            aria-expanded={listOpen}
            aria-controls={listOpen ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={activeItem ? optionId(listId, activeItem) : undefined}
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={open ? "try “hey, i’m ada, ada@mail.com, nice work”" : "Jump to…"}
            value={live.query}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            className="h-full min-w-0 flex-1 cursor-text bg-transparent text-[16px] text-primary outline-none placeholder:text-tertiary sm:text-[14px]"
          />
          <span className="relative grid shrink-0 justify-items-end">
            <button
              type="button"
              aria-label="Close bar"
              aria-keyshortcuts="Escape"
              aria-hidden={!showEsc || undefined}
              tabIndex={showEsc ? 0 : -1}
              onClick={() => close({ restore: true })}
              className={cn(
                chip,
                "cursor-pointer outline-none hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
                !showEsc && chipHidden,
              )}
            >
              esc
            </button>
            <kbd aria-hidden="true" className={cn(chip, "font-sans", showEsc && chipHidden)}>
              /
            </kbd>
          </span>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
