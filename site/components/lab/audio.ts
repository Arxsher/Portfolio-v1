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
//
// Phones only let audio start from a finished gesture: a finger's
// pointerdown doesn't count, its pointerup / touchend / click does. So on
// pages that make sound, every such gesture also unlocks the context (and
// plays one silent sample, which older iOS needs). On iOS the context uses
// the "playback" audio session, so the lab is heard with the silent switch
// on too; muting suspends the context and hands the speaker back (other
// apps' audio isn't held while the lab is quiet).

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
let suspendTimer = 0;
const listeners = new Set<() => void>();

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

/** iOS (Safari 16.4+): "playback" plays through the silent switch, "auto" gives the speaker back. */
function setSession(playing: boolean) {
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (!session) return;
  try {
    session.type = playing ? "playback" : "auto";
  } catch {}
}

/** From a gesture the browser counts: start (or restart) the context on pages that make sound. */
function unlock() {
  // a piece has made the context, or a mute button is on screen
  if (!kit && listeners.size === 0) return;
  if (muted || document.visibilityState === "hidden") return;
  if (kit && kit.ctx.state === "running") return;
  const audio = ensureAudio();
  if (!audio) return;
  try {
    const { ctx } = audio;
    const blip = ctx.createBufferSource();
    blip.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    blip.connect(ctx.destination);
    blip.start();
  } catch {}
}

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
  const options = { capture: true, passive: true } as const;
  for (const type of ["pointerup", "touchend", "click", "keydown"] as const) {
    window.addEventListener(type, unlock, options);
  }
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
      if (!muted) void kit.ctx.resume().catch(() => {});
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
    window.clearTimeout(suspendTimer);
    if (value) {
      // once the fade is done, let go of the speaker
      suspendTimer = window.setTimeout(() => {
        if (!muted || !kit) return;
        void kit.ctx.suspend().catch(() => {});
        setSession(false);
      }, 150);
    } else if (ctx.state !== "running" && ctx.state !== "closed" && document.visibilityState !== "hidden") {
      // unmuting is a click: start again right away
      setSession(true);
      void ctx.resume().catch(() => {});
    }
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
      if (!muted) setSession(true);
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
  // suspended, or interrupted (iOS: a call, another app took the speaker)
  const state = kit.ctx.state as string;
  if (!muted && state !== "running" && state !== "closed" && document.visibilityState !== "hidden") {
    setSession(true);
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
