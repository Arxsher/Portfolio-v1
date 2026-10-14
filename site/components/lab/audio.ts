// Sound for the lab: one shared AudioContext for every piece, created (or
// resumed) only from a user gesture, a master gain behind a gentle limiter,
// and a global mute that persists in localStorage and syncs across tabs.
//
//   // inside a pointerdown / keydown / click handler:
//   const audio = ensureAudio();
//   if (audio && !isMuted()) {
//     const { ctx, output } = audio;
//     const osc = ctx.createOscillator();
//     …
//     osc.connect(gain).connect(output);
//   }
//
// Never call ensureAudio() outside a gesture (autoplay rules); elsewhere use
// getAudio(), which returns null until a gesture has created the context.
// When the tab is hidden the context is suspended, and resumed on return.

import { useSyncExternalStore } from "react";

export type AudioKit = {
  ctx: AudioContext;
  /** Connect your nodes here (master gain → limiter → speakers). */
  output: AudioNode;
  /** The master gain itself (0 while muted). */
  master: GainNode;
};

const STORAGE_KEY = "arsher:lab:muted";
const VOLUME = 0.9;

let kit: AudioKit | null = null;
let muted = false;
let loaded = false;
let resumeOnShow = false;
const listeners = new Set<() => void>();

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  muted = readStored();
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    applyMuted(readStored(), false);
  });
  document.addEventListener("visibilitychange", () => {
    if (!kit) return;
    if (document.visibilityState === "hidden") {
      if (kit.ctx.state === "running") {
        resumeOnShow = true;
        void kit.ctx.suspend().catch(() => {});
      }
    } else if (resumeOnShow) {
      resumeOnShow = false;
      void kit.ctx.resume().catch(() => {});
    }
  });
}

function notify() {
  [...listeners].forEach((listener) => listener());
}

function applyMuted(value: boolean, persist: boolean) {
  muted = value;
  if (persist) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, "1");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  if (kit) {
    const { ctx, master } = kit;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(value ? 0 : VOLUME, ctx.currentTime, 0.015);
  }
  notify();
}

/** The shared audio graph if a gesture has already created it, else null. */
export function getAudio(): AudioKit | null {
  return kit;
}

/**
 * Create the shared AudioContext (first call) or resume it. Call it from a
 * user gesture handler. Returns null when Web Audio isn't available.
 */
export function ensureAudio(): AudioKit | null {
  if (typeof window === "undefined") return null;
  load();
  if (!kit) {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      const ctx = new Ctor({ latencyHint: "interactive" });
      const master = ctx.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 8;
      limiter.ratio.value = 4;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      master.connect(limiter).connect(ctx.destination);
      kit = { ctx, output: master, master };
    } catch {
      return null;
    }
  }
  if (kit.ctx.state === "suspended" && document.visibilityState !== "hidden") {
    void kit.ctx.resume().catch(() => {});
  }
  return kit;
}

/** True when a sound scheduled now would be heard (context running and not muted). */
export function audioReady(): boolean {
  return Boolean(kit && kit.ctx.state === "running" && !muted);
}

export function isMuted(): boolean {
  load();
  return muted;
}

export function setMuted(value: boolean) {
  load();
  applyMuted(value, true);
}

export function toggleMuted() {
  setMuted(!isMuted());
}

/** Listen for mute changes. Returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The mute flag as React state (false during SSR and hydration). */
export function useMuted(): boolean {
  return useSyncExternalStore(subscribe, isMuted, () => false);
}

const noiseCache = new WeakMap<AudioContext, AudioBuffer>();

/** One second (or `seconds`) of white noise for this context, cached. */
export function noiseBuffer(ctx: AudioContext, seconds = 1): AudioBuffer {
  const cached = noiseCache.get(ctx);
  if (cached && cached.duration >= seconds) return cached;
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x2545f491;
  for (let i = 0; i < length; i++) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    data[i] = ((seed >>> 0) / 4294967296) * 2 - 1;
  }
  noiseCache.set(ctx, buffer);
  return buffer;
}
