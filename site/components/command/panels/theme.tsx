"use client";

// "Day & night": three small sheets of the site's own paper, sand by day,
// indigo ink by night, and the two cut on the diagonal for "system". The
// chosen one wears a 2px ink ring; choosing applies at once (the page
// cross-fades behind the sheet).

import { Crescent, Monitor, SunStar } from "@/components/icons";
import { Star } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { palette, type PaletteTheme } from "@/lib/palette";
import { setTheme, useThemePreference, type Theme } from "@/lib/theme";
import { PANELS } from "../items";
import { Panel, type PanelProps } from "./panel";

/** A little page in one palette: a title with its italic turn, two lines, a star. */
function MiniPage({ tone }: { tone: PaletteTheme }) {
  const p = palette[tone];
  return (
    <span className="flex size-full flex-col justify-between p-3" style={{ background: p.ground }}>
      <span className="font-display text-[22px] leading-none tracking-[-0.02em]" style={{ color: p.ink }}>
        Aa
        <span className="serif-italic" style={{ color: p.cobalt }}>
          a
        </span>
      </span>
      <span className="flex items-end justify-between gap-2">
        <span className="flex flex-1 flex-col gap-1">
          <span className="h-[3px] w-4/5 rounded-full opacity-45" style={{ background: p.body }} />
          <span className="h-[3px] w-3/5 rounded-full opacity-45" style={{ background: p.body }} />
        </span>
        <Star size={11} style={{ color: p.terraFill }} />
      </span>
    </span>
  );
}

const OPTIONS: ReadonlyArray<{ value: Theme; label: string; note: string }> = [
  { value: "light", label: "Day", note: "Sand paper" },
  { value: "dark", label: "Night", note: "Indigo ink" },
  { value: "system", label: "System", note: "As your device" },
];

export function ThemePanel({ titleId, onBack, onClose }: PanelProps) {
  const info = PANELS.theme;
  const current = useThemePreference();

  return (
    <Panel titleId={titleId} title={info.title} description={info.description} onBack={onBack} onClose={onClose}>
      <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-3 sm:gap-4">
        {OPTIONS.map(({ value, label, note }) => {
          const selected = current === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(value)}
              className="group cursor-pointer rounded-paper text-left outline-none"
            >
              <span
                className={cn(
                  "relative flex aspect-[4/3] overflow-hidden rounded-paper transition-shadow duration-200 ease-out",
                  "group-focus-visible:outline-2 group-focus-visible:outline-offset-3 group-focus-visible:outline-cobalt group-focus-visible:outline-solid",
                  selected
                    ? "shadow-[0_0_0_2px_var(--foreground)]"
                    : "shadow-[0_0_0_1px_var(--line-firm)] group-hover:shadow-[0_0_0_1px_var(--foreground)]",
                )}
              >
                {value === "system" ? (
                  <>
                    <span className="absolute inset-0">
                      <MiniPage tone="light" />
                    </span>
                    <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
                      <MiniPage tone="dark" />
                    </span>
                  </>
                ) : (
                  <MiniPage tone={value} />
                )}
              </span>
              <span className="mt-2.5 flex items-center gap-1.5 px-0.5 text-[14.5px] font-[550] text-primary">
                <span aria-hidden="true" className={cn("transition-colors", selected ? "text-cobalt" : "text-muted")}>
                  {value === "light" ? <SunStar size={14} /> : value === "dark" ? <Crescent size={14} /> : <Monitor size={14} />}
                </span>
                {label}
              </span>
              <span className="block px-0.5 text-caption text-muted">{note}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
