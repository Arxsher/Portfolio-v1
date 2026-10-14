"use client";

// "Writing": the essays, newest first, as numbered rows ("N° 1" in italic
// terracotta Fraunces, the title, the date and where it lives), and a way
// on to the writing page.

import Link from "next/link";
import { Arrow } from "@/components/ornament";
import { site } from "@/content/site";
import { formatMonthYear } from "@/lib/format";
import { PANELS } from "../items";
import { Panel, panelNameClass, panelRowClass, type PanelProps } from "./panel";

function host(href: string) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

export function WritingPanel({
  titleId,
  onBack,
  onClose,
  onNavigate,
}: PanelProps & { onNavigate: () => void }) {
  const info = PANELS.writing;
  const posts = [...site.writing].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <Panel titleId={titleId} title={info.title} description={info.description} onBack={onBack} onClose={onClose}>
      <ol className="rule-ink">
        {posts.map((post, index) => {
          const body = (
            <>
              <span className="serif-italic w-14 shrink-0 text-[26px] leading-none whitespace-nowrap text-terra-fill">
                N°&nbsp;{posts.length - index}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={`${panelNameClass} whitespace-normal`}>{post.title}</span>
                <span className="text-[13.5px] text-muted">
                  {formatMonthYear(post.date, "long")}
                  {post.external ? ` · ${host(post.href)}` : ""}
                </span>
              </span>
              {post.external ? (
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center self-center rounded-full border border-line-firm transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-on-ink"
                >
                  <Arrow external />
                </span>
              ) : null}
            </>
          );
          return (
            <li key={post.href} className="border-b border-line">
              {post.external ? (
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className={`${panelRowClass} items-start py-4`}
                >
                  {body}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <Link href={post.href} onClick={onNavigate} className={`${panelRowClass} items-start py-4`}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-5 flex justify-end">
        <Link href="/writing/" onClick={onNavigate} className="link-arrow focus-ring rounded-[4px]">
          The writing page
          <Arrow />
        </Link>
      </p>
    </Panel>
  );
}
