// Home: the lab section. Nine featured pieces (the FEATURED list in
// components/lab/registry.ts) run live in their tiles, in a masonry of
// three columns (two on phones) whose columns end level. The count is the
// whole lab, and "All pieces" opens it.
//
//   lab / 19 ....................................... All pieces ›
//   ┌──────┐ ┌──────┐ ┌──────┐
//   │  1   │ │  2   │ │      │
//   │      │ └──────┘ │  3   │
//   └──────┘ ┌──────┐ └──────┘
//   ┌──────┐ │  5   │ ┌──────┐
//   │  4   │ │      │ │  6   │
//   …
//   └──────┘ └──────┘ └──────┘   ← level
//
// Three columns read across (1/4/7, 2/5/8, 3/6/9); two columns fill the
// shorter one first. Either way the tiles are stretched a few percent at
// most so the columns end together; see components/lab/masonry.tsx.

import { LabTile } from "@/components/lab/lab-tile";
import { Masonry } from "@/components/lab/masonry";
import { featured, pieces } from "@/components/lab/registry";
import { Section } from "@/components/section";

export function Lab() {
  return (
    <Section id="lab" label="lab" count={pieces.length} action={{ label: "All pieces", href: "/lab/" }}>
      <Masonry
        max={3}
        rows={[3]}
        level
        label="Featured lab pieces"
        items={featured.map((piece) => ({
          key: piece.slug,
          aspect: piece.tile.aspect,
          children: <LabTile piece={piece} />,
        }))}
      />
    </Section>
  );
}
