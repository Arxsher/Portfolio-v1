"use client";

// The top bar (DESIGN.md → Shell → Top bar). Sticky, sand, 64px:
//
//   ✦ Zakaria  arsher        Work  Lab  Writing  Guestbook        [✦ Index /]  ☼
//
// Left, the star mark and the name (home). Centre, the sections: on the
// home page they scroll to #work, #lab, #writing, #guestbook and follow
// the reading position (scroll-spy: the current one is ink with a small
// terracotta star under it); elsewhere they link to /projects/, /lab/,
// /writing/, /guestbook/ and mark the section you are in. Right, the
// Index button (the visible way into the command palette: it calls
// openCommand() from lib/command.ts) and the day/night switch.
//
// Once the page scrolls the bar turns solid with a hairline, and a
// terracotta hairline along its bottom edge fills with reading progress.
// It also installs the site's keyboard shortcuts (lib/shortcuts.ts):
// Ctrl/Cmd+K opens the Index; t, j/k, g g and G unless turned off.
// "/" is handled by the command bar itself.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Crescent, SunStar } from "@/components/icons";
import { Logo } from "@/components/logo";
import { Star } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { openCommand } from "@/lib/command";
import { setSingleKeyShortcuts, useModKey, useSingleKeyShortcuts, useSiteShortcuts } from "@/lib/shortcuts";
import { syncTheme, toggleTheme, useResolvedTheme } from "@/lib/theme";

type NavItem = { id: string; label: string; href: string; segment: string };

/** The sections, in page order. `id` is the home-page anchor, `segment` the route. */
export const NAV: readonly NavItem[] = [
  { id: "work", label: "Work", href: "/projects/", segment: "projects" },
  { id: "lab", label: "Lab", href: "/lab/", segment: "lab" },
  { id: "writing", label: "Writing", href: "/writing/", segment: "writing" },
  { id: "guestbook", label: "Guestbook", href: "/guestbook/", segment: "guestbook" },
];

const SEGMENTS = new Set(NAV.map((item) => item.segment));

type Where = { home: boolean; segment: string | null; exact: boolean };

function decode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

// Unknown addresses resolve to "nowhere", whatever their depth: the
// exported 404.html is rendered once and then hydrates on every missing
// URL, so its markup must not depend on the path.
function whereIs(pathname: string, pages: Record<string, string>): Where {
  const parts = pathname.split("/").filter(Boolean).map(decode);
  if (parts.length === 0) return { home: true, segment: null, exact: false };
  const [first, second, ...rest] = parts;
  if (!SEGMENTS.has(first) || rest.length > 0) return { home: false, segment: null, exact: false };
  if (!second) return { home: false, segment: first, exact: true };
  if (!pages[`${first}/${second}`]) return { home: false, segment: null, exact: false };
  return { home: false, segment: first, exact: false };
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll to a home section and hand focus to its heading. */
function goToSection(id: string): boolean {
  const section = document.getElementById(id);
  if (!section) return false;
  section.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  history.replaceState(history.state, "", `#${id}`);
  const heading = document.getElementById(`${id}-title`) ?? section.querySelector<HTMLElement>("h2, h1");
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  return true;
}

export function Header({
  name,
  handle,
  pages = {},
}: {
  /** The name by the mark (site.name). Optional for older call sites. */
  name?: string;
  /** site.handle, shown small after the name on wide screens. */
  handle: string;
  /** Titles of known detail pages keyed by "segment/slug", e.g. { "projects/aegilabs": "AegiLabs" }. */
  pages?: Record<string, string>;
}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const where = whereIs(pathname, pages);
  const barRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [spy, setSpy] = useState<string | null>(null);

  useSiteShortcuts();

  // React's dev remount resets <html> attributes set by the inline script.
  useLayoutEffect(() => {
    syncTheme();
  }, []);

  // Scrolled state, reading progress and (on the home page) scroll-spy.
  useEffect(() => {
    const bar = barRef.current;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      bar?.toggleAttribute("data-scrolled", y > 8);
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressRef.current?.style.setProperty("--progress", progress.toFixed(4));
      if (!where.home) return;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
      const line = window.innerHeight * 0.38;
      let current: string | null = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section.id;
      }
      // At the very bottom the last section is the one being read.
      if (max > 0 && y >= max - 2 && sections.length) current = sections[sections.length - 1].id;
      setSpy(NAV.some((item) => item.id === current) ? current : null);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [where.home]);

  const onHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!where.home || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    history.replaceState(history.state, "", "/");
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <header ref={barRef} className="site-bar">
      <div className="frame grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Link
          href="/"
          onClick={onHomeClick}
          aria-current={where.home ? "page" : undefined}
          className="group inline-flex min-w-0 items-center gap-2.5 justify-self-start rounded-[8px] text-primary focus-ring"
        >
          <Logo size={20} className="text-cobalt" />
          <span className="font-display text-[21px] leading-none font-[500] tracking-[-0.01em] [font-variation-settings:'SOFT'_100,'WONK'_0]">
            {name ?? handle}
          </span>
          {name ? (
            <span className="hidden translate-y-px text-[13px] text-muted sm:inline">{handle}</span>
          ) : null}
          <span className="sr-only">, home</span>
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const current = where.home ? spy === item.id : where.segment === item.segment;
            const ariaCurrent = current ? (where.home ? "location" : where.exact ? "page" : "true") : undefined;
            if (where.home) {
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={ariaCurrent}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    if (!goToSection(item.id)) router.push(item.href);
                  }}
                  className="site-nav__link focus-ring"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link key={item.id} href={item.href} aria-current={ariaCurrent} className="site-nav__link focus-ring">
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 justify-self-end sm:gap-2">
          <IndexButton />
          <ThemeToggle />
        </div>
      </div>
      <span ref={progressRef} aria-hidden="true" className="site-bar__progress" />
    </header>
  );
}

