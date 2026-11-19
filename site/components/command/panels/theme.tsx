"use client";

// "Theme": small previews of the page in each palette (Light, AMOLED, Red
// Dragon) and a split one for "System" (light or AMOLED, the main dark
// palette, following the device). Same choices, in the same order, as the
// menu on the header's theme button.
//
// A radio group: Tab lands on the chosen card, the arrow keys (and Home /
// End) move and pick at once, as radios do. The chosen card wears a 2px
// ring in the text colour hugging the card and a check badge in its
// corner; keyboard focus is the --ring outline 4px out, so the two never
// look alike.

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { Check, Monitor, Moon, Sun } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  DEFAULT_DARK_PALETTE,
  PALETTES,
  paletteLabel,
  setTheme,
  useThemePreference,
  type Palette,
  type ThemeChoice,
} from "@/lib/theme";
import { VIEWS } from "../items";
import { Panel } from "./panel";

const swatchOf = (palette: Palette) => PALETTES.find((entry) => entry.id === palette)!.swatch;

function MiniPage({ palette }: { palette: Palette }) {
  const c = swatchOf(palette);
  const fill = (color: string): CSSProperties => ({ background: color });
  return (
    <span className="flex size-full flex-col gap-1.5 p-2.5" style={fill(c.bg)}>
      <span className="flex items-center gap-1">
        <span className="size-1.5 shrink-0 rounded-full" style={fill(c.main)} />
        <span className="h-1.5 w-8 max-w-full rounded-full" style={fill(c.text)} />
      </span>
      <span className="h-1 w-14 max-w-full rounded-full" style={fill(c.line)} />
      <span className="h-1 w-10 max-w-full rounded-full" style={fill(c.line)} />
      <span className="mt-auto h-5 w-full rounded-[5px]" style={fill(c.tile)} />
    </span>
  );
}

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string }> = [
  ...PALETTES.map(({ id, label }) => ({ value: id, label })),
  { value: "system", label: "System" },
];

/** What "System" shows: light, or the main dark palette on a dark device. */
const SYSTEM_LABEL = `System (light or ${paletteLabel(DEFAULT_DARK_PALETTE)}, following your device)`;

function OptionIcon({ value }: { value: ThemeChoice }) {
  if (value === "light") return <Sun size={13} />;
  if (value === "system") return <Monitor size={13} />;
  return <Moon size={13} />;
}

export function ThemePanel({ onClose }: { onClose: () => void }) {
  const info = VIEWS.theme;
  const current = useThemePreference();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  // The one in the tab order: the chosen card (the first if none matches).
  const tabStop = Math.max(
    0,
    OPTIONS.findIndex((option) => option.value === current),
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = OPTIONS.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    next = (next + OPTIONS.length) % OPTIONS.length;
    refs.current[next]?.focus();
    setTheme(OPTIONS[next].value);
  };

  return (
    <Panel title={info.title} description={info.description} icon="moon" onClose={onClose}>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4">
        {OPTIONS.map(({ value, label }, index) => {
          const selected = current === value;
          return (
            <button
              key={value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={index === tabStop ? 0 : -1}
              aria-label={value === "system" ? SYSTEM_LABEL : undefined}
              onClick={() => setTheme(value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="group cursor-pointer rounded-[14px] text-left outline-none"
            >
              <span
                className={cn(
                  "relative flex aspect-[4/3] overflow-hidden rounded-[14px] transition-shadow duration-200 ease-out group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ring",
                  selected
                    ? "shadow-[0_0_0_2px_var(--foreground)]"
                    : "shadow-lift group-hover:shadow-[0_0_0_1px_var(--tertiary)]",
                )}
              >
                {value === "system" ? (
                  <>
                    <span className="w-1/2 overflow-hidden">
                      <MiniPage palette="light" />
                    </span>
                    <span className="w-1/2 overflow-hidden">
                      <MiniPage palette={DEFAULT_DARK_PALETTE} />
                    </span>
                  </>
                ) : (
                  <MiniPage palette={value} />
                )}
                {/* The check badge: the solid-button colours, with a ring in
                    the panel colour so it reads on any preview. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute end-1.5 top-1.5 grid size-[18px] place-items-center rounded-full bg-ink text-on-ink shadow-[0_0_0_2px_var(--float)] transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none",
                    selected ? "opacity-100" : "scale-50 opacity-0",
                  )}
                >
                  <Check size={11} />
                </span>
              </span>
              <span
                className={cn(
                  "mt-2 flex items-center gap-1.5 px-0.5 text-[13px] transition-colors duration-150",
                  selected ? "font-medium text-primary" : "text-secondary group-hover:text-primary",
                )}
              >
                <OptionIcon value={value} />
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
