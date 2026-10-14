"use client";

// The floating stage controls: paper pills that rest on the stage over a
// piece, in the site's own material (DESIGN.md → Lab → Control trays):
// warm paper at 90% with a little blur, a hairline ring and a soft drop,
// 32px controls (40px on touch screens), small-caps labels, round glaze
// swatches with an ink ring, ink pills for the chosen option, sliders with
// an ink thumb on a cobalt track, keycap steppers and a cobalt focus ring.
//
//   <StageControls placement="top">
//     <Tray>
//       <Swatches label="Palette" options={PALETTES} value={palette} onChange={setPalette} />
//     </Tray>
//   </StageControls>
//   <StageControls placement="bottom">
//     <Tray>
//       <Stepper label="Rosette" value={fold} min={8} max={16} step={4} onChange={setFold} />
//       <TrayDivider />
//       <MuteButton />
//     </Tray>
//     <StageHint>Click to re-glaze</StageHint>
//   </StageControls>
//
// Every control works with mouse, touch and keyboard and carries proper
// roles: Swatches and Segmented are radio groups (arrow keys move and
// select), Stepper is a spinbutton (↑ ↓ PageUp PageDown Home End), Slider
// is a slider, Toggle a switch. Controls are 32px tall inside a 40px tray
// (40px in a 48px tray on touch screens). Everything inside StageControls /
// Tray is marked data-lab-controls, so usePointer() on the piece below
// ignores presses that start on them. On the piece page the stage's top
// edge is domed: top placements read --lab-dome (set by the stage) to keep
// clear of it.

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { toggleMuted, useMuted } from "./audio";
import { Minus, Plus, Return, SpeakerOff, SpeakerOn } from "./lab-icons";

/* ---------------------------------------------------------------------- */
/* shared styles                                                           */
/* ---------------------------------------------------------------------- */

const css = `
@keyframes lab-roll-up { from { translate: 0 60%; opacity: 0; } }
@keyframes lab-roll-down { from { translate: 0 -60%; opacity: 0; } }
.lab-roll[data-dir="up"] { animation: lab-roll-up 280ms var(--ease-out) both; }
.lab-roll[data-dir="down"] { animation: lab-roll-down 280ms var(--ease-out) both; }
.lab-key {
  border: 1px solid var(--line-firm);
  border-bottom-width: 2px;
  background-color: color-mix(in oklab, var(--background) 70%, var(--paper));
  transition: translate 120ms var(--ease-out), border-bottom-width 120ms var(--ease-out),
    color 160ms var(--ease-out), border-color 160ms var(--ease-out);
}
.lab-key:hover:not(:disabled) {
  border-color: color-mix(in oklab, var(--foreground) 45%, transparent);
  color: var(--foreground);
}
.lab-key:active:not(:disabled) {
  translate: 0 1px;
  border-bottom-width: 1px;
}
@media (prefers-reduced-motion: reduce) {
  .lab-roll[data-dir] { animation: none; }
}
`;

/** Rendered by the tray components; React hoists it once into <head>. */
function UIStyles() {
  return (
    <style href="lab-ui" precedence="default">
      {css}
    </style>
  );
}

/** The tray surface: a paper pill at 90% with a little blur, a hairline ring and a soft warm drop. */
export const trayClass =
  "pointer-events-auto flex max-w-full items-center gap-0.5 rounded-pill bg-paper/90 p-1 text-[13px] text-primary backdrop-blur-md backdrop-saturate-[1.2] shadow-[0_0_0_1px_var(--line),0_1px_0_rgb(var(--shadow-rgb)/var(--shadow-a1)),0_14px_32px_-16px_rgb(var(--shadow-rgb)/var(--shadow-a2))]";

/** Focus: the site's cobalt ring, kept inside the tray's padding. */
const focusClass = "outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--focus)";

