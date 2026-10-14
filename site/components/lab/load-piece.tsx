"use client";

// Loads a lab piece by slug. Each piece is its own JS chunk (next/dynamic,
// client only), fetched the first time it's mounted. Theme and reduced
// motion are read here and passed down, so callers only say where the
// piece is (`mode`) and whether it should run (`active`).
//
//   <div className="relative aspect-square"><LoadPiece slug="zellige" mode="tile" active={inView} /></div>
//   <LoadPiece slug="seal" mode="tile" active={inView} poster={<PieceArt slug="seal" />} load={near} />
//
// The piece fills the nearest positioned ancestor. Two ways to wait:
//
// - Without a poster, a warm sheen shows while the chunk loads and the
//   piece fades in over it (a stand-in piece shows its name).
// - With a `poster` (the code-drawn picture from lab-art.tsx, rendered on
//   the server), the poster is what shows: while `load` is false, while
//   the chunk loads, when the piece is still a stand-in, and if it fails.
//   Once a real piece has mounted it fades in and the poster fades away.
//   On the stage a stand-in or a failure also gets a short note.
//
// A piece that throws is caught and replaced instead of taking the page down.

import dynamic from "next/dynamic";
import {
  Component,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion, useTheme } from "./hooks";
import { getPiece } from "./registry";
import type { PieceMode, PieceProps } from "./types";

type Arrival = "loading" | "placeholder" | "live" | "failed";

/** Set by LoadPiece when it has a poster: how the mounted piece reports back. */
const Slot = createContext<{ report: (state: Arrival) => void } | null>(null);

function Loading() {
  // With a poster on show, waiting looks like the poster.
  if (useContext(Slot)) return null;
  return <div aria-hidden="true" className="skeleton absolute inset-0" />;
}

/** Wraps a loaded piece so it fades in, and tells a poster host whether it is real or a stand-in. */
function arrive(Piece: ComponentType<PieceProps>): ComponentType<PieceProps> {
  function Arrived(props: PieceProps) {
    const slot = useContext(Slot);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!slot) return;
      const standIn = Boolean(ref.current?.querySelector("[data-lab-placeholder]"));
      slot.report(standIn ? "placeholder" : "live");
    }, [slot]);
    return (
      <div ref={ref} data-lab-piece="" className="absolute inset-0 animate-fade-in">
        <Piece {...props} />
      </div>
    );
  }
  Arrived.displayName = `Arrived(${Piece.displayName ?? Piece.name ?? "Piece"})`;
  return Arrived;
}

// One literal import per piece, so the bundler gives each its own chunk.
const PIECES: Record<string, ComponentType<PieceProps>> = {
  zellige: dynamic(() => import("./pieces/zellige/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "split-flap": dynamic(() => import("./pieces/split-flap/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  seal: dynamic(() => import("./pieces/seal/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  macropad: dynamic(() => import("./pieces/macropad/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "liquid-glass": dynamic(() => import("./pieces/liquid-glass/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "agent-run": dynamic(() => import("./pieces/agent-run/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "commit-city": dynamic(() => import("./pieces/commit-city/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  turntable: dynamic(() => import("./pieces/turntable/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  dusk: dynamic(() => import("./pieces/dusk/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
};

class PieceBoundary extends Component<
  { title: string; mode: PieceMode; onFail?: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`lab: "${this.props.title}" stopped with an error`, error);
    this.props.onFail?.();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const stage = this.props.mode === "stage";
    return (
      <div className="absolute inset-0 grid place-items-center bg-band p-4 text-center">
        <p className={cn("serif-italic text-muted", stage ? "text-[17px]" : "text-caption")}>
          {stage ? `${this.props.title} couldn't start in this browser.` : this.props.title}
        </p>
      </div>
    );
  }
}

export function LoadPiece({
  slug,
  mode,
  active,
  poster,
  load = true,
}: {
  slug: string;
  mode: PieceMode;
  active: boolean;
  /** Shown until a real piece has arrived (and instead of a stand-in or a failure). */
  poster?: ReactNode;
  /** False: show the poster only and don't fetch the piece yet (e.g. until it nears the viewport). */
  load?: boolean;
}) {
  if (poster === undefined) return <Bare slug={slug} mode={mode} active={active} />;
  // Keyed, so a new slug starts from its poster again.
  return <WithPoster key={slug} slug={slug} mode={mode} active={active} poster={poster} load={load} />;
}

function Bare({ slug, mode, active }: { slug: string; mode: PieceMode; active: boolean }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const Piece = PIECES[slug];
  const meta = getPiece(slug);
  if (!Piece || !meta) return null;
  return (
    <PieceBoundary key={slug} title={meta.title} mode={mode}>
      <Piece mode={mode} active={active} reducedMotion={reducedMotion} theme={theme} />
    </PieceBoundary>
  );
}

function WithPoster({
  slug,
  mode,
  active,
  poster,
  load,
}: {
  slug: string;
  mode: PieceMode;
  active: boolean;
  poster: ReactNode;
  load: boolean;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<Arrival>("loading");
  const slot = useMemo(() => ({ report: setState }), []);
  const Piece = PIECES[slug];
  const meta = getPiece(slug);
  const live = state === "live";
  const showNote = mode === "stage" && (state === "placeholder" || state === "failed");

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
          live && "opacity-0 delay-300",
        )}
      >
        {poster}
      </div>
      {load && Piece && meta ? (
        <div
          aria-hidden={live ? undefined : true}
          inert={!live}
          className={cn(
            "absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
            live ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Slot.Provider value={slot}>
            <PieceBoundary title={meta.title} mode={mode} onFail={() => setState("failed")}>
              <Piece mode={mode} active={active} reducedMotion={reducedMotion} theme={theme} />
            </PieceBoundary>
          </Slot.Provider>
        </div>
      ) : null}
      {showNote ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center sm:bottom-5">
          <p className="animate-fade-up rounded-pill bg-paper/90 px-3.5 py-1.5 text-center text-caption text-muted shadow-[0_0_0_1px_var(--line)] backdrop-blur-sm">
            {state === "failed"
              ? `${meta?.title ?? "This piece"} couldn't start in this browser. Here is a sketch of it.`
              : "A sketch for now: the live piece is still being built."}
          </p>
        </div>
      ) : null}
    </>
  );
}
