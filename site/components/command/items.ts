// What the command bar knows about: its views (the panels that open above
// the input), the shortcuts listed in the palette, and how a typed query
// turns into either a view or a filtered list.
//
// Typing a view's name opens it straight away ("work", "theme", "book a
// call"); typing a greeting, a name or an email opens "Say hi" with the
// form filled in; anything else filters the list.

import type { CommandView } from "@/lib/command";
import { GUESTBOOK_PANEL } from "@/components/guestbook/sign-form";
import { projects, site } from "@/content/site";
import { matches, normalize, parseMessage, type ParsedMessage } from "./parse";

export type DockView =
  | CommandView
  | "home"
  | "work"
  | "writing"
  | "lab"
  | "theme"
  | "github"
  | "x"
  | "instagram"
  | "spotify";

/** Every view except the list itself. */
export type PanelView = Exclude<DockView, "palette">;

export type IconName =
  | "home"
  | "pen"
  | "calendar"
  | "mail"
  | "folder"
  | "doc"
  | "sparkle"
  | "moon"
  | "github"
  | "x"
  | "instagram"
  | "spotify";

export type ViewInfo = {
  title: string;
  description: string;
  icon: IconName;
  /** What the input shows while the view is open ("book a call"). */
  input: string;
  /** Typed queries that open the view directly. */
  aliases: readonly string[];
  /** Extra words the palette filter matches on. */
  keywords: readonly string[];
};

const social = (name: string) => site.socials.find((entry) => entry.name === name);

export const VIEWS: Record<PanelView, ViewInfo> = {
  home: {
    title: "Home",
    description: "Head back to the front page from anywhere.",
    icon: "home",
    input: "home",
    aliases: ["home", "start", "top"],
    keywords: ["start", "top", "index", "back"],
  },
  guestbook: {
    title: GUESTBOOK_PANEL.title,
    description: GUESTBOOK_PANEL.description,
    icon: "pen",
    input: "guestbook",
    aliases: ["guestbook", "sign", "sign my guestbook", "sign the guestbook", "leave a note"],
    keywords: ["sign", "note", "signature", "wall", "guest"],
  },
  "book-call": {
    title: `Book a call with ${site.name}`,
    description: site.calLink
      ? "Choose a free slot for a short video chat."
      : "No calendar yet. Send a message and we will find a time.",
    icon: "calendar",
    input: "book a call",
    aliases: ["book", "call", "book a call", "meet", "meeting", "schedule", "calendar"],
    keywords: ["meeting", "schedule", "calendar", "cal", "chat", "time", "meet"],
  },
  "say-hi": {
    title: "Send me a message",
    description: "Drop me a line from here, or copy my email address.",
    icon: "mail",
    input: "say hi",
    aliases: ["say hi", "send me a message", "send a message", "email", "email me", "mail", "contact", "message"],
    keywords: ["email", "contact", "message", "hello", "hey", "mail", "inbox", "write"],
  },
  work: {
    title: "Work",
    description: "Projects I have designed and built, each with its own page.",
    icon: "folder",
    input: "work",
    aliases: ["work", "my work", "projects", "portfolio"],
    keywords: ["projects", "portfolio"],
  },
  writing: {
    title: "Writing",
    description: "Longer pieces I have published.",
    icon: "doc",
    input: "writing",
    aliases: ["writing", "blog", "posts", "articles"],
    keywords: ["blog", "posts", "articles", "notes", ...site.writing.map((post) => post.title)],
  },
  lab: {
    title: "The lab",
    description: "Design shots and experiments.",
    icon: "sparkle",
    input: "lab",
    aliases: ["lab", "the lab", "shots", "experiments"],
    keywords: ["shots", "experiments", "design", "dribbble", ...site.lab.map((shot) => shot.title)],
  },
  theme: {
    title: "Theme",
    description: "Pick light or dark, or follow your system setting.",
    icon: "moon",
    input: "theme",
    aliases: ["theme", "dark", "light", "system", "dark mode", "light mode", "appearance"],
    keywords: ["dark", "light", "system", "mode", "appearance", "colour", "color"],
  },
  github: {
    title: "GitHub",
    description: "My contributions this year, day by day.",
    icon: "github",
    input: "github",
    aliases: ["github", "gh", "contributions"],
    keywords: ["code", "contributions", "repos", "open", "source", social("GitHub")?.handle ?? ""],
  },
  x: {
    title: "X",
    description: "Follow along on X.",
    icon: "x",
    input: "x",
    aliases: ["x", "twitter"],
    keywords: ["twitter", "tweets", "posts", social("X")?.handle ?? ""],
  },
  instagram: {
    title: "Instagram",
    description: "Follow along on Instagram.",
    icon: "instagram",
    input: "instagram",
    aliases: ["instagram", "insta", "ig"],
    keywords: ["photos", "insta", "ig", social("Instagram")?.handle ?? ""],
  },
  spotify: {
    title: "Spotify",
    description: "See what I'm listening to.",
    icon: "spotify",
    input: "spotify",
    // No alias: "spotify" should also find the Spotify Wrapped project.
    aliases: [],
    keywords: ["music", "playlists", "listening", "songs"],
  },
};

