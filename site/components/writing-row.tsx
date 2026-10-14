// The writing index, used by the home page (Four · Writing) and /writing/
// (DESIGN.md → Writing). Each post is one big row, numbered like an issue:
//
//   ───────────────────────────────────────────────────────────────── ink rule
//   N°1   Artificial General Intelligence                          ( ↗ )
//         May 4, 2026 · agi-frontier.vercel.app
//   ───────────────────────────────────────────────────────────────── hairline
//
// The number is italic Fraunces in terracotta, counted from the oldest post
// (the first one written is N°1). On hover or focus the title turns italic
// cobalt and the round arrow fills with ink. Posts hosted elsewhere open in
// a new tab and show where they live. Rows carry data-row for j / k.

import Link from "next/link";
import { Arrow } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

export type WritingPost = {
  readonly title: string;
  /** ISO date, e.g. "2026-05-04". */
  readonly date: string;
  readonly href: string;
  /** Hosted on another site: opens in a new tab. */
  readonly external?: boolean;
};

/** Newest first. Dates are ISO strings, so they sort as text. */
export function sortPosts(posts: ReadonlyArray<WritingPost>): WritingPost[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** "https://agi-frontier.vercel.app/" → "agi-frontier.vercel.app". */
function hostOf(href: string): string | null {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function WritingList({
  posts,
  limit,
  className,
}: {
  posts: ReadonlyArray<WritingPost>;
  /** Show only the newest `limit` posts. */
  limit?: number;
  className?: string;
}) {
  const sorted = sortPosts(posts);
  const shown = sorted.slice(0, limit);
  if (shown.length === 0) {
    return (
      <div className={cn("rule-ink border-b border-line py-10", className)}>
        <p className="serif-italic text-title-2 text-primary">Nothing on the shelf yet.</p>
        <p className="mt-3 text-copy text-body">The first essay will be listed here as soon as it is out.</p>
      </div>
    );
  }
  return (
    <ol className={cn("rule-ink", className)}>
      {shown.map((post, index) => (
        <WritingRow key={post.href} post={post} number={sorted.length - index} />
      ))}
    </ol>
  );
}

const rowClass = cn(
  "group grid items-center text-primary focus-ring-far",
  // phones: the number on its own line, then title and arrow
  "grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-4 py-7",
  // from md: number · title · arrow on one line
  "md:grid-cols-[120px_minmax(0,1fr)_auto] md:gap-x-10 md:py-[clamp(28px,4vw,44px)]",
);

export function WritingRow({ post, number }: { post: WritingPost; number: number }) {
  const host = post.external ? hostOf(post.href) : null;
  const body = (
    <>
      <span
        aria-hidden="true"
        className="col-span-2 serif-italic text-[56px] leading-[0.8] text-terra-fill md:col-span-1 md:text-[72px]"
      >
        <span className="me-0.5 align-top font-sans text-[0.3em] not-italic font-semibold tracking-[0.04em] text-muted">
          N°
        </span>
        {number}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-title-1 text-pretty break-words transition-colors duration-300 ease-out group-hover:turn group-focus-visible:turn">
          {post.title}
        </span>
        <span className="mt-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-small text-muted">
          <time dateTime={post.date} className="tabular-nums">
            {formatDate(post.date)}
          </time>
          {host ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{host}</span>
            </>
          ) : null}
          {post.external ? <span className="sr-only">(opens in a new tab)</span> : null}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[52px] shrink-0 place-items-center rounded-full border border-line-firm text-primary md:size-16",
          "transition-[background-color,border-color,color] duration-300 ease-out",
          "group-hover:border-ink group-hover:bg-ink group-hover:text-on-ink",
          "group-focus-visible:border-ink group-focus-visible:bg-ink group-focus-visible:text-on-ink",
        )}
      >
        <Arrow
          external={post.external}
          className={
            post.external
              ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5"
              : "group-hover:translate-x-1 group-focus-visible:translate-x-1"
          }
        />
      </span>
    </>
  );

  return (
    <li className="border-b border-line">
      {post.external ? (
        <a href={post.href} target="_blank" rel="noopener noreferrer" data-row="" className={rowClass}>
          {body}
        </a>
      ) : (
        <Link href={post.href} data-row="" className={rowClass}>
          {body}
        </Link>
      )}
    </li>
  );
}
