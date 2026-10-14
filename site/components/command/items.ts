// What the Index knows about: its panels (the views it can turn into), the
// entries it lists, and how a typed query becomes a ranked, grouped list.
//
// Before anything is typed the Index is a short table of contents:
//
//   On this page   Top of the page, then the sections of the page you are on
//   Pages          (away from home) the front page and the section pages
//   Get in touch   Write a note · Book a call · Copy the address · Sign the guestbook
//   Work / Lab / Writing   one "Browse …" entry each, opening a small panel
//   Elsewhere      GitHub, X, Instagram, Spotify
//   Settings       day / night, the theme panel, single-key shortcuts
//
// Typing searches everything, every project, lab piece and post included,
// with fuzzy matching (parse.ts → fuzzy). A query that reads like a note
// ("hi, i'm sam, sam@site.com, love your work") is offered as "Send this as
// a note" at the top, and opens the contact sheet with the form filled in.

import type { CommandPrefill, CommandView } from "@/lib/command";
import { GUESTBOOK_PANEL } from "@/components/guestbook/sign-form";
import { pieces } from "@/components/lab/registry";
import { CATEGORY_SINGULAR } from "@/components/lab/types";
import { categoryLabel } from "@/components/project-row";
import { projects, site } from "@/content/site";
import type { Theme } from "@/lib/theme";
import { fuzzy, matches, normalize, parseMessage } from "./parse";

/* ---------------------------------------------------------------------- */
/* panels                                                                  */
/* ---------------------------------------------------------------------- */

/** The views the sheet can show besides the Index itself. */
export type PanelView =
  | Exclude<CommandView, "palette">
  | "work"
  | "writing"
  | "lab"
  | "theme"
  | "github"
  | "x"
  | "instagram"
  | "spotify";

export type SheetView = "palette" | PanelView;

export type PanelInfo = {
  /** The serif-italic title in the panel head. */
  title: string;
  /** One quiet line under the title (optional). */
  description?: string;
};

const social = (name: string) => site.socials.find((entry) => entry.name === name);
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const PANELS: Record<PanelView, PanelInfo> = {
  "say-hi": { title: "Get in touch" },
  "book-call": { title: "Get in touch" },
  guestbook: { title: GUESTBOOK_PANEL.title, description: GUESTBOOK_PANEL.description },
  work: { title: "The work", description: "Products, client sites and experiments, each with a page of its own." },
  lab: { title: "The lab", description: "Small pieces drawn in code. Each one runs live on its page." },
  writing: { title: "Writing", description: "Essays I have published, newest first." },
  theme: { title: "Day & night", description: "Sand paper by day, indigo ink by night." },
  github: { title: "On GitHub" },
  x: { title: "X" },
  instagram: { title: "Instagram" },
  spotify: { title: "Spotify" },
};

/** Say hi and Book a call are the two tabs of one contact sheet. */
export const panelKey = (view: SheetView) => (view === "say-hi" || view === "book-call" ? "contact" : view);

/** The views a social profile backs, keyed by its name in site.socials. */
export const SOCIAL_VIEWS = { GitHub: "github", X: "x", Instagram: "instagram", Spotify: "spotify" } as const;

/* ---------------------------------------------------------------------- */
/* entries                                                                 */
/* ---------------------------------------------------------------------- */

export const GROUPS = [
  "On this page",
  "Pages",
  "Get in touch",
  "Work",
  "Lab",
  "Writing",
  "Elsewhere",
  "Settings",
] as const;

export type Group = (typeof GROUPS)[number];

/** What choosing an entry does. */
export type EntryAction =
  | { type: "view"; view: PanelView }
  | { type: "route"; href: string }
  | { type: "external"; href: string }
  | { type: "section"; id: string }
  | { type: "top" }
  | { type: "copy-email" }
  | { type: "toggle-theme" }
  | { type: "toggle-keys" }
  | { type: "message"; prefill: CommandPrefill };

