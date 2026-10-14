// Section and page headings (DESIGN.md → Headings).
//
// A home-page section:
//
//   ✦────────────────────────────────────────────────────────────
//   TWO · WORK                                  Products, platforms and
//   Selected work¹⁰                             experiments …
//                                               All work →
//
// a star rule, an optional terracotta kicker, the title in Fraunces with an
// optional italic turn in cobalt, a quiet count, and an aside with a note
// and a way onward. Sections are spaced by --section-gap, so a page is a
// list of <Section>s. The original API (id, label, count?, action?) still
// works: without `title` the label becomes the title.
//
//   <Section id="work" label="work" count={10} action={{ label: "All work", href: "/projects/" }}>
//   <Section id="work" label="work" numeral="Two" title="Selected" turn="work" count={10} badge
//            note="Products, platforms and experiments." action={…}>
//
// Inner pages use <PageHeader> (an h1 with the same anatomy).

import Link from "next/link";
import type { ReactNode } from "react";
import { Arrow, StarBadge, StarRule } from "@/components/ornament";
import { cn } from "@/lib/cn";

export type SectionAction = {
  label: string;
  href: string;
  /** Opens in a new tab and shows ↗ instead of →. */
  external?: boolean;
};

export type SectionProps = {
  id: string;
  /** Short name of the section ("work", "GitHub"). The title when `title` is not given; part of the kicker otherwise. */
  label: string;
  /** Numbers (or digit strings) show as a small terracotta count after the title; other strings ("544 this year") go in the aside. */
  count?: number | string;
  action?: SectionAction;
  className?: string;
  children?: ReactNode;
  /** Written-out section number for the kicker: "Two" → "Two · Work". */
  numeral?: string;
  /** Serif title; defaults to the label with a capital. */
  title?: string;
  /** The italic second half of the title, in cobalt: title="Selected" turn="work". */
  turn?: string;
  /** One or two lines beside the title. */
  note?: ReactNode;
  /** Set the count in a terracotta star. Work and Lab only (DESIGN.md: restraint). */
  badge?: boolean;
  /** The star rule above the heading (default true). */
  rule?: boolean;
};

/** Kept for older call sites: the class of the "All work →" link. */
export const sectionActionClass = "link-arrow focus-ring rounded-[4px]";

const capitalise = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

function splitCount(count: number | string | undefined): { number?: number; text?: string } {
  if (count === undefined || count === "") return {};
  if (typeof count === "number") return { number: count };
  const trimmed = count.trim();
  if (/^\d+$/.test(trimmed)) return { number: Number(trimmed) };
  return { text: trimmed };
}

export function Section({
  id,
  label,
  count,
  action,
  className,
  children,
  numeral,
  title,
  turn,
  note,
  badge,
  rule,
}: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className={cn("section", className)}>
      <SectionHeader
        id={titleId}
        label={label}
        count={count}
        action={action}
        numeral={numeral}
        title={title}
        turn={turn}
        note={note}
        badge={badge}
        rule={rule}
      />
      <div>{children}</div>
    </section>
  );
}

