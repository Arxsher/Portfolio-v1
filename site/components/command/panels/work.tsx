"use client";

// "The work": every project as a row of the big-type index, small (the
// numeral, the name in Fraunces turning italic cobalt with its row, the
// category and the year, "Now" in green while it is being built), and a
// way on to the full list.

import Link from "next/link";
import { Arrow } from "@/components/ornament";
import { categoryLabel, projectYear } from "@/components/project-row";
import { projects } from "@/content/site";
import { pad } from "@/lib/format";
import { PANELS } from "../items";
import { Panel, panelNameClass, panelRowClass, type PanelProps } from "./panel";

export function WorkPanel({ titleId, onBack, onClose, onNavigate }: PanelProps & { onNavigate: () => void }) {
  const info = PANELS.work;
  return (
    <Panel titleId={titleId} title={info.title} description={info.description} onBack={onBack} onClose={onClose}>
      <ol className="rule-ink">
        {projects.map((project, index) => {
          const year = projectYear(project.date);
          return (
            <li key={project.slug} className="border-b border-line">
              <Link href={`/projects/${project.slug}/`} onClick={onNavigate} className={panelRowClass}>
                <span className="numeral w-6 shrink-0 text-[14px]">{pad(index + 1)}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className={panelNameClass}>{project.name}</span>
                  <span className="caps truncate text-muted sm:ms-auto">{categoryLabel(project.category)}</span>
                </span>
                <span className="caps w-11 shrink-0 text-end tabular-nums">
                  {year ? <span className="text-primary">{year}</span> : <span className="text-green">Now</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 flex justify-end">
        <Link href="/projects/" onClick={onNavigate} className="link-arrow focus-ring rounded-[4px]">
          All work, in full
          <Arrow />
        </Link>
      </p>
    </Panel>
  );
}
