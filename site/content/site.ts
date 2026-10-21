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
  // Empty shows the "arsher" mark on a soft tile instead.
  avatar: "",
  // Social preview image (1200 x 630) for links shared on X, LinkedIn …
  ogImage: "/og.png",
  ogImageSize: { width: 1200, height: 630 },
  verified: true,

  status: {
    label: "Available for work",
    timeZone: "Africa/Casablanca",
  },

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

  // Intro copy. `strong` segments render in the foreground colour; `chip`
  // segments render as the small inline pills.
  intro: [
    [
      { text: "Hey, I'm " },
      { strong: "Zakaria" },
      { text: ". I'm a designer, developer and builder crafting digital experiences at the intersection of " },
      { strong: "design, technology, and user experience" },
      { text: "." },
    ],
    [
      { text: "By day I'm IT Administrator & Lead Developer at " },
      { strong: "Extra Immobilien", href: "https://www.extraimmobilien.de/" },
      { text: ". The rest of the time I'm deep into AI agent orchestration: " },
      { chip: "AegiLabs", icon: "github", href: "https://github.com/Arxsher/AegiLabs" },
      { text: " is my latest build, and the rest of my " },
      { chip: "experiments", icon: "folder", href: "#work" },
      { text: " are just below. The " },
      { chip: "lab", icon: "sparkle", href: "/lab/" },
      { text: " is where I build small interactive pieces." },
    ],
    [
      { text: "I also contribute to open source, with pull requests merged into " },
      { chip: "Tailwind CSS", icon: "github", href: "https://github.com/tailwindlabs/tailwindcss/pull/19670" },
      { text: " and " },
      { chip: "CrewAI", icon: "github", href: "https://github.com/crewAIInc/crewAI/pull/8278" },
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
