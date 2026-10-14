"use client";

// The "Views" line of a project page's fiche: this visit is counted and the
// total shows in terracotta Fraunces numerals. Only there when Supabase is
// configured (lib/views.ts); if the count can't be loaded the line quietly
// goes away. Renders a <div><dt/><dd/></div>, so place it inside the fiche's <dl>.

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";
import { recordView, viewsEnabled } from "@/lib/views";

export function ProjectViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!viewsEnabled) return;
    let alive = true;
    recordView(slug).then(
      (total) => alive && setViews(total),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [slug]);

  if (!viewsEnabled || failed) return null;
  return (
    <div>
      <dt>Views</dt>
      <dd>
        {views === null ? (
          <>
            <span aria-hidden="true" className="skeleton inline-block h-[1.1em] w-12 rounded-key align-[-0.2em]" />
            <span className="sr-only">Counting…</span>
          </>
        ) : (
          <span className="numeral animate-fade-in text-[18px] leading-none tabular-nums">{formatNumber(views)}</span>
        )}
      </dd>
    </div>
  );
}
