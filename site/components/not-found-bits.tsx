"use client";

// Client-only pieces of app/not-found.tsx. The exported 404 page hydrates on
// every missing URL, so nothing here may depend on the path at build time:
// the address only appears once we are in the browser.

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Star } from "@/components/ornament";
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
    <code className="rounded-[4px] bg-band px-1.5 py-0.5 font-mono text-[0.86em] break-all text-primary">
      {readable(path)}
    </code>
  );
}

function readable(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** The two ways on: home, or the Index. */
export function WaysBack() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/" className="btn btn-solid btn-lg">
        <Star size={13} className="text-terra-fill" />
        Back home
      </Link>
      <button type="button" onClick={() => openCommand("palette")} className="btn btn-soft btn-lg">
        Open the index
        <span className="keys-hint max-sm:hidden" aria-hidden="true">
          <kbd className="kbd">/</kbd>
        </span>
      </button>
    </div>
  );
}
