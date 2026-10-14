"use client";

// "Theme": three small previews of the page, light, dark and split for
// "system". The chosen one wears a 2px ring; picking applies at once.

import type { CSSProperties } from "react";
import { Moon, Sun } from "@/components/icons";
import { cn } from "@/lib/cn";
import { setTheme, useThemePreference, type Theme } from "@/lib/theme";
import { VIEWS } from "../items";
import { Panel } from "./panel";

/** The two palettes drawn in the previews (the site's own light and dark colours). */
const SWATCH = {
  light: { page: "#fbfbfb", title: "#171717", line: "#e4e4e4", block: "#f2f2f2" },
  dark: { page: "#1a1a1a", title: "#f2f2f2", line: "#3a3a3a", block: "#262626" },
} as const;

function MiniPage({ tone }: { tone: keyof typeof SWATCH }) {
  const c = SWATCH[tone];
  const fill = (color: string): CSSProperties => ({ background: color });
  return (
    <span className="flex size-full flex-col gap-1.5 p-2.5" style={fill(c.page)}>
      <span className="h-1.5 w-8 rounded-full" style={fill(c.title)} />
      <span className="h-1 w-14 max-w-full rounded-full" style={fill(c.line)} />
      <span className="h-1 w-10 max-w-full rounded-full" style={fill(c.line)} />
      <span className="mt-auto h-5 w-full rounded-[5px]" style={fill(c.block)} />
    </span>
  );
}

const OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemePanel({ onClose }: { onClose: () => void }) {
  const info = VIEWS.theme;
  const current = useThemePreference();

  return (
    <Panel title={info.title} description={info.description} icon="moon" onClose={onClose}>
      <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value, label }) => {
          const selected = current === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(value)}
              className="group cursor-pointer rounded-[14px] text-left outline-none"
            >
              <span
                className={cn(
                  "flex aspect-[4/3] overflow-hidden rounded-[14px] transition-shadow duration-200 ease-out group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary",
                  selected
                    ? "shadow-[0_0_0_2px_var(--foreground)]"
                    : "shadow-lift group-hover:shadow-[0_0_0_1px_var(--tertiary)]",
                )}
              >
                {value === "system" ? (
                  <>
                    <span className="w-1/2 overflow-hidden">
                      <MiniPage tone="light" />
                    </span>
                    <span className="w-1/2 overflow-hidden">
                      <MiniPage tone="dark" />
                    </span>
                  </>
                ) : (
                  <MiniPage tone={value} />
                )}
              </span>
              <span
                className={cn(
                  "mt-2 flex items-center gap-1.5 px-0.5 text-[13px] transition-colors duration-150",
                  selected ? "text-primary" : "text-secondary group-hover:text-primary",
                )}
              >
                {value === "light" ? <Sun size={13} /> : value === "dark" ? <Moon size={13} /> : null}
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
