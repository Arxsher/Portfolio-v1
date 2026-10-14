// Home: Four · Writing. The newest posts as big numbered rows, with a way
// on to /writing/.

import { Section } from "@/components/section";
import { WritingList } from "@/components/writing-row";
import { site } from "@/content/site";

/** How many posts the home page lists before "All writing". */
const HOME_POSTS = 3;

export function Writing() {
  return (
    <Section
      id="writing"
      label="writing"
      numeral="Four"
      title="Notes &"
      turn="essays"
      count={site.writing.length}
      note="Longer thoughts, newest first. Some are published on their own sites."
      action={{ label: "All writing", href: "/writing/" }}
    >
      <WritingList posts={site.writing} limit={HOME_POSTS} />
    </Section>
  );
}