export type Entry = {
  id: string;
  group: Group;
  label: string;
  /** Right-aligned, muted. */
  hint?: string;
  /** A keycap after the hint ("t"). */
  keycap?: string;
  /** Extra words the search matches on (word starts, no underline). */
  keywords?: string;
  /** Typed phrases that put this entry first ("book a call", "dark"). */
  aliases?: readonly string[];
  /** Listed before anything is typed. */
  primary: boolean;
  action: EntryAction;
};

/** A section of the current page, read from the DOM when the Index opens. */
export type PageSection = { id: string; label: string };

export type EntryContext = {
  pathname: string;
  sections: readonly PageSection[];
  dark: boolean;
  theme: Theme;
  singleKeys: boolean;
};

/** Labels for the home page's sections (DESIGN.md → Home), by id. */
export const SECTION_LABELS: Record<string, string> = {
  about: "About",
  contact: "Write to me",
  work: "Selected work",
  lab: "The lab",
  writing: "Notes & essays",
  github: "A year in commits",
  guestbook: "The guestbook",
};

const PAGES: ReadonlyArray<{ href: string; label: string; keywords: string }> = [
  { href: "/", label: "Front page", keywords: "home start index" },
  { href: "/projects/", label: "All work", keywords: "projects portfolio work page" },
  { href: "/lab/", label: "The lab", keywords: "lab pieces playground page" },
  { href: "/writing/", label: "Writing", keywords: "blog essays posts page" },
  { href: "/guestbook/", label: "Guestbook", keywords: "guestbook signatures page" },
];

function host(href: string) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

