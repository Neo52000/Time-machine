"use client";

import { useCallback, useEffect } from "react";
import type { EraManifest } from "@time-machine/content-schema";
import { audioCatalog, cueDurationMs, resolveSoundCue } from "@time-machine/audio-engine";
import { machineCatalog } from "@time-machine/computer-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useDesktopStore } from "@/lib/desktopStore";

/**
 * The machine's network link. On a dial-up machine the first network use
 * plays the era's `dial` cue (the RTC modem handshake) and the link counts as
 * up once the cue has played; always-on links (broadband) are simply online.
 * Nothing waits on it: pages still resolve immediately, the modem is ambience.
 */
export function useNetworkConnection(era: EraManifest) {
  const link = machineCatalog.getMachine(era.machine.id)?.network;
  const connection = useDesktopStore((s) => s.connection);
  const setConnection = useDesktopStore((s) => s.setConnection);
  const audio = useAudio();

  const connect = useCallback(() => {
    if (useDesktopStore.getState().connection.phase !== "offline") return;
    if (link?.kind !== "dial-up") {
      setConnection({ phase: "online" });
      return;
    }
    const cue = resolveSoundCue(audioCatalog, era.machine, "dial");
    const handshakeMs = cue ? cueDurationMs(cue) : 0;
    audio.play("dial");
    setConnection(
      handshakeMs > 0 ? { phase: "dialing", until: Date.now() + handshakeMs } : { phase: "online" },
    );
  }, [link?.kind, era.machine, audio, setConnection]);

  /** Frees the phone line; the next network use dials again. */
  const hangUp = useCallback(() => {
    if (link?.kind !== "dial-up") return;
    if (useDesktopStore.getState().connection.phase === "offline") return;
    audio.stopAll(); // hanging up mid-handshake cuts the modem
    audio.play("disconnect");
    setConnection({ phase: "offline" });
  }, [link?.kind, audio, setConnection]);

  // Survives the browser window closing mid-handshake: whoever mounts next finishes it.
  useEffect(() => {
    if (connection.phase !== "dialing") return;
    const id = window.setTimeout(
      () => {
        if (useDesktopStore.getState().connection.phase === "dialing") {
          setConnection({ phase: "online" });
        }
      },
      Math.max(0, connection.until - Date.now()),
    );
    return () => window.clearTimeout(id);
  }, [connection, setConnection]);

  return { connection, connect, hangUp, link };
}
