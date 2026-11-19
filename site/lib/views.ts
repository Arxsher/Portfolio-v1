// View counts for the project pages, kept in Supabase next to the
// guestbook (table and function: supabase/views.sql). Plain fetch, no SDK.
//
//   viewsEnabled          true once the Supabase URL and key are set
//   recordView(slug)      counts this visit (once per tab session) and
//                         resolves to the page's total
//
// When Supabase isn't configured nothing is fetched and no count shows.

import { site } from "@/content/site";

const base = site.supabaseUrl.trim().replace(/\/+$/, "");
const key = site.supabaseAnonKey.trim();

export const viewsEnabled: boolean = Boolean(base && key);

const TIMEOUT_MS = 8000;

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: key,
    // Legacy anon keys are JWTs and also go in Authorization; the newer
    // publishable keys (sb_publishable_…) only go in apikey.
    ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
    Accept: "application/json",
    ...extra,
  };
}

async function request(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`views: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

const seenKey = (slug: string) => `arsher:viewed:${slug}`;

function seen(slug: string): boolean {
  try {
    return sessionStorage.getItem(seenKey(slug)) === "1";
  } catch {
    return false;
  }
}

function markSeen(slug: string) {
  try {
    sessionStorage.setItem(seenKey(slug), "1");
  } catch {
    // Storage off: the next reload counts again, which is fine.
  }
}

/** Count a visit to /projects/<slug>/ and return the total. */
export async function recordView(slug: string): Promise<number> {
  if (!viewsEnabled) throw new Error("views: not configured");
  if (seen(slug)) {
    const rows = await request(`${base}/rest/v1/project_views?select=views&slug=eq.${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: headers(),
    });
    const first = Array.isArray(rows) ? (rows[0] as { views?: unknown } | undefined) : undefined;
    return Number(first?.views ?? 0);
  }
  const total = await request(`${base}/rest/v1/rpc/count_project_view`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ page_slug: slug }),
  });
  markSeen(slug);
  const value = Number(total);
  if (!Number.isFinite(value)) throw new Error("views: bad response");
  return value;
}