function ThemeToggle() {
  const dark = useResolvedTheme() === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to day" : "Switch to night"}
      title={dark ? "Day (t)" : "Night (t)"}
      suppressHydrationWarning
      className="relative grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-full border border-transparent text-body transition-[border-color,color,scale] duration-200 ease-out hover:border-line-firm hover:text-primary active:scale-[0.94] focus-ring pointer-coarse:size-11"
    >
      {/* Which icon shows is decided by the `dark` class in CSS, so the
          right one is visible before hydration. */}
      <span className="grid place-items-center">
        <span className="theme-icon" data-icon="sun" data-keep-transition="">
          <SunStar size={18} />
        </span>
        <span className="theme-icon" data-icon="moon" data-keep-transition="">
          <Crescent size={18} />
        </span>
      </span>
    </button>
  );
}

/**
 * The visible way into the Index (the command palette): "✦ Index /" in the
 * bar, "✦ Open the index /" in the footer. Calls openCommand("palette").
 * The keycap hint hides on touch screens.
 */
export function IndexButton({ variant = "bar" }: { variant?: "bar" | "footer" }) {
  const mod = useModKey();
  return (
    <button
      type="button"
      onClick={() => openCommand("palette")}
      aria-haspopup="dialog"
      aria-keyshortcuts="/ Control+K Meta+K"
      title={`Open the index (/ or ${mod} K)`}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center rounded-pill border border-line-firm text-primary",
        "transition-[border-color,background-color,scale] duration-200 ease-out hover:border-primary active:scale-[0.97] focus-ring",
        variant === "bar"
          ? "h-[38px] gap-2.5 bg-paper/60 ps-3 pe-3 text-[14px] font-[550] hover:bg-paper sm:pe-2 pointer-coarse:pe-3"
          : "h-9 gap-2 bg-transparent ps-3 pe-3 text-[13.5px] font-[500] sm:pe-2 pointer-coarse:pe-3",
      )}
    >
      <Star size={variant === "bar" ? 12 : 11} className="text-terra-fill" />
      {variant === "bar" ? "Index" : "Open the index"}
      <span aria-hidden="true" className="keys-hint hidden sm:inline-flex">
        <kbd className="kbd">/</kbd>
      </span>
    </button>
  );
}

/**
 * The footer colophon's keymap, with the switch for the single-key
 * shortcuts (WCAG 2.1.4). Hidden on touch screens.
 */
export function KeyMap() {
  const on = useSingleKeyShortcuts();
  const mod = useModKey();
  const keys: Array<[string[], string]> = [
    [["/"], "index"],
    [[mod, "K"], "index"],
    [["t"], "day / night"],
    [["j", "k"], "rows"],
    [["g", "g"], "top"],
  ];
  return (
    <div className="keys-hint flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-muted max-sm:hidden">
      <span className="caps">Keys</span>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Keyboard shortcuts">
        {keys.map(([combo, label], index) => {
          const single = combo.length === 1 ? combo[0] !== "/" : combo[0] !== mod;
          return (
            <li
              key={index}
              className={cn(
                "inline-flex items-center gap-1.5 transition-opacity duration-200",
                single && !on && "opacity-45",
              )}
            >
              {combo.map((key, keyIndex) => (
                <kbd key={keyIndex} className="kbd">
                  {key}
                </kbd>
              ))}
              <span>{label}</span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setSingleKeyShortcuts(!on)}
        className="group inline-flex cursor-pointer items-center gap-2 rounded-[6px] text-primary focus-ring"
      >
        <span className="underline decoration-line-firm underline-offset-[3px] transition-colors duration-200 group-hover:decoration-current">
          Single-key shortcuts
        </span>
        <span
          aria-hidden="true"
          className="relative h-[16px] w-[28px] rounded-full border border-line-firm bg-wash transition-colors duration-200 group-aria-checked:border-green group-aria-checked:bg-green/25"
        >
          <span className="absolute top-[2px] left-[2px] size-[10px] rounded-full bg-muted transition-[translate,background-color] duration-300 ease-out group-aria-checked:translate-x-[12px] group-aria-checked:bg-green" />
        </span>
      </button>
    </div>
  );
}
