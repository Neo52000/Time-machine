"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { NarrativeEventType } from "@time-machine/content-schema";
import {
  createNarrativeState,
  dispatch,
  narrativeCatalog,
  stampFlag,
  type NarrativeEventData,
  type NarrativeState,
} from "@time-machine/narrative-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { awardStamp, readPassport } from "./passport";

/** DOM event fired for every trigger that fires, so tests can observe the story. */
export const NARRATIVE_DOM_EVENT = "tm:narrative";

export interface NarrativeNotification {
  id: number;
  title: string;
  body: string;
}

export interface CreatedFile {
  path: string;
  content: string;
}

/** A message the story makes a Messenger contact send. */
export interface StoryMessage {
  id: string;
  contactId: string;
  text: string;
}

interface NarrativeApi {
  emit: (type: NarrativeEventType, data?: NarrativeEventData) => void;
  notifications: NarrativeNotification[];
  dismiss: (id: number) => void;
  /** Files the story added to the virtual disk, in creation order. */
  createdFiles: CreatedFile[];
  storyMessages: StoryMessage[];
  /** Wallpaper colour unlocked by the story, if any. */
  wallpaper: string | null;
  /** Adds a text file to this session's disk (e.g. a BBS download). */
  createFile: (file: CreatedFile) => void;
}

const NarrativeContext = createContext<NarrativeApi>({
  emit: () => undefined,
  notifications: [],
  dismiss: () => undefined,
  createdFiles: [],
  storyMessages: [],
  wallpaper: null,
  createFile: () => undefined,
});

export function useNarrative(): NarrativeApi {
  return useContext(NarrativeContext);
}

/**
 * Runs the era's narrative triggers for one machine session. Apps only
 * `emit` what the user did; this provider feeds the pure engine and
 * performs the actions it returns (notification, sound, new file). Key it by
 * era so a new machine starts a fresh story.
 */
export function NarrativeProvider({ eraId, children }: { eraId: string; children: ReactNode }) {
  const triggers = useMemo(() => narrativeCatalog.forEra(eraId), [eraId]);
  // Seeded on first use (client only) with the stamps this browser already holds,
  // so era rewards also unlock for a returning visitor.
  const stateRef = useRef<NarrativeState | null>(null);
  const nextId = useRef(1);
  const [notifications, setNotifications] = useState<NarrativeNotification[]>([]);
  const [createdFiles, setCreatedFiles] = useState<CreatedFile[]>([]);
  const [storyMessages, setStoryMessages] = useState<StoryMessage[]>([]);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const audio = useAudio();

  const createFile = useCallback((file: CreatedFile) => {
    setCreatedFiles((list) => (list.some((f) => f.path === file.path) ? list : [...list, file]));
  }, []);

  const emit = useCallback(
    (type: NarrativeEventType, data?: NarrativeEventData) => {
      stateRef.current ??= createNarrativeState(Object.keys(readPassport()).map(stampFlag));
      const result = dispatch(triggers, stateRef.current, { type, data });
      stateRef.current = result.state;
      const notify = (title: string, body: string) => {
        const notification = { id: nextId.current++, title, body };
        setNotifications((list) => [...list, notification]);
      };
      for (const action of result.actions) {
        switch (action.type) {
          case "show.notification":
            notify(action.payload.title, action.payload.body);
            break;
          case "send.message": {
            const message = { id: `story-${nextId.current++}`, ...action.payload };
            setStoryMessages((list) => [...list, message]);
            break;
          }
          case "change.desktop":
            setWallpaper(action.payload.wallpaper);
            break;
          case "award.stamp": {
            const stamp = narrativeCatalog.getStamp(action.payload.stampId);
            // Celebrate only a first award; a stamp already in the passport stays quiet.
            if (stamp && awardStamp(stamp.id)) {
              notify("Tampon obtenu", `${stamp.icon} « ${stamp.title} » rejoint votre passeport.`);
            }
            break;
          }
          case "create.file":
            createFile(action.payload);
            break;
          case "play.sound":
            audio.play(action.payload.event);
            break;
          case "set.flag":
            // Already applied to the state by the engine.
            break;
          default:
            // The catalogue refuses actions this runtime does not perform.
            console.warn(`[narrative] unsupported action "${action.type}"`);
        }
      }
      for (const id of result.fired) {
        document.dispatchEvent(new CustomEvent(NARRATIVE_DOM_EVENT, { detail: { id, eraId } }));
      }
    },
    [triggers, audio, eraId, createFile],
  );

  const dismiss = useCallback((id: number) => {
    setNotifications((list) => list.filter((n) => n.id !== id));
  }, []);

  const api = useMemo(
    () => ({ emit, notifications, dismiss, createdFiles, storyMessages, wallpaper, createFile }),
    [emit, notifications, dismiss, createdFiles, storyMessages, wallpaper, createFile],
  );
  return <NarrativeContext.Provider value={api}>{children}</NarrativeContext.Provider>;
}
