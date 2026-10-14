"use client";

// Client-only pieces of app/not-found.tsx.

import { useSyncExternalStore } from "react";

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
    <code className="rounded-[6px] bg-well px-1.5 py-0.5 font-mono text-[13px] break-all text-primary">
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