/** The heading block on its own, for sections built by hand. */
export function SectionHeader({
  id,
  label,
  count,
  action,
  numeral,
  title,
  turn,
  note,
  badge = false,
  rule = true,
  as: Tag = "h2",
  size = "section",
}: {
  id?: string;
  label: string;
  count?: number | string;
  action?: SectionAction;
  numeral?: string;
  title?: string;
  turn?: string;
  note?: ReactNode;
  badge?: boolean;
  rule?: boolean;
  as?: "h1" | "h2";
  size?: "section" | "page";
}) {
  const heading = title ?? capitalise(label);
  const kicker = numeral ? `${numeral} · ${capitalise(label)}` : title ? capitalise(label) : null;
  const { number, text } = splitCount(count);
  const hasAside = Boolean(note || text || action);

  return (
    <header className={size === "page" ? "page-head" : "section-head"}>
      {rule ? <StarRule /> : null}
      <div className="section-head__grid" data-aside={hasAside ? "" : undefined}>
        <div className="min-w-0">
          {kicker ? (
            <p className="kicker mb-2" aria-hidden={Tag === "h2" ? true : undefined}>
              {kicker}
            </p>
          ) : null}
          <Tag
            id={id}
            className={cn(
              "section-head__title font-display",
              size === "page" ? "text-display-3" : "text-display-2",
            )}
          >
            {heading}
            {turn ? (
              <>
                {" "}
                <em className="turn">{turn}</em>
              </>
            ) : null}
            {number !== undefined ? (
              badge ? (
                <StarBadge label={` (${number})`}>{number}</StarBadge>
              ) : (
                <span className="section-head__count">
                  <span className="sr-only"> (</span>
                  {number}
                  <span className="sr-only">)</span>
                </span>
              )
            ) : null}
          </Tag>
        </div>
        {hasAside ? (
          <div className="section-head__aside">
            {text ? <p className="caps text-terra">{text}</p> : null}
            {note ? <div className="text-[15px] leading-[1.55] text-muted">{note}</div> : null}
            {action ? <SectionLink {...action} /> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function SectionLink({ label, href, external }: SectionAction) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={sectionActionClass}>
        {label}
        <Arrow external />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={sectionActionClass}>
      {label}
      <Arrow />
    </Link>
  );
}

export type Crumb = { label: string; href?: string };

/**
 * The heading of an inner page (Work, Lab, Writing, Guestbook, a project, a
 * piece, the 404): star rule, a trail or kicker in terracotta caps, an h1
 * in Fraunces with an optional italic turn, a lede, and an optional aside
 * (a fiche, actions …) on the right from 768px.
 *
 *   <PageHeader trail={[{ label: "Work", href: "/projects/" }, { label: "AegiLabs" }]}
 *               title="AegiLabs" lede="AI agents for workflow automation" />
 *   <PageHeader kicker="Lab" title="Pieces drawn" turn="in code" count={9} lede="…" />
 */
export function PageHeader({
  title,
  turn,
  lede,
  kicker,
  trail,
  count,
  aside,
  id = "page-title",
  className,
}: {
  title: string;
  turn?: string;
  lede?: ReactNode;
  kicker?: string;
  trail?: Crumb[];
  count?: number;
  aside?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <header className={cn("page-head", className)}>
      <StarRule />
      <div className="section-head__grid" data-aside={aside ? "" : undefined}>
        <div className="min-w-0">
          {trail && trail.length ? (
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="kicker flex flex-wrap items-center gap-x-2 gap-y-1">
                {trail.map((crumb, index) => {
                  const last = index === trail.length - 1;
                  return (
                    <li key={`${index}-${crumb.label}`} className="flex items-center gap-2">
                      {index > 0 ? (
                        <span aria-hidden="true" className="text-line-firm">
                          /
                        </span>
                      ) : null}
                      {crumb.href && !last ? (
                        <Link
                          href={crumb.href}
                          className="rounded-[4px] underline decoration-transparent underline-offset-[3px] transition-colors duration-200 hover:decoration-current focus-ring"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span aria-current={last ? "page" : undefined} className={last ? "text-muted" : undefined}>
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : kicker ? (
            <p className="kicker mb-3">{kicker}</p>
          ) : null}
          <h1 id={id} className="section-head__title font-display text-display-3">
            {title}
            {turn ? (
              <>
                {" "}
                <em className="turn">{turn}</em>
              </>
            ) : null}
            {count !== undefined ? (
              <span className="section-head__count">
                <span className="sr-only"> (</span>
                {count}
                <span className="sr-only">)</span>
              </span>
            ) : null}
          </h1>
          {lede ? <div className="page-lede mt-5">{lede}</div> : null}
        </div>
        {aside ? <div className="section-head__aside">{aside}</div> : null}
      </div>
    </header>
  );
}
