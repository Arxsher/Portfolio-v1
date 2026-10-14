"use client";

// "Writing": the posts, newest first. Each row has the title and month on
// one line and where it lives under it; a last row opens the writing page.

import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "@/components/icons";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { formatMonthYear } from "@/lib/format";
import { VIEWS } from "../items";
import { Panel, panelRowClass } from "./panel";

const rowClass = cn(panelRowClass, "flex-col items-stretch gap-0.5");

function host(href: string) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

export function WritingPanel({ onClose, onNavigate }: { onClose: () => void; onNavigate: () => void }) {
  const info = VIEWS.writing;
  const posts = [...site.writing].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <Panel title={info.title} description={info.description} icon="doc" onClose={onClose}>
      <ul className="flex flex-col">
        {posts.map((post) => {
          const top = (
            <span className="flex items-baseline justify-between gap-4">
              <span className="min-w-0 truncate text-[14px] font-medium text-primary">{post.title}</span>
              <span className="shrink-0 text-[12px] text-tertiary tabular-nums">{formatMonthYear(post.date)}</span>
            </span>
          );
          return (
            <li key={post.href}>
              {post.external ? (
                <a href={post.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={rowClass}>
                  {top}
                  <span className="flex items-center gap-1 text-[13px] text-secondary">
                    <span className="truncate">On {host(post.href)}</span>
                    <ArrowUpRight size={12} className="text-tertiary" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </span>
                </a>
              ) : (
                <Link href={post.href} onClick={onNavigate} className={rowClass}>
                  {top}
                </Link>
              )}
            </li>
          );
        })}
        <li>
          <Link href="/writing/" onClick={onNavigate} className={rowClass}>
            <span className="flex items-baseline justify-between gap-4">
              <span className="text-[14px] font-medium text-primary">All writing</span>
              <ChevronRight size={13} className="self-center text-tertiary" />
            </span>
            <span className="text-[13px] text-secondary">The writing page, with everything in one list.</span>
          </Link>
        </li>
      </ul>
    </Panel>
  );
}
