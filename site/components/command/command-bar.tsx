"use client";

// The Index: the site's command palette and the panels it opens
// (DESIGN.md → Shell → The Index).
//
// Nothing of it shows while it is closed. It opens from the Index pill in
// the top bar and the footer (both call openCommand() from lib/command.ts),
// from "/" outside a text field (handled here), from Ctrl/Cmd+K (handled
// by the header, which also calls openCommand), and from any page button
// with openCommand(view, prefill).
//
// Open, it is a native modal <dialog>: an arched paper sheet anchored near
// the top of the screen over a dimmed page. The browser keeps focus inside
// it and makes the page inert; Esc, the close button, a press outside the
// sheet or Ctrl/Cmd+K again close it, and focus goes back to whatever
// opened it. The sheet shows either the Index (a search field over a
// grouped list) or one panel: the contact sheet (Write a note / Book a
// call), the guestbook, the work, the lab, the writing, day & night,
// GitHub, X, Instagram, Spotify. Panels have a back arrow to the Index,
// which keeps what you had typed. On phones the sheet fills the screen,
// above the on-screen keyboard.
//
// Commands that work quietly (copy the address, switch to night, turn the
// single-key shortcuts off) close the Index and say what they did in a
// short echo under the Index pill (echo.tsx).

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { onCommand, type CommandPrefill, type CommandView } from "@/lib/command";
import { isTypingTarget, setSingleKeyShortcuts, useSingleKeyShortcuts } from "@/lib/shortcuts";
import { getResolvedTheme, toggleTheme, useResolvedTheme, useThemePreference } from "@/lib/theme";
import styles from "./command.module.css";
import { EchoToast, echo } from "./echo";
import {
  PANELS,
  SECTION_LABELS,
  buildEntries,
  panelKey,
  search as searchEntries,
  type Entry,
  type PageSection,
  type PanelView,
  type SheetView,
} from "./items";
import { playExit, playResize, prefersReducedMotion } from "./motion";
import { IndexView } from "./palette";
import { ContactPanel, copyText } from "./panels/contact";
import { GitHubPanel } from "./panels/github";
import { GuestbookPanel } from "./panels/guestbook";
import { LabPanel } from "./panels/lab";
import { SocialPanel } from "./panels/social";
import { ThemePanel } from "./panels/theme";
import { WorkPanel } from "./panels/work";
import { WritingPanel } from "./panels/writing";

/* ---------------------------------------------------------------------- */
/* state                                                                   */
/* ---------------------------------------------------------------------- */

type State = {
  open: boolean;
  view: SheetView;
  /** What is typed in the Index; kept while a panel is open, so Back returns to it. */
  query: string;
  active: number;
  prefill: CommandPrefill;
  /** The prefill was read from the typed query (the note shows what it picked up). */
  fromTyping: boolean;
  /** The note should put the caret in its first empty field when it mounts. */
  focusField: boolean;
};

const CLOSED: State = {
  open: false,
  view: "palette",
  query: "",
  active: 0,
  prefill: {},
  fromTyping: false,
  focusField: false,
};

type Action =
  | {
      type: "show";
      view: SheetView;
      prefill?: CommandPrefill;
      fromTyping?: boolean;
      focusField?: boolean;
      fresh?: boolean;
    }
  | { type: "tab"; view: "say-hi" | "book-call" }
  | { type: "query"; query: string }
  | { type: "active"; index: number }
  | { type: "closed" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "show": {
      const fresh = !state.open || action.fresh;
      return {
        open: true,
        view: action.view,
        query: fresh ? "" : state.query,
        active: fresh ? 0 : state.active,
        prefill: action.prefill ?? {},
        fromTyping: action.fromTyping ?? false,
        focusField: action.focusField ?? false,
      };
    }
    case "tab":
      return state.view === action.view ? state : { ...state, view: action.view };
    case "query":
      return { ...state, query: action.query, active: 0 };
    case "active":
      return action.index === state.active ? state : { ...state, active: action.index };
    case "closed":
      return CLOSED;
  }
}

/** Where focus goes once a view has rendered. */
type FocusTarget = "input" | "title" | "field" | "first";

/* ---------------------------------------------------------------------- */
/* helpers                                                                 */
/* ---------------------------------------------------------------------- */

const finePointer = () => window.matchMedia("(pointer: fine)").matches;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/** What Tab can reach inside the sheet, in order. */
function focusablesIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => element.tabIndex >= 0 && !element.closest("[inert], [aria-hidden='true']") && element.getClientRects().length > 0,
  );
}

const FORMS: ReadonlySet<PanelView> = new Set(["say-hi", "guestbook"]);
const LISTS: ReadonlySet<PanelView> = new Set(["work", "lab", "writing"]);

