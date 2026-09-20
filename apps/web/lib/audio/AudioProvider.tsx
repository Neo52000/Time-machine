"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { EraMachine, SoundEvent } from "@time-machine/content-schema";
import {
  DEFAULT_AUDIO_PREFERENCES,
  audioCatalog,
  parseAudioPreferences,
  resolveSoundCue,
  scheduleCue,
  toggleAudio,
  type AudioPreferences,
  type ScheduledSegment,
} from "@time-machine/audio-engine";

export const AUDIO_STORAGE_KEY = "time-machine-audio";
/** DOM event fired for every resolved cue (even when muted) so tests can observe playback. */
export const AUDIO_DOM_EVENT = "tm:audio";

export interface AudioCueEventDetail {
  event: SoundEvent;
  cueId: string;
  /** Segments actually scheduled — 0 when audio is off. */
  segments: number;
}

interface AudioApi {
  prefs: AudioPreferences;
  toggle: () => void;
  play: (event: SoundEvent) => void;
}

const AudioContextReact = createContext<AudioApi>({
  prefs: DEFAULT_AUDIO_PREFERENCES,
  toggle: () => undefined,
  play: () => undefined,
});

export function useAudio(): AudioApi {
  return useContext(AudioContextReact);
}

const ATTACK_S = 0.005;
const RELEASE_S = 0.008;

let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

/** Renders one scheduled segment with a click-free envelope. */
function renderSegment(ctx: AudioContext, segment: ScheduledSegment, originS: number): void {
  const start = originS + segment.startMs / 1000;
  const end = originS + segment.endMs / 1000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(segment.gain, start + ATTACK_S);
  gain.gain.setValueAtTime(segment.gain, Math.max(start + ATTACK_S, end - RELEASE_S));
  gain.gain.linearRampToValueAtTime(0, end);
  gain.connect(ctx.destination);

  let source: AudioScheduledSourceNode;
  if (segment.wave === "noise") {
    const node = ctx.createBufferSource();
    node.buffer = getNoiseBuffer(ctx);
    node.loop = true;
    source = node;
  } else {
    const osc = ctx.createOscillator();
    osc.type = segment.wave;
    osc.frequency.setValueAtTime(segment.frequency ?? 440, start);
    if (segment.frequencyTo !== undefined) {
      osc.frequency.linearRampToValueAtTime(segment.frequencyTo, end);
    }
    source = osc;
  }
  source.connect(gain);
  source.start(start);
  source.stop(end + RELEASE_S);
  source.addEventListener("ended", () => {
    source.disconnect();
    gain.disconnect();
  });
}

/**
 * The only place Web Audio is touched. Cues come from `@time-machine/audio-engine`
 * (data + pure scheduling); this provider owns the AudioContext, the user's
 * mute preference (persisted per browser) and the actual oscillators.
 */
export function AudioProvider({
  machine,
  children,
}: {
  machine: Pick<EraMachine, "sounds">;
  children: ReactNode;
}) {
  const [prefs, setPrefs] = useState<AudioPreferences>(DEFAULT_AUDIO_PREFERENCES);
  const prefsRef = useRef(prefs);
  const ctxRef = useRef<AudioContext | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
      if (raw) setPrefs(parseAudioPreferences(JSON.parse(raw)));
    } catch {
      // Unreadable storage: keep the defaults.
    }
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    prefsRef.current = prefs;
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage unavailable (private mode, quota): the preference just won't persist.
    }
  }, [prefs]);

  useEffect(
    () => () => {
      void ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    },
    [],
  );

  const play = useCallback(
    (event: SoundEvent) => {
      const cue = resolveSoundCue(audioCatalog, machine, event);
      if (!cue) return;
      const segments = scheduleCue(cue, 0, prefsRef.current);
      document.dispatchEvent(
        new CustomEvent<AudioCueEventDetail>(AUDIO_DOM_EVENT, {
          detail: { event, cueId: cue.id, segments: segments.length },
        }),
      );
      if (segments.length === 0 || typeof window.AudioContext !== "function") return;

      try {
        const ctx = (ctxRef.current ??= new window.AudioContext());
        if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
        const origin = ctx.currentTime + 0.01;
        for (const segment of segments) renderSegment(ctx, segment, origin);
      } catch {
        // Autoplay policy or an exotic browser: silence is acceptable.
      }
    },
    [machine],
  );

  const toggle = useCallback(() => setPrefs((p) => toggleAudio(p)), []);

  const api = useMemo<AudioApi>(() => ({ prefs, toggle, play }), [prefs, toggle, play]);

  return <AudioContextReact.Provider value={api}>{children}</AudioContextReact.Provider>;
}