/** The views a social profile backs, keyed by its name in site.socials. */
export const SOCIAL_VIEWS = { GitHub: "github", X: "x", Instagram: "instagram", Spotify: "spotify" } as const;

const socialViews = Object.entries(SOCIAL_VIEWS)
  .filter(([name]) => social(name))
  .map(([, view]) => view);

/** The palette, top to bottom. */
export const SHORTCUTS: readonly PanelView[] = [
  "home",
  "guestbook",
  "book-call",
  "say-hi",
  "work",
  "writing",
  "lab",
  "theme",
  ...socialViews,
];

export type PaletteItem =
  | { kind: "view"; id: string; view: PanelView; title: string; description: string; icon: IconName }
  | { kind: "project"; id: string; slug: string; title: string; description: string }
  | { kind: "message"; id: string; message: string; title: string; description: string };

const shortcutItem = (view: PanelView): PaletteItem => ({
  kind: "view",
  id: view,
  view,
  title: VIEWS[view].title,
  description: VIEWS[view].description,
  icon: VIEWS[view].icon,
});

const ALL_SHORTCUTS = SHORTCUTS.map(shortcutItem);

/** Project names and slugs: they also find the Work shortcut, after the project itself. */
const PROJECT_WORDS = projects.flatMap((project) => [project.name, project.slug.replace(/-/g, " ")]).join(" ");

/**
 * The list for a query: matching shortcuts in their usual order, then
 * matching projects, so Enter on a project's name opens that project. The
 * Work shortcut also turns up for a project's name, below the project.
 */
export function paletteItems(query: string): PaletteItem[] {
  const q = query.trim();
  if (!q) return ALL_SHORTCUTS;

  const found: PaletteItem[] = ALL_SHORTCUTS.filter((item) =>
    item.kind === "view"
      ? matches(q, `${item.title} ${item.description} ${VIEWS[item.view].keywords.join(" ")}`)
      : false,
  );

  let projectMatched = false;
  for (const project of projects) {
    if (matches(q, `${project.name} ${project.slug.replace(/-/g, " ")}`)) {
      projectMatched = true;
      found.push({
        kind: "project",
        id: `project-${project.slug}`,
        slug: project.slug,
        title: project.name,
        description: project.tagline,
      });
    }
  }
  const work = ALL_SHORTCUTS.find((item) => item.kind === "view" && item.view === "work");
  if (projectMatched && work && !found.includes(work) && matches(q, PROJECT_WORDS)) found.push(work);

  // A sentence that is not a command reads like a note: offer to send it.
  if (normalize(q).split(" ").length >= 2 && q.length >= 8) {
    const parsed = parseMessage(q);
    found.unshift({
      kind: "message",
      id: "message",
      message: parsed.message || q,
      title: "Send this as a message",
      description: `“${q}”`,
    });
  }

  return found;
}

export type Resolution =
  | { view: "palette" }
  | { view: PanelView }
  | { view: "say-hi"; parsed: ParsedMessage };

const stripPunctuation = (text: string) => normalize(text).replace(/[^\p{L}\p{N}@'\s.+-]/gu, " ").replace(/\s+/g, " ").trim();

/** Which view a typed query asks for. */
export function resolveQuery(query: string): Resolution {
  const raw = query.trim();
  if (!raw) return { view: "palette" };

  const parsed = parseMessage(raw);
  if (parsed.intent) return { view: "say-hi", parsed };

  const q = stripPunctuation(raw);
  for (const view of Object.keys(VIEWS) as PanelView[]) {
    const { aliases } = VIEWS[view];
    if (aliases.includes(q)) return { view };
    // Part-way through a longer name: "book a cal", "sign my g".
    if (q.length >= 4 && q.includes(" ") && aliases.some((alias) => alias.length > q.length && alias.startsWith(q))) {
      return { view };
    }
  }
  return { view: "palette" };
}
