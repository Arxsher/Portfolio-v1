// Post list used by the home page (writing section) and /writing:
//
//   Title of the post ─────────────────────────────────────── May 2026
//
// A thin leader line runs from the title to the date. Hovering a row (with
// a fine pointer) fades the other rows back, darkens the leader and lifts
// the date to the foreground colour. Posts hosted elsewhere open in a new
// tab, and a small ↗ slides in where the leader starts.

import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatMonthYear } from "@/lib/format";

export type WritingPost = {
  readonly title: string;
  /** ISO date, e.g. "2026-05-04". */
  readonly date: string;
  readonly href: string;
  /** Hosted on another site: opens in a new tab. */
  readonly external?: boolean;
};

/** Only mice and trackpads get the fade; touch has no hover to anchor it. */
const dimOthers =
  "[@media(hover:hover)_and_(pointer:fine)]:[&:has(>li:hover)>li:not(:hover)]:opacity-45";

const rowClass =
  "group flex items-baseline gap-3 rounded-[8px] py-2.5 focus-ring-far";

/** Newest first. Dates are ISO strings, so they sort as text. */
export function sortPosts(posts: ReadonlyArray<WritingPost>): WritingPost[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
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
  const shown = sortPosts(posts).slice(0, limit);
  if (shown.length === 0) {
    return <p className={cn("py-2.5 text-[15px] text-tertiary", className)}>Nothing published yet.</p>;
  }
  return (
    <ul className={cn(dimOthers, className)}>
      {shown.map((post) => (
        <WritingRow key={post.href} post={post} />
      ))}
    </ul>
  );
}

export function WritingRow({ post }: { post: WritingPost }) {
  const body = (
    <>
      <span className="min-w-0 text-pretty text-primary">
        {post.title}
        {post.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </span>
      <Leader external={post.external} />
      <time
        dateTime={post.date}
        className="shrink-0 text-[14px] text-tertiary tabular-nums transition-[color] duration-200 group-hover:text-primary"
      >
        {formatMonthYear(post.date)}
      </time>
    </>
  );

  return (
    <li className="transition-opacity duration-200 ease-out">
      {post.external ? (
        <a href={post.href} target="_blank" rel="noopener noreferrer" className={rowClass}>
          {body}
        </a>
      ) : (
        <Link href={post.href} className={rowClass}>
          {body}
        </Link>
      )}
    </li>
  );
}

/**
 * The line between title and date. It is an empty box whose bottom border
 * sits on the text baseline (flex baseline alignment), nudged up 4px to the
 * middle of the lowercase letters. For external posts the ↗ waits at its
 * start and the line pulls back 18px to make room for it on hover. The
 * glyph's ink is 6px wide inside its 12px box (3px in on each side), so
 * the box sits 3px left of the leader start: 12px gap, ink, 12px gap, line.
 */
function Leader({ external }: { external?: boolean }) {
  return (
    <span aria-hidden="true" className="relative min-w-8 flex-1 -translate-y-1">
      <span
        className={cn(
          "block border-b border-line-firm transition-[border-color,clip-path] duration-200 group-hover:border-tertiary",
          external && "[clip-path:inset(-1px_0_-1px_0)] group-hover:[clip-path:inset(-1px_0_-1px_18px)]",
        )}
      />
      {external ? (
        <ArrowUpRight
          size={12}
          className="absolute top-1/2 left-0 -translate-x-[5px] -translate-y-1/2 text-primary opacity-0 transition-[opacity,translate] duration-200 ease-out group-hover:-translate-x-[3px] group-hover:opacity-100"
        />
      ) : null}
    </span>
  );
}
