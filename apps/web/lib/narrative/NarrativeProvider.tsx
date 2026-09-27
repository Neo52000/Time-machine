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
  type NarrativeEventData,
  type NarrativeState,
} from "@time-machine/narrative-engine";
import { useAudio } from "@/lib/audio/AudioProvider";

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

interface NarrativeApi {
  emit: (type: NarrativeEventType, data?: NarrativeEventData) => void;
  notifications: NarrativeNotification[];
  dismiss: (id: number) => void;
  /** Files the story added to the virtual disk, in creation order. */
  createdFiles: CreatedFile[];
}

const NarrativeContext = createContext<NarrativeApi>({
  emit: () => undefined,
  notifications: [],
  dismiss: () => undefined,
  createdFiles: [],
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
  const stateRef = useRef<NarrativeState>(createNarrativeState());
  const nextId = useRef(1);
  const [notifications, setNotifications] = useState<NarrativeNotification[]>([]);
  const [createdFiles, setCreatedFiles] = useState<CreatedFile[]>([]);
  const audio = useAudio();

  const emit = useCallback(
    (type: NarrativeEventType, data?: NarrativeEventData) => {
      const result = dispatch(triggers, stateRef.current, { type, data });
      stateRef.current = result.state;
      for (const action of result.actions) {
        switch (action.type) {
          case "show.notification": {
            const notification = { id: nextId.current++, ...action.payload };
            setNotifications((list) => [...list, notification]);
            break;
          }
          case "create.file": {
            const file = action.payload;
            setCreatedFiles((list) =>
              list.some((f) => f.path === file.path) ? list : [...list, file],
            );
            break;
          }
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
    [triggers, audio, eraId],
  );

  const dismiss = useCallback((id: number) => {
    setNotifications((list) => list.filter((n) => n.id !== id));
  }, []);

  const api = useMemo(
    () => ({ emit, notifications, dismiss, createdFiles }),
    [emit, notifications, dismiss, createdFiles],
  );
  return <NarrativeContext.Provider value={api}>{children}</NarrativeContext.Provider>;
}
