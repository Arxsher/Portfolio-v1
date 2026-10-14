"use client";

// "The lab": every piece as a small index row (numeral, the title in
// Fraunces, its one-line summary and its kind), each opening its page,
// and a way on to the lab itself.

import Link from "next/link";
import { pieces } from "@/components/lab/registry";
import { CATEGORY_SINGULAR } from "@/components/lab/types";
import { Arrow } from "@/components/ornament";
import { pad } from "@/lib/format";
import { PANELS } from "../items";
import { Panel, panelNameClass, panelRowClass, type PanelProps } from "./panel";

export function LabPanel({ titleId, onBack, onClose, onNavigate }: PanelProps & { onNavigate: () => void }) {
  const info = PANELS.lab;
  return (
    <Panel titleId={titleId} title={info.title} description={info.description} onBack={onBack} onClose={onClose}>
      <ol className="rule-ink">
        {pieces.map((piece, index) => (
          <li key={piece.slug} className="border-b border-line">
            <Link href={`/lab/${piece.slug}/`} onClick={onNavigate} className={panelRowClass}>
              <span className="numeral w-6 shrink-0 text-[14px]">{pad(index + 1)}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={panelNameClass}>{piece.title}</span>
                <span className="truncate text-[13.5px] text-muted">{piece.summary}</span>
              </span>
              <span className="caps shrink-0 text-muted max-sm:hidden">{CATEGORY_SINGULAR[piece.category]}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-5 flex justify-end">
        <Link href="/lab/" onClick={onNavigate} className="link-arrow focus-ring rounded-[4px]">
          Walk through the lab
          <Arrow />
        </Link>
      </p>
    </Panel>
  );
}
