import { GitHubGraph } from "@/components/home/github";
import { Guestbook } from "@/components/home/guestbook";
import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { Lab } from "@/components/home/lab";
import { Postcard } from "@/components/home/profile";
import { Work } from "@/components/home/work";
import { Writing } from "@/components/home/writing";
import { ZelligeBand } from "@/components/zellige-band";
import { site } from "@/content/site";

// Structured data about the person behind the site (facts from content/site.ts).
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  alternateName: site.handle,
  jobTitle: site.title,
  url: site.url,
  homeLocation: { "@type": "Place", name: "Casablanca, Morocco" },
  worksFor: { "@type": "Organization", name: "Extra Immobilien", url: "https://www.extraimmobilien.de/" },
  ...(site.avatar ? { image: new URL(site.avatar, site.url).toString() } : {}),
  sameAs: site.socials.map((social) => social.href),
};

// The home page, in order (DESIGN.md → Home):
//
//   Hero              the name, the title, Casablanca at dusk in an arch
//   Zellige frieze    full bleed, the only one on the site
//   One · About       #about      the fiche and the letter
//   Postcard          #contact    Say hi, Book a call, the address, socials
//   Two · Work        #work
//   Three · Lab       #lab
//   Four · Writing    #writing
//   Five · Code       #github
//   Six · Guestbook   #guestbook
//
// Every block after the frieze is a section[id] spaced by --section-gap;
// the top bar's links and scroll-spy rely on #work, #lab, #writing and
// #guestbook, and the hero's buttons on #contact and #work.
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <div className="bleed mt-[clamp(40px,6vw,72px)]">
        <ZelligeBand />
      </div>
      <Intro />
      <Postcard />
      <Work />
      <Lab />
      <Writing />
      <GitHubGraph />
      <Guestbook />
    </>
  );
}
