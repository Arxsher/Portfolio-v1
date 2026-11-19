"use client";

// "The lab": every piece as a two-column grid of rows (one column on
// phones), numbered like the lab's list view, each opening its page, plus
// a last row for the lab index.

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "@/components/icons";
import { pieces } from "@/components/lab/registry";
import { pad } from "@/lib/format";
import { VIEWS } from "../items";
import { Panel, panelRowClass } from "./panel";

function Row({
  href,
  title,
  description,
  icon,
  onNavigate,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link href={href} onClick={onNavigate} className={panelRowClass}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-tile">{icon}</span>
        <span className="min-w-0 flex-1 leading-[1.35]">
          <span className="block truncate text-[14px] font-medium text-primary">{title}</span>
          <span className="block truncate text-[13px] text-secondary">{description}</span>
        </span>
      </Link>
    </li>
  );
}

export function LabPanel({ onClose, onNavigate }: { onClose: () => void; onNavigate: () => void }) {
  const info = VIEWS.lab;
  return (
    <Panel title={info.title} description={info.description} icon="sparkle" onClose={onClose}>
      <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-x-3">
        {pieces.map((piece, index) => (
          <Row
            key={piece.slug}
            href={`/lab/${piece.slug}/`}
            title={piece.title}
            description={piece.summary}
            icon={<span className="text-[12px] font-medium text-secondary tabular-nums">{pad(index + 1)}</span>}
            onNavigate={onNavigate}
          />
        ))}
        <Row
          href="/lab/"
          title="All pieces"
          description="The whole lab, by category."
          icon={<ChevronRight size={18} className="text-secondary" />}
          onNavigate={onNavigate}
        />
      </ul>
    </Panel>
  );
}
