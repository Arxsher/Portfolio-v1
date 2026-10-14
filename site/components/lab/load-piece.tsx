"use client";

// Loads a lab piece by slug. Each piece is its own JS chunk (next/dynamic,
// client only), fetched the first time it's mounted; a quiet sheen shows
// meanwhile and the piece fades in when it arrives. Theme and reduced
// motion are read here and passed down, so callers only say where the
// piece is (`mode`) and whether it should run (`active`).
//
//   <div className="relative aspect-square"><LoadPiece slug="zellige" mode="tile" active={inView} /></div>
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
