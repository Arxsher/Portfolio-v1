"use client";

// Site header: mark + handle on the left (with a breadcrumb trail on inner
// pages), the theme switch on the right. Rendered once by app/layout.tsx; the
// trail is derived from the URL so pages don't have to pass anything.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeSwitch } from "@/components/theme-switch";

type Crumb = { label: string; href?: string };

/** First URL segment → breadcrumb label. Only real routes belong here (an
    unknown one renders the 404 page); add new top-level routes as they land. */
const SECTIONS: Record<string, string> = {
  projects: "work",
  lab: "lab",
  writing: "writing",
  guestbook: "guestbook",
};

const NOT_FOUND: Crumb[] = [{ label: "page not found" }];

function decode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

// Any unknown address gets the same single crumb, whatever its depth: the
// exported 404.html is rendered once (as /_not-found) and then hydrates on
// every missing URL, so its markup must not depend on the path.
function crumbsFor(pathname: string, names: Record<string, string>): Crumb[] {
  const parts = pathname.split("/").filter(Boolean).map(decode);
  if (parts.length === 0) return [];
  const [first, second, ...rest] = parts;
  const section = SECTIONS[first];
  if (!section || rest.length > 0) return NOT_FOUND;
  if (!second) return [{ label: section }];
  const name = names[`${first}/${second}`];
  if (!name) return NOT_FOUND;
  return [{ label: section, href: `/${first}/` }, { label: name }];
}

export function Header({
  handle,
  pages = {},
}: {
  /** The name next to the mark (site.handle). Passed in so this client
      component doesn't pull the whole content module into the bundle. */
  handle: string;
  /** Titles of known detail pages keyed by "segment/slug", e.g. { "projects/aegilabs": "AegiLabs", "lab/macropad": "Macropad" }. */
  pages?: Record<string, string>;
}) {
  const pathname = usePathname() ?? "/";
  const crumbs = crumbsFor(pathname, pages);
  const atHome = crumbs.length === 0;

  return (
    <header className="flex items-center justify-between gap-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-x-1.5 text-[15px]">
        <Link
          href="/"
          aria-current={atHome ? "page" : undefined}
          className="-ms-2 inline-flex shrink-0 items-center gap-2 rounded-pill px-2 py-1.5 font-medium text-primary transition-[scale,background-color] duration-150 ease-out hover:bg-well active:scale-[0.96] focus-ring"
        >
          <Logo className="size-4 text-primary" />
          {handle}
        </Link>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <span
              key={`${index}-${crumb.label}`}
              className={last ? "flex min-w-0 items-center gap-1.5" : "flex shrink-0 items-center gap-1.5"}
            >
              <span aria-hidden="true" className="text-tertiary/60">
                /
              </span>
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="shrink-0 rounded-[8px] px-1 text-secondary transition-colors duration-150 hover:text-primary focus-ring"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate px-1 text-secondary">
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
      {/* the theme toggle is the lab's Daylight switch (components/theme-switch.tsx) */}
      <ThemeSwitch />
    </header>
  );
}
