"use client";

// Client-only pieces of app/not-found.tsx.

import { useSyncExternalStore } from "react";
import { Mail } from "@/components/icons";
import { openCommand } from "@/lib/command";

const noop = () => () => {};

/** The address the visitor tried, once we're in the browser. */
export function MissingPath() {
  const path = useSyncExternalStore(
    noop,
    () => window.location.pathname,
    () => null,
  );
  if (!path || path === "/" || path.startsWith("/_not-found") || path.startsWith("/404")) {
    return <>this address</>;
  }
  return (
    <code className="rounded-[6px] bg-control px-1.5 py-0.5 font-mono text-[13px] break-all text-primary">
      {decodeURIComponent(path)}
    </code>
  );
}

export function SayHiButton({ className }: { className: string }) {
  return (
    <button type="button" className={className} onClick={() => openCommand("say-hi")}>
      <Mail size={15} />
      Say hi
    </button>
  );
}