/** Focus for a panel opened from inside the Index (the visitor is already in the sheet). */
function focusFromIndex(view: PanelView): FocusTarget {
  if (FORMS.has(view)) return finePointer() ? "field" : "title";
  if (LISTS.has(view)) return "first";
  return "title";
}

const isHome = (pathname: string) => pathname === "/" || pathname === "";

/** The sections of the page, top to bottom, for "On this page". */
function readSections(pathname: string): PageSection[] {
  const home = isHome(pathname);
  const found: PageSection[] = [];
  for (const section of document.querySelectorAll<HTMLElement>("main section[id]")) {
    if (!section.getClientRects().length) continue;
    const heading =
      document.getElementById(`${section.id}-title`) ?? section.querySelector<HTMLElement>("h2, h1");
    const text = (heading?.textContent ?? "").replace(/\d+$/, "").replace(/[.\s]+$/, "").trim();
    const label = (home ? SECTION_LABELS[section.id] : undefined) ?? text;
    if (label && !found.some((entry) => entry.id === section.id)) found.push({ id: section.id, label });
  }
  // Pages without sections (a project, a lab piece): their headings.
  if (!found.length) {
    for (const heading of document.querySelectorAll<HTMLElement>("main h2[id]")) {
      const label = (heading.textContent ?? "").trim();
      if (label && heading.getClientRects().length) found.push({ id: heading.id, label });
    }
  }
  return found;
}

const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? "auto" : "smooth");

/** Scroll to a section of the page and hand focus to its heading. */
function goToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  history.replaceState(history.state, "", `#${id}`);
  const heading = /^H[1-6]$/.test(section.tagName)
    ? section
    : (document.getElementById(`${id}-title`) ?? section.querySelector<HTMLElement>("h2, h1"));
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

function goToTop() {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
  document.getElementById("main")?.focus({ preventScroll: true });
}

/* ---------------------------------------------------------------------- */
/* the sheet                                                               */
/* ---------------------------------------------------------------------- */

