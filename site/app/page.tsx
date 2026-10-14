import { GitHubGraph } from "@/components/home/github";
import { Guestbook } from "@/components/home/guestbook";
import { HeroPond } from "@/components/home/hero-pond";
import { Intro } from "@/components/home/intro";
import { Lab } from "@/components/home/lab";
import { Profile } from "@/components/home/profile";
import { Work } from "@/components/home/work";
import { Writing } from "@/components/home/writing";
import { site } from "@/content/site";

// Structured data about the person behind the site.
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  alternateName: site.handle,
  jobTitle: site.title,
  url: site.url,
  image: new URL(site.avatar, site.url).toString(),
  sameAs: site.socials.map((social) => social.href),
};

// Section anchors: #work, #lab, #writing, #github, #guestbook (set by each
// component through <Section id=…>).
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }}
      />
      <HeroPond />
      <Profile />
      <Intro />
      <Work />
      <Lab />
      <Writing />
      <GitHubGraph />
      <Guestbook />
    </>
  );
}
