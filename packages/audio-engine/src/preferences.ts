export interface AudioPreferences {
  enabled: boolean;
  /** 0..1 master volume. */
  volume: number;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = { enabled: true, volume: 0.5 };

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_AUDIO_PREFERENCES.volume;
  return Math.min(1, Math.max(0, volume));
}

/**
 * Tolerant parser for persisted preferences: anything unreadable falls back
 * to the defaults field by field, so a stale or hand-edited value can never
 * break the app.
 */
export function parseAudioPreferences(raw: unknown): AudioPreferences {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_AUDIO_PREFERENCES };
  const record = raw as Record<string, unknown>;
  return {
    enabled:
      typeof record.enabled === "boolean" ? record.enabled : DEFAULT_AUDIO_PREFERENCES.enabled,
    volume:
      typeof record.volume === "number"
        ? clampVolume(record.volume)
        : DEFAULT_AUDIO_PREFERENCES.volume,
  };
}

export function toggleAudio(prefs: AudioPreferences): AudioPreferences {
  return { ...prefs, enabled: !prefs.enabled };
}

export function setVolume(prefs: AudioPreferences, volume: number): AudioPreferences {
  return { ...prefs, volume: clampVolume(volume) };
}
