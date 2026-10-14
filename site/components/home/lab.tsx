// Home: Three · Lab. Every piece stands in a niche of an arcade, five over
// four on desktop (three across on tablets, two on phones), running live
// in its arched window once it nears the viewport, with its code-drawn
// poster until then.
//
//   ✦────────────────────────────────────────────────────────────
//   THREE · LAB                                Small interactive pieces …
//   The lab ✦9                                 Walk through the lab →
//
//     ⌒     ⌒     ⌒     ⌒     ⌒
//    01    02    03    04    05
//        ⌒     ⌒     ⌒     ⌒
//       06    07    08    09
//
// The posters are drawn here, on the server, and handed to the niches.

import { PieceArt, artGround } from "@/components/lab/lab-art";
import { LabNiche } from "@/components/lab/lab-tile";
import { Arcade } from "@/components/lab/masonry";
import { pieces } from "@/components/lab/registry";
import { Section } from "@/components/section";

export function Lab() {
  return (
    <Section
      id="lab"
      label="lab"
      numeral="Three"
      title="The"
      turn="lab"
      count={pieces.length}
      badge
      note="Small interactive pieces: components, objects and generative scenes, drawn in code and running in your browser."
      action={{ label: "Walk through the lab", href: "/lab/" }}
    >
      <Arcade
        label="Lab pieces"
        items={pieces.map((piece, index) => ({
          key: piece.slug,
          children: (
            <LabNiche
              piece={piece}
              number={index + 1}
              ground={artGround(piece.slug)}
              poster={<PieceArt slug={piece.slug} uid={`home-${piece.slug}`} />}
            />
          ),
        }))}
      />
    </Section>
  );
}
