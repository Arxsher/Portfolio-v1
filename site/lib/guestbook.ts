// Guestbook storage: a single Supabase table (see supabase/guestbook.sql),
// talked to through its REST API with plain fetch. No SDK. On the site each
// entry is a paper plane (components/guestbook/planes); the messages below
// use that language.
//
//   guestbookEnabled            true once NEXT_PUBLIC_SUPABASE_URL and
//                               NEXT_PUBLIC_SUPABASE_ANON_KEY are set
//   listEntries(limit?)         newest first
//   countEntries()              total number of signatures
//   createEntry({ … })          signs the book, resolves to the saved row
//   onGuestbookChange(fn)       fires after this tab signed (home section,
//                               /guestbook and the sign form stay in sync)
//
// When the guestbook isn't configured every read resolves to an empty
// result and createEntry rejects with a friendly GuestbookError. Failures
// are always GuestbookError with a message that can be shown as is.

import { site } from "@/content/site";

export type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  /** Compact SVG path data (M/L/Q commands) in a 600-unit-wide space. */
  signature: string;
  created_at: string;
};

export type NewGuestbookEntry = Pick<GuestbookEntry, "name" | "message" | "signature">;

/** Same limits as the check constraints in supabase/guestbook.sql. */
export const GUESTBOOK_LIMITS = { name: 40, message: 120, signature: 20000 } as const;

/** Only the characters the signature pad writes. Also enforced in SQL. */
export const SIGNATURE_PATTERN = /^[MLQ0-9 .-]+$/;

export class GuestbookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestbookError";
  }
}

export type GuestbookChange = { type: "created"; entry: GuestbookEntry };

export type GuestbookClient = {
  enabled: boolean;
  list(limit?: number): Promise<GuestbookEntry[]>;
  count(): Promise<number>;
  create(input: NewGuestbookEntry): Promise<GuestbookEntry>;
  subscribe(listener: (change: GuestbookChange) => void): () => void;
};

const TABLE = "guestbook";
const COLUMNS = "id,name,message,signature,created_at";
const TIMEOUT_MS = 12000;
// Supabase's default max-rows. Asking for more just returns this many.
const MAX_ROWS = 1000;

const MESSAGES = {
  disabled: "Paper planes aren't connected yet.",
  offline: "The sky is out of reach right now. Try again in a moment.",
  timeout: "That took too long to land. Please try again.",
  rejected: "That note couldn't be sent. Please check it and try again.",
  busy: "Lots of planes in the air right now. Give it a minute and try again.",
  server: "Something's off on the other end. Please try again shortly.",
  load: "Couldn't load the paper planes right now.",
} as const;

/**
 * Build a client for one Supabase project. The site uses the default one
 * below; tests can point a second one somewhere else.
 */
