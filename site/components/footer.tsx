// The footer: always night (DESIGN.md → Shell → Footer). A deep indigo
// block with a faint scatter of stars, on every page and in both themes:
//
//   Made in                               INDEX         ELSEWHERE
//   Casablanca.                           Work          GitHub ↗
//   الدار البيضاء                          Lab · 9       X ↗ …
//   On the Atlantic coast · 33.57° N …    Writing
//   ──────────────────────────────────────────────────────────────
//   Keys  / index  ⌘ K index  t day/night  j k rows  g g top   [switch]
//   © 2026 Zakaria (arsher). … · Lab format inspired by anishfn   [✦ Open the index /]
//
// No frieze here: the one zellige band belongs to the home hero.

import Link from "next/link";
import { IndexButton, KeyMap } from "@/components/header";
import { pieces } from "@/components/lab/registry";
import { Arrow } from "@/components/ornament";
import { site } from "@/content/site";

const footLink =
  "inline-flex items-center gap-2.5 rounded-[6px] py-[3px] font-display text-[20px] leading-[1.3] text-primary [font-variation-settings:'SOFT'_100,'WONK'_0] transition-colors duration-200 ease-out hover:turn focus-visible:turn focus-ring";

export function Footer() {
  const year = new Date().getFullYear();
  const credit = "credit" in site ? site.credit : undefined;
  const index = [
    { label: "Work", href: "/projects/" },
    { label: `Lab · ${pieces.length}`, href: "/lab/" },
    { label: "Writing", href: "/writing/" },
    { label: "Guestbook", href: "/guestbook/" },
  ];

  return (
    <footer className="night site-foot">
      <div className="frame pt-[clamp(56px,7vw,96px)] pb-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,0.6fr)] md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-[clamp(44px,6vw,80px)] leading-[0.95] font-[340] tracking-[-0.035em] text-primary italic [font-variation-settings:'SOFT'_100,'WONK'_1]">
              Made in
              <br />
              Casablanca.
            </p>
            <p className="mt-4 w-fit text-[clamp(26px,3vw,36px)] leading-[1.3] text-terra">
              <span lang="ar" dir="rtl">
                الدار البيضاء
              </span>
              <span className="sr-only">, Casablanca in Arabic</span>
            </p>
            <p className="mt-5 text-[14.5px] leading-[1.7] text-muted">
              On the Atlantic coast · 33.57° N, 7.59° W
              <br />
              {site.name} · {site.title.toLowerCase()}
            </p>
          </div>

          <nav aria-labelledby="foot-index">
            <h2 id="foot-index" className="caps mb-3.5 text-muted">
              Index
            </h2>
            <ul className="grid gap-1">
              {index.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="foot-elsewhere">
            <h2 id="foot-elsewhere" className="caps mb-3.5 text-muted">
              Elsewhere
            </h2>
            <ul className="grid gap-1">
              {site.socials.map((social) => (
                <li key={social.name}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className={footLink}>
                    {social.name}
                    <Arrow external className="opacity-60" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${site.email}`} className={footLink}>
                  Email
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-[clamp(48px,6vw,80px)] flex flex-col gap-5 border-t border-line pt-5">
          <KeyMap />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13.5px] text-muted">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="tabular-nums">
                © {year} {site.name} ({site.handle}). Arches, zellige and dusk drawn in code.
              </span>
              {credit ? (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="max-sm:hidden">
                    ·
                  </span>
                  <a
                    href={credit.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[4px] underline decoration-line-firm underline-offset-[3px] transition-colors duration-200 hover:text-primary hover:decoration-current focus-ring"
                  >
                    {credit.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </span>
              ) : null}
            </p>
            <IndexButton variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
