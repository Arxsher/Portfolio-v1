// Home: the lab section. Every lab piece runs live in its own tile, in a
// masonry of three columns (two on phones), as on the reference home grid.
//
//   lab / 09 ....................................... All pieces ›
//   ┌──────┐ ┌──────┐ ┌──────┐
//   │  1   │ │  2   │ │      │
//   │      │ └──────┘ │  3   │
//   └──────┘ ┌──────┐ └──────┘
//   ┌──────┐ │  5   │ ┌──────┐
//   │  4   │ │      │ │  6   │
//   …
//
// Columns read across (1/4/7, 2/5/8, 3/6/9). The tile shapes in each
// piece's meta (tile.aspect) are chosen so the three columns end level at
// the 204px desktop tile; see components/lab/masonry.tsx for the layout.

import { LabTile } from "@/components/lab/lab-tile";
import { Masonry } from "@/components/lab/masonry";
import { pieces } from "@/components/lab/registry";
import { Section } from "@/components/section";

export function Lab() {
  return (
    <Section id="lab" label="lab" count={pieces.length} action={{ label: "All pieces", href: "/lab/" }}>
      <Masonry
        max={3}
        label="Lab pieces"
        items={pieces.map((piece) => ({
          key: piece.slug,
          aspect: piece.tile.aspect,
          children: <LabTile piece={piece} />,
        }))}
      />
    </Section>
  );
}
