// The dock's glyphs: plain monoline marks on a 24 px grid, drawn for this
// piece. Each has an outline and a filled form (the selected tab).

import type { ReactNode } from "react";

export type TabId = "home" | "search" | "spark" | "saved" | "profile";

export const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "search", label: "Search" },
  { id: "spark", label: "Spark" },
  { id: "saved", label: "Saved" },
  { id: "profile", label: "Profile" },
];

/** The tile's dock is shorter. */
export const TILE_TABS = TABS.filter((tab) => tab.id !== "saved");

function Glyph({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="block"
    >
      {children}
    </svg>
  );
}

export function TabGlyph({ id, size, filled }: { id: TabId; size: number; filled: boolean }) {
  const fill = filled ? "currentColor" : "none";
  switch (id) {
    case "home":
      return (
        <Glyph size={size}>
          <path d="M4.25 10.4 12 4.2l7.75 6.2v8.1a1.5 1.5 0 0 1-1.5 1.5h-3.6v-5.1a.8.8 0 0 0-.8-.8h-3.7a.8.8 0 0 0-.8.8v5.1h-3.6a1.5 1.5 0 0 1-1.5-1.5z" fill={fill} />
        </Glyph>
      );
    case "search":
      return (
        <Glyph size={size}>
          <circle cx="10.8" cy="10.8" r="6.2" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.16 : 0} />
          <path d="m15.4 15.4 4.35 4.35" />
        </Glyph>
      );
    case "spark":
      return (
        <Glyph size={size}>
          <path d="M12 3.6c.55 4.6 2.35 6.5 7 7.15-4.65.65-6.45 2.55-7 7.15-.55-4.6-2.35-6.5-7-7.15 4.65-.65 6.45-2.55 7-7.15z" fill={fill} />
          <path d="M18.6 16.4v3.2M17 18h3.2" strokeWidth={1.6} />
        </Glyph>
      );
    case "saved":
      return (
        <Glyph size={size}>
          <path d="M7.2 4.2h9.6a1.2 1.2 0 0 1 1.2 1.2v14.2l-6-3.9-6 3.9V5.4a1.2 1.2 0 0 1 1.2-1.2z" fill={fill} />
        </Glyph>
      );
    case "profile":
      return (
        <Glyph size={size}>
          <circle cx="12" cy="8.6" r="3.6" fill={fill} />
          <path d="M4.9 19.6c1.15-3.55 3.8-5.4 7.1-5.4s5.95 1.85 7.1 5.4" fill={fill} />
        </Glyph>
      );
  }
}
