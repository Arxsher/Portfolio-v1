"use client";

// The list view of the command bar: a listbox driven from the input.
// The input keeps focus and points at the active row with
// aria-activedescendant; arrows, Home/End and Enter are handled there
// (command-bar.tsx). Moving the pointer over a row makes it active.

import { useLayoutEffect, useRef } from "react";
import { Mail } from "@/components/icons";
import { ProjectIcon } from "@/components/project-icons";
import { cn } from "@/lib/cn";
import type { PaletteItem } from "./items";
import { Hairline, ViewIcon, columnStyle } from "./panels/panel";

export function optionId(listId: string, item: PaletteItem) {
  return `${listId}-${item.id}`;
}

function ItemIcon({ item }: { item: PaletteItem }) {
  if (item.kind === "view") return <ViewIcon name={item.icon} />;
  if (item.kind === "project") return <ProjectIcon slug={item.slug} className="size-3.5" />;
  return <Mail size={14} />;
}

export function Palette({
  listId,
  items,
  active,
  onActive,
  onRun,
}: {
  listId: string;
  items: PaletteItem[];
  active: number;
  onActive: (index: number) => void;
  onRun: (item: PaletteItem) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the active row inside the scroller (only moves when the keyboard
  // walks past an edge; a row under the pointer is already visible).
  useLayoutEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    const pad = 6;
    if (row.offsetTop - pad < list.scrollTop) list.scrollTop = row.offsetTop - pad;
    else if (row.offsetTop + row.offsetHeight + pad > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop + row.offsetHeight + pad - list.clientHeight;
    }
  }, [active, items]);

  return (
    <div className="w-full">
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Shortcuts"
        className="relative left-1/2 max-h-[min(50vh,380px,calc(var(--dock-room,100vh)_-_120px))] -translate-x-1/2 overflow-y-auto overscroll-contain p-1.5"
        style={columnStyle}
      >
        {items.length === 0 ? (
          <li role="presentation" className="px-3 py-3 text-[14px] text-tertiary">
            Nothing by that name. Try work, call or guestbook.
          </li>
        ) : (
          items.map((item, index) => (
            <li
              key={item.id}
              id={optionId(listId, item)}
              role="option"
              aria-selected={index === active}
              data-index={index}
              onPointerMove={() => {
                if (index !== active) onActive(index);
              }}
              onClick={() => onRun(item)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-[14px] py-1.5 ps-1.5 pe-3 text-left select-none transition-[background-color] duration-100",
                index === active && "bg-tile",
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-well text-primary">
                <ItemIcon item={item} />
              </span>
              <span className="min-w-0 flex-1 leading-[1.3]">
                <span className="block truncate text-[14px] text-primary">{item.title}</span>
                <span className="block truncate text-[12.5px] text-tertiary">{item.description}</span>
              </span>
            </li>
          ))
        )}
      </ul>
      <Hairline />
    </div>
  );
}