/** Every entry of the Index for the page you are on. */
export function buildEntries(context: EntryContext): Entry[] {
  const home = trimSlash(context.pathname) === "/";
  const here = trimSlash(context.pathname);
  const entries: Entry[] = [];

  // On this page
  entries.push({
    id: "top",
    group: "On this page",
    label: "Top of the page",
    keywords: "top start up beginning",
    aliases: home ? ["home", "top", "start"] : ["top"],
    primary: true,
    action: { type: "top" },
  });
  for (const section of context.sections) {
    entries.push({
      id: `section-${section.id}`,
      group: "On this page",
      label: section.label,
      keywords: `${section.id} section`,
      primary: true,
      action: { type: "section", id: section.id },
    });
  }

  // Pages (the front page and the section pages, minus the one you are on)
  for (const page of PAGES) {
    if (trimSlash(page.href) === here) continue;
    entries.push({
      id: `page-${page.href}`,
      group: "Pages",
      label: page.label,
      keywords: page.keywords,
      aliases: page.href === "/" ? ["home", "front page", "start"] : undefined,
      primary: !home,
      action: { type: "route", href: page.href },
    });
  }

  // Get in touch
  entries.push(
    {
      id: "say-hi",
      group: "Get in touch",
      label: "Write a note",
      hint: site.web3formsKey ? "Straight to my inbox" : "Through your mail app",
      keywords: "say hi hello email mail contact message write",
      aliases: ["say hi", "hi", "hello", "email", "email me", "mail", "contact", "message", "write", "note"],
      primary: true,
      action: { type: "view", view: "say-hi" },
    },
    {
      id: "book-call",
      group: "Get in touch",
      label: "Book a call",
      hint: site.calLink ? "On cal.com" : "By email for now",
      keywords: "call meeting meet schedule calendar cal chat time",
      aliases: ["book", "call", "book a call", "meet", "meeting", "schedule", "calendar"],
      primary: true,
      action: { type: "view", view: "book-call" },
    },
    {
      id: "copy-email",
      group: "Get in touch",
      label: "Copy the address",
      hint: site.email,
      keywords: "copy email address clipboard",
      aliases: ["copy", "copy email", "copy address"],
      primary: true,
      action: { type: "copy-email" },
    },
    {
      id: "guestbook",
      group: "Get in touch",
      label: GUESTBOOK_PANEL.title,
      hint: "Signed by hand",
      keywords: "guestbook sign signature book guest",
      aliases: ["guestbook", "sign", "sign the guestbook", "sign the book", "sign my guestbook"],
      primary: true,
      action: { type: "view", view: "guestbook" },
    },
  );

  // Work
  entries.push({
    id: "browse-work",
    group: "Work",
    label: "Browse the work",
    hint: plural(projects.length, "project", "projects"),
    keywords: "work projects portfolio",
    aliases: ["work", "my work", "projects", "portfolio"],
    primary: true,
    action: { type: "view", view: "work" },
  });
  for (const project of projects) {
    entries.push({
      id: `project-${project.slug}`,
      group: "Work",
      label: project.name,
      hint: project.tagline,
      keywords: `work project ${project.slug.replace(/-/g, " ")} ${categoryLabel(project.category)} ${project.tags.join(" ")}`,
      primary: false,
      action: { type: "route", href: `/projects/${project.slug}/` },
    });
  }

  // Lab
  entries.push({
    id: "browse-lab",
    group: "Lab",
    label: "Browse the lab",
    hint: plural(pieces.length, "piece", "pieces"),
    keywords: "lab pieces playground interactive canvas webgl generative components objects",
    aliases: ["lab", "the lab", "playground", "pieces"],
    primary: true,
    action: { type: "view", view: "lab" },
  });
  for (const piece of pieces) {
    entries.push({
      id: `piece-${piece.slug}`,
      group: "Lab",
      label: piece.title,
      hint: CATEGORY_SINGULAR[piece.category],
      keywords: `lab piece ${piece.slug.replace(/-/g, " ")} ${piece.summary} ${piece.uses.join(" ")}`,
      primary: false,
      action: { type: "route", href: `/lab/${piece.slug}/` },
    });
  }

  // Writing
  entries.push({
    id: "browse-writing",
    group: "Writing",
    label: "Browse the writing",
    hint: plural(site.writing.length, "essay", "essays"),
    keywords: "writing blog posts articles essays notes",
    aliases: ["writing", "blog", "posts", "articles", "essays"],
    primary: true,
    action: { type: "view", view: "writing" },
  });
  for (const post of site.writing) {
    entries.push({
      id: `post-${post.href}`,
      group: "Writing",
      label: post.title,
      hint: post.external ? `${host(post.href)} ↗` : undefined,
      keywords: "writing post essay article",
      primary: false,
      action: post.external ? { type: "external", href: post.href } : { type: "route", href: post.href },
    });
  }

  // Elsewhere
  for (const [name, view] of Object.entries(SOCIAL_VIEWS) as Array<[keyof typeof SOCIAL_VIEWS, PanelView]>) {
    const profile = social(name);
    if (!profile) continue;
    entries.push({
      id: `social-${view}`,
      group: "Elsewhere",
      label: name,
      hint: profile.handle,
      keywords:
        view === "github"
          ? "code contributions repos open source commits"
          : view === "x"
            ? "twitter tweets posts"
            : view === "instagram"
              ? "insta ig photos"
              : "music playlists listening songs",
      aliases: view === "github" ? ["github", "gh", "contributions"] : view === "x" ? ["x", "twitter"] : view === "instagram" ? ["instagram", "insta", "ig"] : [],
      primary: true,
      action: { type: "view", view },
    });
  }

  // Settings
  entries.push(
    {
      id: "toggle-theme",
      group: "Settings",
      label: context.dark ? "Switch to day" : "Switch to night",
      keycap: context.singleKeys ? "t" : undefined,
      keywords: "theme dark light day night mode toggle",
      primary: true,
      action: { type: "toggle-theme" },
    },
    {
      id: "theme",
      group: "Settings",
      label: "Day, night or system",
      hint: context.theme === "system" ? "Following your device" : context.theme === "dark" ? "Night" : "Day",
      keywords: "theme appearance colour color dark light system mode",
      aliases: ["theme", "dark", "light", "system", "dark mode", "light mode", "appearance", "day", "night"],
      primary: true,
      action: { type: "view", view: "theme" },
    },
    {
      id: "toggle-keys",
      group: "Settings",
      label: "Single-key shortcuts",
      hint: context.singleKeys ? "On" : "Off",
      keywords: "keyboard shortcuts keys hotkeys accessibility t j k g",
      aliases: ["shortcuts", "keys", "keyboard"],
      primary: true,
      action: { type: "toggle-keys" },
    },
  );

  return entries;
}

