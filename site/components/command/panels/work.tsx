"use client";

// "Work": every project as a two-column grid of tiles (one column on
// phones), each opening its page, plus a last cell for the full list.

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "@/components/icons";
import { ProjectIcon } from "@/components/project-icons";
import { projects } from "@/content/site";
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

export function WorkPanel({ onClose, onNavigate }: { onClose: () => void; onNavigate: () => void }) {
  const info = VIEWS.work;
  return (
    <Panel title={info.title} description={info.description} icon="folder" onClose={onClose}>
      <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-x-3">
        {projects.map((project) => (
          <Row
            key={project.slug}
            href={`/projects/${project.slug}/`}
            title={project.name}
            description={project.tagline}
            icon={<ProjectIcon slug={project.slug} className="size-5 text-primary" />}
            onNavigate={onNavigate}
          />
        ))}
        <Row
          href="/projects/"
          title="All work"
          description="Every project, with the details."
          icon={<ChevronRight size={18} className="text-secondary" />}
          onNavigate={onNavigate}
        />
      </ul>
    </Panel>
  );
}
