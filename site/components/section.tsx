// A home-page section: the quiet header row
//
//   work / 06 ............................................ All work ›
//
// followed by the content. Sections sit 80px apart (mt-20) and the content
// starts 16px under the header row, so a page is just a list of <Section>s.

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight } from "@/components/icons";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";

export type SectionAction = {
  label: string;
  href: string;
  /** Opens in a new tab and shows ↗ instead of ›. */
  external?: boolean;
};

export type SectionProps = {
  id: string;
  label: string;
  /** Numbers are zero-padded to two digits ("06"); strings show as given ("2,388 this year"). */
  count?: number | string;
  action?: SectionAction;
  className?: string;
  children?: ReactNode;
};

export const sectionActionClass =
  "-my-1.5 ms-auto inline-flex shrink-0 items-center gap-0.5 rounded-[6px] py-1.5 text-[13px] text-tertiary outline-none transition-colors duration-150 ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function Section({ id, label, count, action, className, children }: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className={cn("mt-20", className)}>
      <SectionHeader id={titleId} label={label} count={count} action={action} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** The header row on its own, for pages that need it outside a <Section>. */
export function SectionHeader({
  id,
  label,
  count,
  action,
}: {
  id?: string;
  label: string;
  count?: number | string;
  action?: SectionAction;
}) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <h2 id={id} className="lowercase text-secondary">
        {label}
      </h2>
      {count !== undefined && count !== "" ? (
        <span className="text-tertiary tabular-nums">
          <span aria-hidden="true" className="me-2 opacity-60">
            /
          </span>
          {typeof count === "number" ? pad(count, 2) : count}
        </span>
      ) : null}
      {action ? <SectionLink {...action} /> : null}
    </div>
  );
}

function SectionLink({ label, href, external }: SectionAction) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={sectionActionClass}>
        {label}
        <ArrowUpRight size={13} />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={sectionActionClass}>
      {label}
      <ChevronRight size={13} />
    </Link>
  );
}