export function createGuestbookClient(config: { url: string; anonKey: string }): GuestbookClient {
  const base = config.url.trim().replace(/\/+$/, "");
  const key = config.anonKey.trim();
  const enabled = Boolean(base && key);
  const endpoint = `${base}/rest/v1/${TABLE}`;
  const listeners = new Set<(change: GuestbookChange) => void>();

  // Legacy anon keys are JWTs and go in both headers. The newer
  // publishable keys (sb_publishable_…) are not JWTs and only go in apikey.
  const headers = (extra?: Record<string, string>): Record<string, string> => ({
    apikey: key,
    ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
    Accept: "application/json",
    ...extra,
  });

  async function request(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new GuestbookError(messageForStatus(response.status));
      return response;
    } catch (error) {
      if (error instanceof GuestbookError) throw error;
      if (controller.signal.aborted) throw new GuestbookError(MESSAGES.timeout);
      throw new GuestbookError(MESSAGES.offline);
    } finally {
      clearTimeout(timer);
    }
  }

  // One count request at a time; the sign form, the home section and the
  // page can all ask for it at once.
  let countInFlight: Promise<number> | null = null;

  return {
    enabled,

    async list(limit = 100) {
      if (!enabled) return [];
      const rows = Math.max(1, Math.min(MAX_ROWS, Math.floor(limit)));
      const query = `select=${COLUMNS}&order=created_at.desc,id.desc&limit=${rows}`;
      const response = await request(`${endpoint}?${query}`, { method: "GET", headers: headers() });
      const data: unknown = await response.json().catch(() => {
        throw new GuestbookError(MESSAGES.load);
      });
      return Array.isArray(data) ? data.filter(isEntry) : [];
    },

    count() {
      if (!enabled) return Promise.resolve(0);
      if (countInFlight) return countInFlight;
      countInFlight = (async () => {
        try {
          // HEAD: only the headers come back. limit=1 keeps the row window
          // tiny; the exact total is in Content-Range either way.
          const response = await request(`${endpoint}?select=id&limit=1`, {
            method: "HEAD",
            headers: headers({ Prefer: "count=exact" }),
          });
          // "0-0/83", or "*/0" when the table is empty.
          const range = response.headers.get("content-range") ?? "";
          const total = Number(range.split("/")[1]);
          if (!Number.isFinite(total)) throw new GuestbookError(MESSAGES.load);
          return total;
        } finally {
          countInFlight = null;
        }
      })();
      return countInFlight;
    },

    async create(input) {
      if (!enabled) throw new GuestbookError(MESSAGES.disabled);
      const entry = cleanEntry(input);
      const response = await request(endpoint, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
        body: JSON.stringify(entry),
      });
      const data: unknown = await response.json().catch(() => null);
      const saved = Array.isArray(data) ? data[0] : data;
      // The row is in; fall back to what was sent if the echo is missing.
      const result: GuestbookEntry = isEntry(saved)
        ? saved
        : { id: `local-${Date.now()}`, created_at: new Date().toISOString(), ...entry };
      [...listeners].forEach((listener) => listener({ type: "created", entry: result }));
      return result;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Trim and check a new entry against the table's limits. */
export function cleanEntry(input: NewGuestbookEntry): NewGuestbookEntry {
  const name = input.name.trim().replace(/\s+/g, " ");
  const message = input.message.trim().replace(/\s+/g, " ");
  const signature = input.signature.trim();
  if (!name) throw new GuestbookError("Add your name first.");
  if (!message) throw new GuestbookError("Write a short message first.");
  if (!signature) throw new GuestbookError("Add a doodle, or sign with your name, first.");
  if ([...name].length > GUESTBOOK_LIMITS.name) {
    throw new GuestbookError(`Names can be up to ${GUESTBOOK_LIMITS.name} characters.`);
  }
  if ([...message].length > GUESTBOOK_LIMITS.message) {
    throw new GuestbookError(`Messages can be up to ${GUESTBOOK_LIMITS.message} characters.`);
  }
  if (signature.length > GUESTBOOK_LIMITS.signature || !SIGNATURE_PATTERN.test(signature)) {
    throw new GuestbookError("That doodle is a little too detailed. Clear it and try a simpler one.");
  }
  return { name, message, signature };
}

function messageForStatus(status: number): string {
  if (status === 429) return MESSAGES.busy;
  if (status >= 500) return MESSAGES.server;
  return MESSAGES.rejected;
}

function isEntry(value: unknown): value is GuestbookEntry {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.message === "string" &&
    typeof row.signature === "string" &&
    typeof row.created_at === "string"
  );
}

/* ---------------------------------------------------------------------- */
/* the site's guestbook                                                    */
/* ---------------------------------------------------------------------- */

export const guestbookClient: GuestbookClient = createGuestbookClient({
  url: site.supabaseUrl,
  anonKey: site.supabaseAnonKey,
});

export const guestbookEnabled: boolean = guestbookClient.enabled;

export function listEntries(limit?: number): Promise<GuestbookEntry[]> {
  return guestbookClient.list(limit);
}

export function countEntries(): Promise<number> {
  return guestbookClient.count();
}

export function createEntry(input: NewGuestbookEntry): Promise<GuestbookEntry> {
  return guestbookClient.create(input);
}

export function onGuestbookChange(listener: (change: GuestbookChange) => void): () => void {
  return guestbookClient.subscribe(listener);
}
