// Home: the writing section, the newest posts with a link to /writing.

import { Section } from "@/components/section";
import { WritingList } from "@/components/writing-row";
import { site } from "@/content/site";
import { pad } from "@/lib/format";

/** How many posts the home page lists before "All writing". */
const HOME_POSTS = 5;

export function Writing() {
  return (
    <Section
      id="writing"
      label="writing"
      count={pad(site.writing.length, 2)}
      action={{ label: "All writing", href: "/writing/" }}
    >
      <WritingList posts={site.writing} limit={HOME_POSTS} />
    </Section>
  );
}