/** A 32px control inside a tray (40px on touch screens). */
const controlBase = cn(
  "relative inline-flex h-8 shrink-0 cursor-pointer select-none items-center justify-center rounded-pill transition-[background-color,color,scale,opacity] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 pointer-coarse:h-10",
  focusClass,
);
/** Quiet look: secondary glyph, a wash of ink on hover. */
const controlQuiet = "text-secondary hover:bg-wash hover:text-primary";

const labelClass = "caps shrink-0 whitespace-nowrap ps-3 pe-1.5 text-muted";

const trackFill = "bg-line-firm";

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

export type Placement = "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

// Top placements step down under the stage's dome (--lab-dome is its
// height, 0 everywhere else): most in the corners, a little in the middle
// (on phones the middle keeps level with the corners).
const placementClass: Record<Placement, string> = {
  top: "top-[calc(var(--lab-dome,0px)*0.85+12px)] inset-x-3 justify-center sm:top-[calc(var(--lab-dome,0px)*0.3+16px)]",
  bottom: "bottom-3 inset-x-3 justify-center sm:bottom-4",
  "top-left":
    "top-[calc(var(--lab-dome,0px)*0.85+12px)] start-3 justify-start sm:top-[calc(var(--lab-dome,0px)*0.85+16px)] sm:start-4",
  "top-right":
    "top-[calc(var(--lab-dome,0px)*0.85+12px)] end-3 justify-end sm:top-[calc(var(--lab-dome,0px)*0.85+16px)] sm:end-4",
  "bottom-left": "bottom-3 start-3 justify-start sm:bottom-4 sm:start-4",
  "bottom-right": "bottom-3 end-3 justify-end sm:bottom-4 sm:end-4",
};

/**
 * Positions one or more trays (and a StageHint) over the stage, 16px from
 * the chosen edge (12px on phones). Empty space between trays lets pointer
 * events through to the piece.
 */