/* ---------------------------------------------------------------------- */
/* search                                                                  */
/* ---------------------------------------------------------------------- */

export type Result = { entry: Entry; hits: number[] };
export type ResultGroup = { group: Group; results: Result[] };
export type Search = { groups: ResultGroup[]; flat: Result[]; total: number };

const clean = (text: string) => normalize(text).replace(/[^\p{L}\p{N}@'\s.+-]/gu, " ").replace(/\s+/g, " ").trim();

/** The note a query reads as, if it reads as one ("hi, i'm sam …"). */
export function messageEntry(query: string): { entry: Entry; first: boolean } | null {
  const q = query.trim();
  if (!q) return null;
  const parsed = parseMessage(q);
  const sentence = normalize(q).split(" ").length >= 2 && q.length >= 8;
  if (!parsed.intent && !sentence) return null;
  const picked = [parsed.name, parsed.email].filter(Boolean).join(" · ");
  return {
    first: parsed.intent,
    entry: {
      id: "message",
      group: "Get in touch",
      label: "Send this as a note",
      hint: picked || `“${q.length > 36 ? `${q.slice(0, 35)}…` : q}”`,
      primary: false,
      action: { type: "message", prefill: { name: parsed.name, email: parsed.email, message: parsed.message || q } },
    },
  };
}

/**
 * Rank and group the entries for a query. Groups keep their usual order
 * until something is typed; then the group holding the best match comes
 * first, so Enter always takes the top row.
 */
export function search(entries: readonly Entry[], query: string): Search {
  const total = entries.length;
  const q = query.trim();
  let scored: Array<Result & { score: number; order: number }>;

  if (!q) {
    scored = entries.filter((entry) => entry.primary).map((entry, order) => ({ entry, hits: [], score: 0, order }));
  } else {
    const typed = clean(q);
    scored = [];
    entries.forEach((entry, order) => {
      if (entry.aliases?.includes(typed)) {
        const label = fuzzy(q, entry.label);
        scored.push({ entry, hits: label?.hits ?? [], score: -100 + order / 1000, order });
        return;
      }
      const label = fuzzy(q, entry.label);
      if (label) {
        scored.push({ entry, hits: label.hits, score: label.score, order });
        return;
      }
      const words = `${entry.keywords ?? ""} ${entry.hint ?? ""} ${entry.aliases?.join(" ") ?? ""}`;
      if (matches(q, words)) scored.push({ entry, hits: [], score: 200, order });
    });
    const note = messageEntry(q);
    if (note) scored.push({ entry: note.entry, hits: [], score: note.first ? -1000 : 900, order: -1 });
  }

  const byGroup = new Map<Group, Array<Result & { score: number; order: number }>>();
  for (const result of scored) {
    const list = byGroup.get(result.entry.group) ?? [];
    list.push(result);
    byGroup.set(result.entry.group, list);
  }
  const groups = [...byGroup.entries()].map(([group, list]) => {
    if (q) list.sort((a, b) => a.score - b.score || a.order - b.order);
    return { group, best: list[0].score, results: list.map(({ entry, hits }) => ({ entry, hits })) };
  });
  groups.sort((a, b) => (q ? a.best - b.best : 0) || GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));

  const flat = groups.flatMap((group) => group.results);
  return { groups: groups.map(({ group, results }) => ({ group, results })), flat, total };
}
