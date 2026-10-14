// Footer: mark + copyright (and a quiet credit) on the left, the "/" hint on
// the right (hidden on small screens, where there's no keyboard).

import { Logo } from "@/components/logo";
import { site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();
  const credit = "credit" in site ? site.credit : undefined;

  return (
    <footer className="mt-auto flex items-center justify-between gap-4 pt-24 pb-2 text-[13px] text-tertiary">
      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex items-center gap-2 tabular-nums">
          <Logo className="size-3.5 text-primary" />
          <span>
            © {year} {site.handle}
          </span>
        </span>
        {credit ? (
          <>
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
            <a
              href={credit.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[6px] text-tertiary transition-colors duration-150 ease-out hover:text-primary focus-ring"
            >
              {credit.label}
            </a>
          </>
        ) : null}
      </p>
      <p className="hidden shrink-0 sm:block">
        Press <kbd className="kbd">/</kbd> to jump anywhere
      </p>
    </footer>
  );
}
