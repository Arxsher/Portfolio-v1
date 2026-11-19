"use client";

// "0042 views" above a project page's table of contents: the guestbook's
// odometer, counting this visit. Only there when Supabase is configured
// (lib/views.ts); if the count can't be loaded it quietly goes away.

import { useEffect, useState } from "react";
import { Odometer } from "@/components/guestbook/odometer";
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
    <p className="-ms-1.5 mb-7 text-[13px] text-tertiary">
      <Odometer value={views} className="mx-1.5" />
      views
    </p>
  );
}
