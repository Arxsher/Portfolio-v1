"use client";

// Loads a lab piece by slug. Each piece is its own JS chunk (next/dynamic,
// client only), fetched the first time it's mounted; a quiet sheen shows
// meanwhile and the piece fades in when it arrives. Theme and reduced
// motion are read here and passed down, so callers only say where the
// piece is (`mode`) and whether it should run (`active`).
//
//   <div className="relative aspect-square"><LoadPiece slug="macropad" mode="tile" active={inView} /></div>
//
// The piece fills the nearest positioned ancestor. A piece that throws is
// caught and replaced by a short note instead of taking the page down.

import dynamic from "next/dynamic";
import { Component, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion, useTheme } from "./hooks";
import { getPiece } from "./registry";
import type { PieceMode, PieceProps } from "./types";

function Loading() {
  return <div aria-hidden="true" className="skeleton absolute inset-0" />;
}

/** Wraps a loaded piece so it fades in over the loading sheen. */
function arrive(Piece: ComponentType<PieceProps>): ComponentType<PieceProps> {
  function Arrived(props: PieceProps) {
    return (
      <div className="absolute inset-0 animate-fade-in">
        <Piece {...props} />
      </div>
    );
  }
  Arrived.displayName = `Arrived(${Piece.displayName ?? Piece.name ?? "Piece"})`;
  return Arrived;
}

// One literal import per piece, so the bundler gives each its own chunk.
const PIECES: Record<string, ComponentType<PieceProps>> = {
  "event-horizon": dynamic(() => import("./pieces/event-horizon/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  ink: dynamic(() => import("./pieces/ink/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  bubbles: dynamic(() => import("./pieces/bubbles/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "golden-room": dynamic(() => import("./pieces/golden-room/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "holo-cards": dynamic(() => import("./pieces/holo-cards/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "pull-cord": dynamic(() => import("./pieces/pull-cord/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "year-rings": dynamic(() => import("./pieces/year-rings/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "liquid-tabs": dynamic(() => import("./pieces/liquid-tabs/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  island: dynamic(() => import("./pieces/island/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "snow-globe": dynamic(() => import("./pieces/snow-globe/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "tiny-planet": dynamic(() => import("./pieces/tiny-planet/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "night-train": dynamic(() => import("./pieces/night-train/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "rain-window": dynamic(() => import("./pieces/rain-window/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "magnetic-dock": dynamic(() => import("./pieces/magnetic-dock/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "text-morph": dynamic(() => import("./pieces/text-morph/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  disintegrate: dynamic(() => import("./pieces/disintegrate/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "elastic-scrubber": dynamic(() => import("./pieces/elastic-scrubber/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "commit-city": dynamic(() => import("./pieces/commit-city/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  macropad: dynamic(() => import("./pieces/macropad/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "liquid-glass": dynamic(() => import("./pieces/liquid-glass/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  turntable: dynamic(() => import("./pieces/turntable/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  dusk: dynamic(() => import("./pieces/dusk/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "split-flap": dynamic(() => import("./pieces/split-flap/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
  "agent-run": dynamic(() => import("./pieces/agent-run/piece").then((mod) => arrive(mod.default)), { ssr: false, loading: Loading }),
};

class PieceBoundary extends Component<{ title: string; mode: PieceMode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`lab: "${this.props.title}" stopped with an error`, error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const stage = this.props.mode === "stage";
    return (
      <div className="absolute inset-0 grid place-items-center bg-tile p-4 text-center">
        <p className={cn("text-tertiary", stage ? "text-[14px]" : "text-[12px]")}>
          {stage ? `${this.props.title} couldn't start in this browser.` : this.props.title}
        </p>
      </div>
    );
  }
}

export function LoadPiece({ slug, mode, active }: { slug: string; mode: PieceMode; active: boolean }) {
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
