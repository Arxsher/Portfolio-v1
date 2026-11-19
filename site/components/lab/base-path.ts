// The sub-path the site is served from: "" normally, "/preview" for the
// arsher.is-a.dev/preview/ copy (next.config.ts reads NEXT_BASE_PATH).
//
// Next adds it to <Link>, the router and its own assets, but not to
// metadata URLs (canonical, Open Graph and Twitter images, structured
// data) or to plain <a> / <img> / fetch paths. Run those through
// withBasePath:
//
//   images: [{ url: withBasePath("/lab/og/macropad.png") }]
//
// Used by the lab pages (app/lab/**), so it lives in the lab folder.
// Server code only (metadata, server components): the variable isn't
// inlined into client bundles.

export const basePath = (process.env.NEXT_BASE_PATH ?? "").replace(/\/+$/, "");

/** "/lab/" → "/preview/lab/" under a base path; absolute URLs pass through. */
export function withBasePath(path: string): string {
  if (!basePath || !path.startsWith("/") || path.startsWith("//")) return path;
  return `${basePath}${path}`;
}
