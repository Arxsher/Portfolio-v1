// Footer: mark + copyright on the left, the "/" hint on
// the right (hidden on small screens, where there's no keyboard).

import { Logo } from "@/components/logo";
import { site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto flex items-center justify-between gap-4 pt-24 pb-2 text-[13px] text-tertiary">
      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex items-center gap-2 tabular-nums">
          <Logo className="size-3.5 text-primary" />
          <span>
            © {year} {site.handle}
          </span>
        </span>
      </p>
      <p className="hidden shrink-0 sm:block">
        Press <kbd className="kbd">/</kbd> to jump anywhere
      </p>
    </footer>
  );
}
