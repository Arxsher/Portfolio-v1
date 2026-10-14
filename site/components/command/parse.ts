// Reading what people type into the command bar.
//
//   parseMessage("hi, i'm sam, sam@site.com, love your work")
//     → { name: "Sam", email: "sam@site.com", message: "love your work", … }
//
//   matches("wri", "Writing Longer pieces I have published")  → true
//
// Pure functions only (no React, no DOM), so they can be tested with node.

export type ParsedMessage = {
  /** "Sam", "Sam Lee" … when the text introduces someone ("i'm sam"). */
  name?: string;
  /** The first email address in the text. */
  email?: string;
  /** What is left once the greeting, the introduction and the email are taken out. */
  message: string;
  /** The whole text is a greeting ("hi", "hey there!"). */
  greeting: boolean;
  /** Enough to treat the text as a message: an email, a name, or a bare greeting. */
  intent: boolean;
};

const EMAIL_IN_TEXT = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/i;
const EMAIL_EXACT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const GREETING =
  /^(?:hi|hii+|hey|heya|hey there|hi there|hello|hello there|hiya|howdy|yo|sup|greetings|good (?:morning|afternoon|evening|day)|hola|bonjour|salut|salam|salaam|hallo|moin|ciao|ola|olá)$/i;

/** "i'm", "i am", "my name is" … followed by the name. */
const INTRO = /^(?:(?:i['’]?m|i am|im|my name is|my name['’]?s|name['’]?s|call me)\s+)(.+)$/i;
/** Weaker openers that only count when exactly one capitalised word follows ("this is Sam"). */
const SOFT_INTRO = /^(?:this is|it['’]?s)\s+([A-Z][\p{L}'-]*)$/u;

/** Words that follow "i'm" without being a name ("i'm a designer", "i'm so glad"). */
const NOT_A_NAME = new Set(
  (
    "a an the so very just really not here there looking interested happy glad from at with writing " +
    "reaching curious in on and also too back new big huge fan building working trying wondering hoping " +
    "sure good fine great ok okay sorry thinking about going getting still currently available sending " +
    "contacting asking emailing messaging into using loving based out over all your you of to for is"
  ).split(" "),
);

/** Lowercase, straight quotes, single spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** The words of a string, for prefix matching ("Send me a message" → send, me, a, message). */
export function words(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}\p{N}@'+-]+/u)
    .map((word) => word.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

/**
 * Does `query` match `haystack`? Every word of the query has to start a
 * word of the haystack. A query of one letter only matches a whole word,
 * so a single keystroke does not light up half the list.
 */
export function matches(query: string, haystack: string): boolean {
  const needles = words(query);
  if (needles.length === 0) return false;
  const hay = words(haystack);
  // A lone single letter has to be a whole word ("x"); inside a longer
  // query the last letter is just the word being typed ("say h").
  if (needles.length === 1 && needles[0].length < 2) return hay.includes(needles[0]);
  return needles.every((needle) => hay.some((word) => word.startsWith(needle)));
}

export function isEmail(value: string): boolean {
  return EMAIL_EXACT.test(value.trim());
}

const capitalise = (word: string) =>
  word
    .split(/([-'])/)
    .map((part) => (part.length > 0 && part !== "-" && part !== "'" ? part[0].toUpperCase() + part.slice(1) : part))
    .join("");

/** "sam" / "sam lee" / "Sam Lee from Berlin" → the name, or undefined. */
function readName(rest: string): string | undefined {
  const tokens = rest.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return undefined;
  const clean = tokens.map((token) => token.replace(/[^\p{L}'-]/gu, ""));
  const first = clean[0];
  if (!first || first.length < 2 || NOT_A_NAME.has(first.toLowerCase())) return undefined;
  const picked = [first];
  // A short clause ("i'm sam lee") is all name; in a longer one only a
  // capitalised second word counts ("I'm Sam Lee from Berlin").
  const second = clean[1];
  if (
    second &&
    second.length > 1 &&
    !NOT_A_NAME.has(second.toLowerCase()) &&
    (tokens.length === 2 || /^\p{Lu}/u.test(second))
  ) {
    picked.push(second);
  }
  return picked.map(capitalise).join(" ").slice(0, 60);
}

const stripEdges = (text: string) => text.replace(/^[\s,.;:!?-]+|[\s,;:-]+$/g, "");

/** Pull a name, an email and the message out of free text. */
export function parseMessage(input: string): ParsedMessage {
  const text = input.replace(/[‘’`]/g, "'").replace(/\s+/g, " ").trim();
  const emailMatch = text.match(EMAIL_IN_TEXT);
  const email = emailMatch ? emailMatch[0].toLowerCase() : undefined;
  const withoutEmail = emailMatch ? text.replace(emailMatch[0], " , ") : text;

  // Clauses end at commas, semicolons, line breaks and sentence ends (the
  // sentence punctuation stays with its clause: "can we talk?").
  const clauses = withoutEmail
    .split(/[,;\n]|(?<=[.!?])\s+/)
    .map((clause) => clause.trim())
    .filter((clause) => /[\p{L}\p{N}]/u.test(clause));

  let name: string | undefined;
  const content: string[] = [];
  let greetings = 0;

  for (const clause of clauses) {
    const bare = clause.replace(/[.!?]+$/, "").trim();
    if (GREETING.test(bare)) {
      greetings += 1;
      continue;
    }
    // "hi i'm sam" in one clause: drop the greeting, read the rest.
    const greetingLead = bare.match(/^(hi|hey|hello|hiya|yo|howdy|heya)\s+(.+)$/i);
    const body = greetingLead ? greetingLead[2] : bare;
    if (!name) {
      const intro = body.match(INTRO);
      const soft = body.match(SOFT_INTRO);
      const found = intro ? readName(intro[1]) : soft ? readName(soft[1]) : undefined;
      if (found) {
        name = found;
        // Anything after the name in the same clause is message text
        // ("i'm sam and i love your work").
        const after = intro ? intro[1].trim().split(/\s+/).slice(found.split(" ").length).join(" ") : "";
        const tail = after.replace(/^(?:and|&)\s+/i, "");
        if (tail) content.push(tail);
        if (greetingLead) greetings += 1;
        continue;
      }
    }
    content.push(clause);
  }

  const greeting = clauses.length > 0 && greetings === clauses.length && !email;
  const message =
    content.length > 0
      ? stripEdges(content.join(", "))
      : // Nothing but a greeting and/or an introduction: keep the words as
        // the message ("hi, i'm sam"), minus the address.
        stripEdges(withoutEmail.replace(/\s*,\s*,\s*/g, ", ").replace(/\s+/g, " "));

  return {
    name,
    email,
    message: message.slice(0, 2000),
    greeting,
    intent: Boolean(email || name || greeting),
  };
}

/* ---------------------------------------------------------------------- */
/* fuzzy matching (the Index)                                              */
/* ---------------------------------------------------------------------- */

/** How well a query fits a label (lower is better) and which letters of the label it used. */
export type FuzzyHit = { score: number; hits: number[] };

const isWordChar = (char: string | undefined) => Boolean(char && /[\p{L}\p{N}]/u.test(char));

/** Lowercase with straight quotes, one character for one character (indices stay valid). */
const fold = (text: string) => text.toLowerCase().replace(/[‘’`]/g, "'").replace(/[“”]/g, '"');

/**
 * Subsequence matching for the Index: "lgl" finds "Liquid glass", "bkc"
 * finds "Book a call". Contiguous matches rank first (start of the label,
 * then the start of a word, then anywhere), then letters in order, the
 * closer together the better. A single letter only counts at the start of
 * a word, so one keystroke does not light up the whole list. Returns null
 * when the letters are not all there.
 *
 *   fuzzy("gla", "Liquid glass") → { score: 10.07, hits: [7, 8, 9] }
 */
export function fuzzy(query: string, label: string): FuzzyHit | null {
  const q = fold(query).replace(/\s+/g, " ").trim();
  if (!q) return { score: 0, hits: [] };
  const text = fold(label);

  const at = text.indexOf(q);
  if (at >= 0) {
    const wordStart = at === 0 || !isWordChar(text[at - 1]);
    if (q.length === 1 && !wordStart) return null;
    const hits: number[] = [];
    for (let index = at; index < at + q.length; index += 1) if (text[index] !== " ") hits.push(index);
    // the whole label scores 0; a prefix of a longer label a hair more
    return { score: at === 0 ? (text.length - q.length) / 1000 : wordStart ? 10 + at / 100 : 30 + at, hits };
  }
  if (q.replace(/ /g, "").length < 2) return null;

  // Letters in order: once taking the first occurrence of each letter, once
  // preferring an occurrence a little further on that starts a word
  // ("ac" in "Book a call" takes the "a" of "a" and the "c" of "call").
  const letters = [...q].filter((char) => char !== " ");
  let best: FuzzyHit | null = null;
  for (const preferStarts of [false, true]) {
    const hits = subsequence(text, letters, preferStarts);
    if (!hits) continue;
    const spread = hits[hits.length - 1] - hits[0] + 1 - hits.length;
    if (spread > Math.max(10, hits.length * 3)) continue;
    const starts = hits.filter((index) => index === 0 || !isWordChar(text[index - 1])).length;
    const score = 50 + spread + hits[0] / 10 - starts * 2;
    if (!best || score < best.score) best = { score, hits };
  }
  return best;
}

function subsequence(text: string, letters: string[], preferStarts: boolean): number[] | null {
  const hits: number[] = [];
  let from = 0;
  for (const char of letters) {
    let found = text.indexOf(char, from);
    if (found < 0) return null;
    if (preferStarts && found > 0 && isWordChar(text[found - 1])) {
      for (let probe = text.indexOf(char, found + 1); probe > 0 && probe - found <= 6; probe = text.indexOf(char, probe + 1)) {
        if (!isWordChar(text[probe - 1])) {
          found = probe;
          break;
        }
      }
    }
    hits.push(found);
    from = found + 1;
  }
  return hits;
}