export function CommandBar() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const uid = useId();
  const titleId = `${uid}-title`;
  const listId = `${uid}-list`;
  const [state, dispatch] = useReducer(reducer, CLOSED);
  const [sections, setSections] = useState<PageSection[]>([]);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef<FocusTarget | null>(null);
  const afterClose = useRef<(() => void) | null>(null);
  const exiting = useRef(0);
  /** The sheet is open as far as closing is concerned (finishClose runs once per open). */
  const isShown = useRef(false);
  const pressedOutside = useRef(false);

  const dark = useResolvedTheme() === "dark";
  const theme = useThemePreference();
  const singleKeys = useSingleKeyShortcuts();

  const entries = useMemo(
    () => buildEntries({ pathname, sections, dark, theme, singleKeys }),
    [pathname, sections, dark, theme, singleKeys],
  );
  const results = useMemo(() => searchEntries(entries, state.query), [entries, state.query]);
  const active = Math.min(state.active, Math.max(0, results.flat.length - 1));

  // Latest values for listeners registered once.
  const latest = useRef({ state, pathname });
  useLayoutEffect(() => {
    latest.current = { state, pathname };
  });

  /* opening and closing ------------------------------------------------ */

  function show(
    view: SheetView,
    { prefill, fromTyping, focus, fresh }: { prefill?: CommandPrefill; fromTyping?: boolean; focus: FocusTarget; fresh?: boolean },
  ) {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (exiting.current) {
      // Asked to open again while the exit is playing: stay open.
      exiting.current = 0;
      afterClose.current = null;
      dialog.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    }
    if (!latest.current.state.open) {
      const current = document.activeElement;
      returnFocus.current = current instanceof HTMLElement && current !== document.body ? current : null;
    }
    isShown.current = true;
    if (view === "palette") setSections(readSections(latest.current.pathname));
    pendingFocus.current = focus;
    dispatch({ type: "show", view, prefill, fromTyping, fresh, focusField: focus === "field" });
  }

  /**
   * Close the sheet: a short exit, then the native close, then focus goes
   * back to what opened it and `after` runs (scroll to a section, echo a
   * message …).
   */
  async function close({ after, quick = false }: { after?: () => void; quick?: boolean } = {}) {
    const dialog = dialogRef.current;
    if (after) afterClose.current = after;
    if (!dialog?.open) {
      // Already closed by the browser (its "close" event still on its way).
      if (isShown.current) return finishClose();
      if (latest.current.state.open) dispatch({ type: "closed" });
      const run = afterClose.current;
      afterClose.current = null;
      run?.();
      return;
    }
    if (exiting.current) return;
    const token = Date.now();
    exiting.current = token;
    if (!quick) await playExit(dialog, sheetRef.current);
    if (exiting.current !== token) return;
    dialog.close();
    // Not waiting for the "close" event: a busy page can hold it back for
    // a second or more, and the page should come back at once.
    finishClose();
  }

  /** After the dialog has closed (by us, or by the browser on its own). */
  function finishClose() {
    if (!isShown.current) return;
    isShown.current = false;
    exiting.current = 0;
    dispatch({ type: "closed" });
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
    const run = afterClose.current;
    afterClose.current = null;
    run?.();
  }

  // Open the native dialog once the state says so (before focus is placed).
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !state.open || dialog.open) return;
    dialog.showModal();
  }, [state.open]);

  // Focus requests run once the view they point into has rendered.
  useLayoutEffect(() => {
    const want = pendingFocus.current;
    const sheet = sheetRef.current;
    if (!want || !state.open || !sheet) return;
    pendingFocus.current = null;
    const title = () => sheet.querySelector<HTMLElement>("[data-sheet-title]");
    if (want === "input") {
      inputRef.current?.focus({ preventScroll: true });
    } else if (want === "title") {
      title()?.focus({ preventScroll: true });
    } else if (want === "first") {
      const link = sheet.querySelector<HTMLElement>("[data-sheet-body] a[href], [data-sheet-body] button");
      (link ?? title())?.focus({ preventScroll: true });
    } else {
      // Forms fill themselves in on mount; the note places its own caret.
      title()?.focus({ preventScroll: true });
    }
  });

  // The sheet's height eases from one view to the next (desktop; on phones
  // it is the screen).
  const lastHeight = useRef(0);
  const lastView = useRef<SheetView | null>(null);
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!state.open || !sheet) {
      lastView.current = null;
      return;
    }
    if (lastView.current && lastView.current !== state.view && window.innerWidth >= 640) {
      playResize(sheet, lastHeight.current);
    }
    lastView.current = state.view;
  });
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!state.open || !sheet) return;
    const observer = new ResizeObserver(() => {
      lastHeight.current = sheet.getBoundingClientRect().height;
    });
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [state.open]);

  // While the sheet is open the page underneath keeps still: no scrolling,
  // and the scrollbar's width is made up so nothing shifts sideways.
  useEffect(() => {
    if (!state.open) return;
    const html = document.documentElement;
    // Only a classic scrollbar leaves a gap worth making up (on phones the
    // difference is page overflow, not a scrollbar).
    const classic = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const gap = classic ? Math.min(40, Math.max(0, window.innerWidth - html.clientWidth)) : 0;
    const before = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    html.style.overflow = "hidden";
    if (gap > 0) html.style.paddingRight = `${gap}px`;
    return () => {
      html.style.overflow = before.overflow;
      html.style.paddingRight = before.paddingRight;
    };
  }, [state.open]);

  // Phones lay the keyboard over the page: the sheet takes the room that
  // is left (--room) and rides along with the visual viewport (--room-top).
  useEffect(() => {
    const dialog = dialogRef.current;
    const viewport = window.visualViewport;
    if (!state.open || !dialog) return;
    const update = () => {
      const zoomed = !viewport || Math.abs(viewport.scale - 1) > 0.01;
      const room = zoomed ? window.innerHeight : viewport.height;
      dialog.style.setProperty("--room", `${Math.round(room)}px`);
      dialog.style.setProperty("--room-top", `${zoomed ? 0 : Math.round(viewport.offsetTop)}px`);
      // The visible width: a page that overflows sideways widens the layout
      // viewport on phones, and the sheet must still fit the screen.
      dialog.style.setProperty("--room-w", `${Math.round(zoomed ? document.documentElement.clientWidth : viewport.width)}px`);
      dialog.style.setProperty("--room-left", `${zoomed ? 0 : Math.round(viewport.offsetLeft)}px`);
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [state.open]);

  /* actions ------------------------------------------------------------ */

  function navigate(href: string) {
    router.push(href);
    void close();
  }

  function run(entry: Entry) {
    const action = entry.action;
    switch (action.type) {
      case "view":
        return show(action.view, { focus: focusFromIndex(action.view) });
      case "message":
        return show("say-hi", { prefill: action.prefill, fromTyping: true, focus: focusFromIndex("say-hi") });
      case "route":
        return navigate(action.href);
      case "external":
        window.open(action.href, "_blank", "noopener,noreferrer");
        return void close();
      case "section":
        return void close({ after: () => goToSection(action.id) });
      case "top":
        return void close({ after: goToTop });
      case "copy-email":
        // Copy while the press still counts as a user gesture, then say so.
        return void copyText(site.email).then((ok) =>
          close({
            after: () =>
              ok ? echo("Copied the address") : echo(`Could not reach the clipboard. The address is ${site.email}`, "error"),
          }),
        );
      case "toggle-theme": {
        const next = getResolvedTheme() === "dark" ? "day" : "night";
        return void close({
          after: () => {
            toggleTheme();
            // After the page's 360ms cross-fade: an echo born during the
            // view transition would not start its entrance.
            window.setTimeout(() => echo(`Switched to ${next}`), 420);
          },
        });
      }
      case "toggle-keys": {
        const on = !singleKeys;
        setSingleKeyShortcuts(on);
        return void close({
          after: () => echo(on ? "Single-key shortcuts on" : "Single-key shortcuts off. / and Ctrl K still open the index"),
        });
      }
    }
  }

  const back = () => show("palette", { focus: "input" });
  const closeRestoring = () => void close();

  /* listeners ---------------------------------------------------------- */

  const handlers = useRef({ show, close });
  useLayoutEffect(() => {
    handlers.current = { show, close };
  });

  useEffect(
    () =>
      onCommand((event) => {
        const { show, close } = handlers.current;
        if (event.type === "close") return void close();
        const view: CommandView = event.view;
        const { state } = latest.current;
        if (view === "palette") {
          // Ctrl/Cmd+K a second time closes the Index; from a panel it goes back to it.
          if (state.open && state.view === "palette") return void close();
          return show("palette", { focus: "input" });
        }
        // From a page button: with a mouse no field lights up; touch screens
        // get no keyboard either. Focus rests on the sheet's title.
        show(view, { prefill: event.prefill ?? {}, focus: "title", fresh: !state.open });
      }),
    [],
  );

  // "/" outside a text field opens the Index (Ctrl/Cmd+K is the header's).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (latest.current.state.open || isTypingTarget(event.target)) return;
      // Lab stages and games keep their own keys (as the single-key shortcuts do).
      if (event.target instanceof Element && event.target.closest("[data-lab-stage], [data-shortcuts='off']")) return;
      event.preventDefault();
      handlers.current.show("palette", { focus: "input" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Leaving the page (a link, back / forward) closes the sheet.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (latest.current.state.open) void handlers.current.close({ quick: true });
  }, [pathname]);

  /* views -------------------------------------------------------------- */

  function renderView() {
    const panel = { titleId, onBack: back, onClose: closeRestoring };
    switch (state.view) {
      case "palette":
        return (
          <IndexView
            titleId={titleId}
            listId={listId}
            inputRef={inputRef}
            search={results}
            query={state.query}
            active={active}
            onQuery={(query) => dispatch({ type: "query", query })}
            onActive={(index) => dispatch({ type: "active", index })}
            onRun={run}
            onClose={closeRestoring}
          />
        );
      case "say-hi":
      case "book-call":
        return (
          <ContactPanel
            {...panel}
            tab={state.view}
            onTab={(view) => dispatch({ type: "tab", view })}
            prefill={state.prefill}
            fromTyping={state.fromTyping}
            focusField={state.focusField}
          />
        );
      case "guestbook":
        return <GuestbookPanel {...panel} prefill={{ name: state.prefill.name, message: state.prefill.message }} />;
      case "work":
        return <WorkPanel {...panel} onNavigate={closeRestoring} />;
      case "lab":
        return <LabPanel {...panel} onNavigate={closeRestoring} />;
      case "writing":
        return <WritingPanel {...panel} onNavigate={closeRestoring} />;
      case "theme":
        return <ThemePanel {...panel} />;
      case "github":
        return <GitHubPanel {...panel} />;
      case "x":
      case "instagram":
      case "spotify":
        return <SocialPanel {...panel} view={state.view} />;
    }
  }

  /* render ------------------------------------------------------------- */

  const count = results.flat.length;
  const announcement =
    state.open && state.view === "palette" && state.query.trim()
      ? count
        ? `${count} ${count === 1 ? "result" : "results"}`
        : "No results"
      : "";

  return (
    <>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={state.open ? titleId : undefined}
        aria-label={state.open ? undefined : "Index"}
        onCancel={(event) => {
          event.preventDefault();
          void close();
        }}
        onClose={finishClose}
        onKeyDown={(event) => {
          // Tab cycles through the sheet instead of leaving for the browser's own controls.
          if (event.key !== "Tab" || !sheetRef.current) return;
          const nodes = focusablesIn(sheetRef.current);
          if (!nodes.length) return;
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          const current = document.activeElement;
          const inside = current instanceof HTMLElement && nodes.includes(current);
          if (event.shiftKey && (current === first || !inside)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && (current === last || !inside)) {
            event.preventDefault();
            first.focus();
          }
        }}
        onPointerDown={(event) => {
          pressedOutside.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (pressedOutside.current && event.target === event.currentTarget) void close();
          pressedOutside.current = false;
        }}
      >
        {state.open ? (
          <div ref={sheetRef} data-view={state.view} className={cn(styles.sheet, "sheet sheet-arch")}>
            <div key={panelKey(state.view)} className={styles.view}>
              {renderView()}
            </div>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {announcement}
            </p>
          </div>
        ) : null}
      </dialog>
      <EchoToast />
    </>
  );
}
