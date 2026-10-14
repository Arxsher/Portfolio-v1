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
