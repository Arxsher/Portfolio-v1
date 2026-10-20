"use client";

// The two actions in the "Contact" row of the home intro facts list:
//
//   Say hi ›     Book a call ›
//
// Plain underlined text in the foreground colour, like the other links in
// the intro, each with a trailing chevron. They open the matching panel of
// the floating command bar (components/command/command-bar.tsx).

import { ChevronRight } from "@/components/icons";
import { openCommand, type CommandView } from "@/lib/command";

const ACTIONS: readonly { view: CommandView; label: string }[] = [
  { view: "say-hi", label: "Say hi" },
  { view: "book-call", label: "Book a call" },
];

export function ContactActions() {
  return (
    <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {ACTIONS.map((action) => (
        <button
          key={action.view}
          type="button"
          onClick={() => openCommand(action.view)}
          className="group/action -my-1.5 inline-flex cursor-pointer items-center gap-0.5 rounded-[4px] py-1.5 whitespace-nowrap text-primary focus-ring"
        >
          <span className="link group-hover/action:decoration-current">{action.label}</span>
          <ChevronRight
            size={12}
            className="text-tertiary transition-[translate,color] duration-150 ease-out group-hover/action:translate-x-0.5 group-hover/action:text-primary rtl:rotate-180 rtl:group-hover/action:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/action:translate-x-0"
          />
        </button>
      ))}
    </span>
  );
}
