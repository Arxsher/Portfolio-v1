"use client";

// Home page "paper planes": the guestbook as a calm band of sky where every
// visitor's note drifts by, folded into a plane. Catch one to unfold it and
// read it; "Fold a plane" opens the send flow in the command bar. Entries
// load in the browser; with none (or no Supabase yet) a single dashed
// outline invites the first one. Never any made-up planes.

import { useGuestbook } from "@/components/guestbook/data";
import { PlaneSkyBand } from "@/components/guestbook/sky";
import { Section } from "@/components/section";

// Enough for the biggest home sky (see skyCapacity in planes/sky.ts).
const SHOWN = 14;

export function Guestbook() {
  const { status, entries, count, enabled, retry } = useGuestbook(SHOWN);
  return (
    <Section
      id="guestbook"
      label="paper planes"
      count={enabled && count !== null ? `${count} sent` : undefined}
      action={{ label: "See them all", href: "/guestbook/" }}
    >
      <PlaneSkyBand kind="home" entries={entries} status={status} onRetry={retry} />
    </Section>
  );
}
