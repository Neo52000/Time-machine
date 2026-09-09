import type { VideoClip } from "@time-machine/content-schema";

/**
 * Player — pure playback state advanced by `tick(deltaMs)`. The UI owns the
 * real animation frame / interval and never touches `positionMs` directly
 * except through `seek`.
 */
export type PlayerStatus = "paused" | "playing" | "ended";

export interface PlayerState {
  clipId: string;
  durationMs: number;
  positionMs: number;
  status: PlayerStatus;
}

export function createPlayerState(clip: VideoClip): PlayerState {
  return {
    clipId: clip.id,
    durationMs: clip.durationSeconds * 1000,
    positionMs: 0,
    status: "paused",
  };
}

export function play(state: PlayerState): PlayerState {
  if (state.status === "ended" || state.positionMs >= state.durationMs) {
    return { ...state, positionMs: 0, status: "playing" };
  }
  return { ...state, status: "playing" };
}

export function pause(state: PlayerState): PlayerState {
  return state.status === "playing" ? { ...state, status: "paused" } : state;
}

export function seek(state: PlayerState, positionMs: number): PlayerState {
  const clamped = Math.min(Math.max(positionMs, 0), state.durationMs);
  return {
    ...state,
    positionMs: clamped,
    status: state.status === "ended" && clamped < state.durationMs ? "paused" : state.status,
  };
}

export function tick(state: PlayerState, deltaMs: number): PlayerState {
  if (state.status !== "playing") return state;
  const positionMs = state.positionMs + deltaMs;
  if (positionMs >= state.durationMs) {
    return { ...state, positionMs: state.durationMs, status: "ended" };
  }
  return { ...state, positionMs };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
