"use client";

// Client-side guestbook state shared by the home section, the /guestbook
// wall and the sign form: one fetch, one cache, and every view updates the
// moment someone signs in this tab.
//
//   const { status, entries, count, retry } = useGuestbook(5);
//   const count = useGuestbookCount();
//
// The first render (and the static HTML) is always the loading state, so
// hydration matches; the data arrives right after.

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { guestbookClient, type GuestbookClient, type GuestbookEntry } from "@/lib/guestbook";

export type GuestbookStatus = "disabled" | "loading" | "ready" | "error";

export type GuestbookSnapshot = {
  status: GuestbookStatus;
  /** Newest first. */
  entries: GuestbookEntry[];
  /** Total signatures, or null while unknown. */
  count: number | null;
  error: string | null;
};

const STALE_MS = 30_000;
const LOAD_ERROR = "Couldn't load the paper planes right now.";

type Store = {
  subscribe(listener: () => void): () => void;
  get(): GuestbookSnapshot;
  server(): GuestbookSnapshot;
  load(limit: number): Promise<void>;
  loadCount(): Promise<void>;
};

function createStore(client: GuestbookClient): Store {
  const initial: GuestbookSnapshot = {
    status: client.enabled ? "loading" : "disabled",
    entries: [],
    count: client.enabled ? null : 0,
    error: null,
  };
  let snapshot = initial;
  let loadedLimit = 0;
  let loadedAt = 0;
  let countAt = 0;
  let pending: { limit: number; promise: Promise<void> } | null = null;
  let pendingCount: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const set = (patch: Partial<GuestbookSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };

  client.subscribe((change) => {
    if (change.type !== "created") return;
    const { entry } = change;
    set({
      status: "ready",
      error: null,
      entries: [entry, ...snapshot.entries.filter((e) => e.id !== entry.id)],
      count: snapshot.count === null ? null : snapshot.count + 1,
    });
    loadedLimit += 1;
  });

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get: () => snapshot,
    server: () => initial,

    load(limit) {
      if (!client.enabled) return Promise.resolve();
      const fresh = Date.now() - loadedAt < STALE_MS;
      if (snapshot.status === "ready" && loadedLimit >= limit && fresh) return Promise.resolve();
      if (pending && pending.limit >= limit) return pending.promise;
      if (snapshot.status !== "ready") set({ status: "loading", error: null });
      const promise = (async () => {
        const [list, total] = await Promise.allSettled([client.list(limit), client.count()]);
        const count = total.status === "fulfilled" ? total.value : snapshot.count;
        if (total.status === "fulfilled") countAt = Date.now();
        if (list.status === "fulfilled") {
          loadedLimit = limit;
          loadedAt = Date.now();
          set({ status: "ready", entries: list.value, count, error: null });
        } else if (snapshot.status !== "ready") {
          set({ status: "error", count, error: messageOf(list.reason) });
        }
      })().finally(() => {
        if (pending?.promise === promise) pending = null;
      });
      pending = { limit, promise };
      return promise;
    },

    loadCount() {
      if (!client.enabled) return Promise.resolve();
      if (snapshot.count !== null && Date.now() - countAt < STALE_MS) return Promise.resolve();
      if (pendingCount) return pendingCount;
      pendingCount = client
        .count()
        .then(
          (count) => {
            countAt = Date.now();
            set({ count });
          },
          () => {
            // The counter just stays as it is.
          },
        )
        .finally(() => {
          pendingCount = null;
        });
      return pendingCount;
    },
  };
}

function messageOf(reason: unknown): string {
  return reason instanceof Error && reason.message ? reason.message : LOAD_ERROR;
}

const stores = new WeakMap<GuestbookClient, Store>();
function storeFor(client: GuestbookClient): Store {
  let store = stores.get(client);
  if (!store) {
    store = createStore(client);
    stores.set(client, store);
  }
  return store;
}

const ClientContext = createContext<GuestbookClient>(guestbookClient);

/** Point the guestbook views below at another client (e.g. in tests). */
export function GuestbookClientProvider({ client, children }: { client: GuestbookClient; children: ReactNode }) {
  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}

export function useGuestbookClient(): GuestbookClient {
  return useContext(ClientContext);
}

/**
 * Entries (newest first, at most `limit`) and the total count. `retry`
 * asks again after a failed load (it is a no-op while one is running).
 */
export function useGuestbook(limit: number): GuestbookSnapshot & { enabled: boolean; retry: () => void } {
  const client = useGuestbookClient();
  const store = storeFor(client);
  const snapshot = useSyncExternalStore(store.subscribe, store.get, store.server);
  useEffect(() => {
    void store.load(limit);
  }, [store, limit]);
  const retry = useCallback(() => {
    void store.load(limit);
  }, [store, limit]);
  const entries = snapshot.entries.length > limit ? snapshot.entries.slice(0, limit) : snapshot.entries;
  return { ...snapshot, entries, enabled: client.enabled, retry };
}

/** Just the total, for the sign form's counter. Null until known. */
export function useGuestbookCount(): number | null {
  const client = useGuestbookClient();
  const store = storeFor(client);
  const snapshot = useSyncExternalStore(store.subscribe, store.get, store.server);
  useEffect(() => {
    void store.loadCount();
  }, [store]);
  return snapshot.count;
}