export function StageControls({
  placement = "bottom",
  label,
  className,
  children,
}: {
  placement?: Placement;
  /** Accessible name for the group, e.g. "Palette". */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const vertical = placement.startsWith("bottom") ? "flex-col-reverse" : "flex-col";
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      data-lab-controls=""
      className={cn(
        "pointer-events-none absolute z-10 flex items-center gap-2",
        vertical,
        placement.endsWith("left") && "items-start",
        placement.endsWith("right") && "items-end",
        placementClass[placement],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A row of trays inside StageControls (wraps on narrow stages). */
export function TrayRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("pointer-events-none flex max-w-full flex-wrap items-center justify-center gap-2", className)}>
      {children}
    </div>
  );
}

/**
 * The paper control pill. Give it a `placement` to position it on its own,
 * or put it inside <StageControls>.
 */
export function Tray({
  placement,
  label,
  className,
  style,
  children,
}: {
  placement?: Placement;
  /** Accessible name for the group of controls. */
  label?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const tray = (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      data-lab-controls=""
      className={cn(trayClass, "no-scrollbar overflow-x-auto", className)}
      style={style}
    >
      <UIStyles />
      {children}
    </div>
  );
  return placement ? <StageControls placement={placement}>{tray}</StageControls> : tray;
}

/** A hairline between groups inside a tray. */
export function TrayDivider() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-line" />;
}

/** Small caption under or above a tray ("Click anywhere to re-glaze"), on a paper chip. */
export function StageHint({
  placement,
  className,
  children,
}: {
  placement?: Placement;
  className?: string;
  children: ReactNode;
}) {
  const hint = (
    <p
      className={cn(
        "pointer-events-none max-w-full rounded-[14px] bg-paper/92 px-3 py-1 text-center text-caption text-balance text-muted shadow-[0_0_0_1px_var(--line)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </p>
  );
  return placement ? <StageControls placement={placement}>{hint}</StageControls> : hint;
}

/* ---------------------------------------------------------------------- */
/* buttons                                                                 */
/* ---------------------------------------------------------------------- */

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type">;

/**
 * A round icon button (32px in a tray, 28px with size="sm"; 40 / 36px on
 * touch screens). `label` becomes the accessible name and the tooltip;
 * `pressed` makes it a toggle button (aria-pressed) sitting in a sand well
 * while on.
 */
export function IconButton({
  label,
  pressed,
  size = "md",
  className,
  children,
  ...props
}: ButtonProps & {
  label: string;
  pressed?: boolean;
  size?: "md" | "sm";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        controlBase,
        controlQuiet,
        size === "md" ? "size-8 pointer-coarse:size-10" : "size-7 pointer-coarse:size-9",
        pressed && "bg-band text-primary shadow-[inset_0_0_0_1px_var(--line)] hover:bg-band-deep",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * A text pill for a tray ("Play", "Choose image"), with an optional
 * leading icon. `variant="solid"` is the ink primary action (cobalt on hover).
 */
export function TrayButton({
  icon,
  variant = "quiet",
  className,
  children,
  ...props
}: ButtonProps & { icon?: ReactNode; variant?: "quiet" | "solid"; children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        controlBase,
        "gap-1.5 px-3.5 text-[13px] font-[550]",
        variant === "quiet" ? "text-primary hover:bg-wash" : "bg-ink text-on-ink hover:bg-cobalt hover:text-on-cobalt",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* radio groups                                                            */
/* ---------------------------------------------------------------------- */

/** Arrow-key handling shared by Swatches and Segmented (radio semantics: moving selects). */
function useRadioKeys<T>(values: readonly T[], value: T, onChange: (value: T) => void) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const count = values.length;
    if (!count) return;
    const current = Math.max(0, values.indexOf(value));
    let next = -1;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (current + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (current - 1 + count) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    onChange(values[next]);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

export type SwatchOption<T extends string | number = string> = {
  value: T;
  /** Accessible name and tooltip ("Fes blue"). */
  label: string;
  /** Any CSS background: a colour or a gradient. */
  swatch: string;
};

/** Colour / palette picker: round glazes, the chosen one ringed in ink. */
export function Swatches<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: ReadonlyArray<SwatchOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const values = options.map((option) => option.value);
  const { refs, onKeyDown } = useRadioKeys(values, value, onChange);
  const selected = Math.max(0, values.indexOf(value));
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={cn("flex items-center", className)}>
      {options.map((option, index) => {
        const checked = index === selected;
        return (
          <button
            key={String(option.value)}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label}
            title={option.label}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "group/swatch relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-full pointer-coarse:size-10",
              focusClass,
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative block size-5 overflow-hidden rounded-full transition-[scale,box-shadow] duration-200 ease-out pointer-coarse:size-6",
                checked
                  ? "shadow-[0_0_0_2px_var(--paper),0_0_0_4px_var(--ink)]"
                  : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] group-hover/swatch:scale-[1.08] group-hover/swatch:shadow-[0_0_0_2px_var(--paper),0_0_0_3px_var(--line-firm)] group-active/swatch:scale-95 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]",
              )}
              style={{ background: option.swatch }}
            >
              {/* the glaze: a soft highlight up and to the left */}
              <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_28%,rgb(255_255_255/0.5),transparent_46%)]" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type SegmentOption<T extends string | number = string> = {
  value: T;
  label: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Show only the icon (the label stays the accessible name). */
  iconOnly?: boolean;
};

/** A row of mutually exclusive options; an ink pill slides to the chosen one ("33 | 45", "Ink | Sunset | Tide"). */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  showLabel = false,
  className,
}: {
  label: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Show `label` as a caption before the options. */
  showLabel?: boolean;
  className?: string;
}) {
  const values = options.map((option) => option.value);
  const { refs, onKeyDown } = useRadioKeys(values, value, onChange);
  const selected = Math.max(0, values.indexOf(value));
  const groupRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const button = refs.current[selected];
    if (!button) return;
    setBox((prev) =>
      prev && prev.left === button.offsetLeft && prev.width === button.offsetWidth
        ? prev
        : { left: button.offsetLeft, width: button.offsetWidth },
    );
  }, [refs, selected]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(group);
    // Only animate once the first position has painted.
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [measure]);

  return (
    <div className={cn("flex items-center", className)}>
      {showLabel ? (
        <span aria-hidden="true" className={labelClass}>
          {label}
        </span>
      ) : null}
      <div ref={groupRef} role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="relative flex items-center">
        {box ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 start-0 rounded-pill bg-ink",
              animate && "transition-[translate,width] duration-300 ease-out motion-reduce:transition-none",
            )}
            style={{ width: box.width, translate: `${box.left}px 0` }}
          />
        ) : null}
        {options.map((option, index) => {
          const checked = index === selected;
          return (
            <button
              key={String(option.value)}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.iconOnly ? option.label : undefined}
              title={option.iconOnly ? option.label : undefined}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={cn(
                controlBase,
                "gap-1.5 text-[13px] font-[550] transition-[color,scale] duration-200",
                option.iconOnly ? "w-8 pointer-coarse:w-10" : "px-3.5",
                checked ? "text-on-ink" : "text-secondary hover:text-primary",
                !box && checked && "bg-ink",
              )}
            >
              {option.icon}
              {option.iconOnly ? null : <span className="tabular-nums">{option.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* numbers                                                                 */
/* ---------------------------------------------------------------------- */

function decimalsOf(step: number) {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

function snap(value: number, min: number, max: number, step: number) {
  const snapped = Math.round((value - min) / step) * step + min;
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(decimalsOf(step)));
}

/** Calls `fn` now, then repeats it while the pointer stays down (after a short delay). */
function useRepeat() {
  const timer = useRef<number>(0);
  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = 0;
  }, []);
  useEffect(() => stop, [stop]);
  const start = useCallback(
    (fn: () => boolean) => {
      stop();
      if (!fn()) return;
      const tick = (delay: number) => {
        timer.current = window.setTimeout(() => {
          if (fn()) tick(Math.max(50, delay * 0.82));
        }, delay);
      };
      tick(380);
    },
    [stop],
  );
  return { start, stop };
}

/**
 * "ROSETTE [−] 12 [+]": a labelled number between two keycaps that press
 * down. The value (Fraunces numerals) is a spinbutton (focusable; ↑ ↓
 * change it, PageUp / PageDown by five steps, Home / End jump to the
 * ends); the keys repeat while held.
 */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  showLabel = true,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Display text for a value (default: the number). */
  format?: (value: number) => string;
  showLabel?: boolean;
  className?: string;
}) {
  const [dir, setDir] = useState<"up" | "down" | undefined>(undefined);
  const latest = useRef({ value, onChange });
  useLayoutEffect(() => {
    latest.current = { value, onChange };
  });
  const repeat = useRepeat();
  const labelId = useId();

  const change = (next: number) => {
    const snapped = snap(next, min, max, step);
    if (snapped === latest.current.value) return false;
    setDir(snapped > latest.current.value ? "up" : "down");
    latest.current.value = snapped;
    latest.current.onChange(snapped);
    return true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const map: Record<string, number | undefined> = {
      ArrowUp: value + step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowLeft: value - step,
      PageUp: value + step * 5,
      PageDown: value - step * 5,
      Home: min,
      End: max,
    };
    const next = map[event.key];
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    change(next);
  };

  const press = (delta: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    repeat.start(() => change(latest.current.value + delta));
  };

  const text = format ? format(value) : String(value);
  const buttonClass = cn(
    "lab-key grid size-7 shrink-0 cursor-pointer select-none place-items-center rounded-[8px] text-secondary disabled:pointer-events-none disabled:opacity-40 pointer-coarse:size-9",
    focusClass,
  );

  return (
    <div className={cn("flex items-center pe-1", !showLabel && "ps-1", className)}>
      {showLabel ? (
        <span id={labelId} className={labelClass}>
          {label}
        </span>
      ) : null}
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= min}
        onPointerDown={press(-step)}
        onPointerUp={repeat.stop}
        onPointerLeave={repeat.stop}
        onPointerCancel={repeat.stop}
        onClick={(event) => {
          // Clicks from assistive tech arrive without a pointer press.
          if (event.detail === 0) change(value - step);
        }}
        className={buttonClass}
      >
        <Minus size={12} />
      </button>
      <span
        role="spinbutton"
        tabIndex={0}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={format ? text : undefined}
        onKeyDown={onKeyDown}
        className={cn(
          "relative mx-0.5 flex h-8 min-w-[3.2ch] cursor-default items-center justify-center overflow-hidden rounded-[8px] px-1.5 font-display text-[17px] text-primary tabular-nums select-none [font-variation-settings:'SOFT'_100,'WONK'_0] pointer-coarse:h-10",
          focusClass,
        )}
      >
        <span key={text} className="lab-roll block" data-dir={dir}>
          {text}
        </span>
      </span>
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
        onPointerDown={press(step)}
        onPointerUp={repeat.stop}
        onPointerLeave={repeat.stop}
        onPointerCancel={repeat.stop}
        onClick={(event) => {
          if (event.detail === 0) change(value + step);
        }}
        className={buttonClass}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

/**
 * A labelled slider: "GROUT ━━━●── 0.6", a cobalt filled track and an ink
 * thumb. Drag or click the track, or focus it and use the arrow keys
 * (PageUp / PageDown move by ten steps).
 */
export function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  format,
  showValue = true,
  showLabel = true,
  width = 112,
  className,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  showValue?: boolean;
  showLabel?: boolean;
  /** Track width in px. */
  width?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const labelId = useId();
  const span = max - min || 1;
  const t = Math.min(1, Math.max(0, (value - min) / span));
  const text = format ? format(value) : String(Number(value.toFixed(decimalsOf(step))));

  const fromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const next = snap(min + ((clientX - rect.left) / rect.width) * span, min, max, step);
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const big = Math.max(step, span / 10);
    const map: Record<string, number | undefined> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + big,
      PageDown: value - big,
      Home: min,
      End: max,
    };
    const next = map[event.key];
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const snapped = snap(next, min, max, step);
    if (snapped !== value) onChange(snapped);
  };

  return (
    <div className={cn("flex h-8 items-center gap-2.5 pe-3 pointer-coarse:h-10", !showLabel && "ps-3", className)}>
      {showLabel ? (
        <span id={labelId} className={labelClass}>
          {label}
        </span>
      ) : null}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={format ? text : undefined}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          fromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (dragging) fromPointer(event.clientX);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        className={cn(
          "group/slider relative flex h-8 shrink-0 cursor-pointer touch-none items-center rounded-[6px] pointer-coarse:h-10",
          focusClass,
        )}
        style={{ width }}
      >
        <span aria-hidden="true" className={cn("absolute inset-x-0 h-[3px] rounded-full", trackFill)} />
        <span aria-hidden="true" className="absolute start-0 h-[3px] rounded-full bg-cobalt" style={{ width: `${t * 100}%` }} />
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink shadow-[0_0_0_2px_var(--paper),0_2px_5px_rgb(var(--shadow-rgb)/0.3)] transition-[scale] duration-150 ease-out group-hover/slider:scale-115 pointer-coarse:size-4.5",
            dragging && "scale-[1.25] group-hover/slider:scale-[1.25]",
          )}
          style={{ left: `${t * 100}%` }}
        />
      </div>
      {showValue ? (
        <span aria-hidden="true" className="min-w-[3.5ch] text-end text-[12.5px] font-[550] text-primary tabular-nums">
          {text}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* switch                                                                  */
/* ---------------------------------------------------------------------- */

/** A labelled on / off switch ("MOTION ●○"): an ink track when on. Space or Enter flips it. */
export function Toggle({
  label,
  checked,
  onChange,
  showLabel = true,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      onClick={() => onChange(!checked)}
      className={cn(
        controlBase,
        "gap-2.5 ps-3 pe-2 hover:bg-wash",
        checked ? "text-primary" : "text-muted hover:text-primary",
        className,
      )}
    >
      {showLabel ? <span className="caps">{label}</span> : null}
      <span
        aria-hidden="true"
        className={cn(
          "relative h-[18px] w-[30px] shrink-0 rounded-full transition-[background-color,box-shadow] duration-200 ease-out",
          checked ? "bg-ink" : "bg-band shadow-[inset_0_0_0_1px_var(--line-firm)]",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] start-[2px] size-[14px] rounded-full transition-[translate,background-color] duration-300 ease-spring motion-reduce:transition-none",
            checked
              ? "translate-x-3 bg-paper"
              : "bg-paper shadow-[0_0_0_1px_var(--line-firm),0_1px_2px_rgb(var(--shadow-rgb)/0.2)]",
          )}
        />
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* text                                                                    */
/* ---------------------------------------------------------------------- */

/**
 * A pill text field for a tray (sand ground, cobalt ring when focused),
 * optionally with an ink submit pill ("type a message [Flip ↵]"). Enter
 * submits; Esc blurs.
 */
export function TextInput({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
  submitLabel,
  width = 200,
  inputProps,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  /** Shows a solid button with this text and ↵ (needs onSubmit). */
  submitLabel?: string;
  /** Input width in px (it shrinks on narrow stages). */
  width?: number;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "maxLength" | "placeholder">;
  className?: string;
}) {
  return (
    <form
      className={cn("flex min-w-0 items-center gap-1", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
    >
      <input
        type="text"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint={onSubmit ? "go" : undefined}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Escape") event.currentTarget.blur();
        }}
        className="h-8 min-w-0 shrink rounded-pill bg-background/80 px-3.5 text-[16px] text-primary shadow-[inset_0_0_0_1px_var(--line)] outline-none transition-[box-shadow] duration-200 ease-out placeholder:text-muted hover:shadow-[inset_0_0_0_1px_var(--line-firm)] focus-visible:shadow-[inset_0_0_0_1.5px_var(--cobalt)] sm:text-[14px] pointer-coarse:h-10"
        style={{ width }}
        {...inputProps}
      />
      {onSubmit && submitLabel ? (
        <button
          type="submit"
          className={cn(
            "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-pill bg-ink ps-3.5 pe-3 text-[12.5px] font-[550] text-on-ink transition-[background-color,color,scale] duration-150 ease-out hover:bg-cobalt hover:text-on-cobalt active:scale-[0.96] pointer-coarse:h-10",
            focusClass,
          )}
        >
          {submitLabel}
          <Return size={12} className="opacity-70" />
        </button>
      ) : null}
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* sound                                                                   */
/* ---------------------------------------------------------------------- */

/** Toggles the lab-wide mute (persisted; shared by every piece and tab). */
export function MuteButton({ size = "md", className }: { size?: "md" | "sm"; className?: string }) {
  const muted = useMuted();
  return (
    <IconButton
      label="Mute"
      pressed={muted}
      size={size}
      onClick={() => toggleMuted()}
      className={className}
      title={muted ? "Sound off" : "Sound on"}
    >
      <span className="icon-swap">
        <span data-hidden={muted ? "true" : undefined} className="flex">
          <SpeakerOn size={16} />
        </span>
        <span data-hidden={muted ? undefined : "true"} className="flex">
          <SpeakerOff size={16} />
        </span>
      </span>
    </IconButton>
  );
}
