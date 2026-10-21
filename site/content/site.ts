// Everything personal on the site lives here (plus projects.json and
// contributions.json). Edit this file to change copy, links and settings.

import projects from "./projects.json";
import contributions from "../data/contributions.json";

export type Project = (typeof projects)[number];

export const site = {
  url: "https://arsher.is-a.dev",
  handle: "arsher",
  name: "Zakaria",
  title: "Full-stack developer & designer",
  metaTitle: "Zakaria • Full-stack Developer & Designer",
  description:
    "Designer, developer and builder crafting digital experiences at the intersection of design, technology, and user experience.",
  // Profile photo, e.g. "/images/avatar.jpg" (put the file in public/).
  // Shown beside the name on the home page and in the social panels. Empty:
  // no photo on the home page, the "arsher" mark in the panels.
  avatar: "",
  // Social preview image (1200 x 630) for links shared on X, LinkedIn …
  ogImage: "/og.png",
  ogImageSize: { width: 1200, height: 630 },

  // The line above the name on the home page, with the live local time
  // ("18:53 GMT+1"). The time zone is an IANA name for the browser's clock
  // (it also drives the lab's departures board); only the time and the
  // GMT offset are ever shown, never the zone's city.
  status: {
    label: "Available for work",
    timeZone: "Africa/Casablanca",
  },

  // "Now" and "Focus" rows of the facts list under the intro on the home page.
  now: {
    role: "IT Administrator & Lead Developer",
    org: "Extra Immobilien",
    href: "https://www.extraimmobilien.de/",
    since: "2026-05",
  },
  focus: ["AI agent orchestration", "React", "TypeScript", "Figma", "System design"],

  email: "nzakaria644@gmail.com",

  // Contact form ("Say hi"). Get a free access key at https://web3forms.com
  // and set NEXT_PUBLIC_WEB3FORMS_KEY. Without it the form opens the
  // visitor's mail app with the message pre-filled.
  web3formsKey: process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "",

  // "Book a call". Your cal.com link path, e.g. "arsher/30min". Leave empty
  // and the panel points people to "Say hi" instead.
  calLink: process.env.NEXT_PUBLIC_CAL_LINK ?? "",

  // Guestbook and post view counts (Supabase). See site/README.md and
  // supabase/*.sql for the one-time setup.
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",

  socials: [
    { name: "GitHub", href: "https://github.com/Arxsher", handle: "Arxsher" },
    { name: "X", href: "https://x.com/Arxsher", handle: "@Arxsher" },
    { name: "Instagram", href: "https://instagram.com/arxsher", handle: "@Arxsher" },
    { name: "Spotify", href: "https://open.spotify.com/user/arxsher", handle: "Arxsher" },
  ],

  // Intro copy on the home page, one array per paragraph. Plain `text`
  // renders in the body colour; `strong` in the foreground colour; `strong`
  // with an `href` is an underlined link (an arrow marks links that leave
  // the site).
  intro: [
    [
      { text: "I craft digital experiences at the intersection of " },
      { strong: "design, technology, and user experience" },
      { text: ", and I believe software should feel physically grounded and fast, with zero room for jank." },
    ],
    [
      { text: "Beyond full-stack builds, I'm deep into AI agent orchestration: " },
      { strong: "AegiLabs", href: "https://github.com/Arxsher/AegiLabs" },
      { text: " is my latest build, and the rest of my " },
      { strong: "experiments", href: "#work" },
      { text: " are further down. Smaller interactive pieces live in the " },
      { strong: "lab", href: "/lab/" },
      { text: "." },
    ],
  ],

  // How many projects the home page shows before "All work".
  homeProjectCount: 6,

  // The lab (/lab/) is code, not content: each piece lives in
  // components/lab/pieces/<slug>/ and is listed in components/lab/registry.ts.

  writing: [
    {
      title: "Artificial General Intelligence",
      date: "2026-05-04",
      href: "https://agi-frontier.vercel.app/",
      external: true,
    },
  ],

  // Shown in the footer. Remove if you'd rather not credit the inspiration.
  credit: { label: "Design inspired by anishfn", href: "https://www.anishfn.ink/" },
} as const;

export { projects, contributions };
