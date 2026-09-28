"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { builtinApps, type AppDefinition } from "@time-machine/apps-runtime";
import type { EraManifest } from "@time-machine/content-schema";
import { eraNow, formatEraTime, type EraClock } from "@time-machine/desktop-engine";
import { phoneCatalog, unreadCount } from "@time-machine/phone-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import { useActiveRadio, usePhoneStore } from "@/lib/phoneStore";
import { CameraApp } from "./apps/CameraApp";
import { SerpentinApp } from "./apps/SerpentinApp";
import { SettingsApp } from "./apps/SettingsApp";
import { SmsApp } from "./apps/SmsApp";
import { StoreApp } from "./apps/StoreApp";
import { TorchApp } from "./apps/TorchApp";
import type { PhoneAppProps } from "./types";
import "./phone.css";

const SMS_TICK_MS = 250;

const screens: Record<string, ComponentType<PhoneAppProps>> = {
  sms: SmsApp,
  camera: CameraApp,
  store: StoreApp,
  settings: SettingsApp,
  torch: TorchApp,
  serpentin: SerpentinApp,
};

const definitionOf = (id: string) => builtinApps.find((a) => a.id === id);

/** Advances the SMS script and turns every arrival into a ring, an event and a balloon. */
function useSmsRuntime() {
  const tick = usePhoneStore((s) => s.tick);
  const receive = usePhoneStore((s) => s.receive);
  const messages = usePhoneStore((s) => s.sms.messages);
  const audio = useAudio();
  const { emit, notify, storyMessages } = useNarrative();

  useEffect(() => {
    let id: number | undefined;
    const start = () => {
      id ??= window.setInterval(() => tick(SMS_TICK_MS), SMS_TICK_MS);
    };
    const stop = () => {
      if (id !== undefined) window.clearInterval(id);
      id = undefined;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tick]);

  // Messages the story makes a contact send arrive as SMS.
  const relayed = useRef(0);
  useEffect(() => {
    for (const m of storyMessages.slice(relayed.current)) receive(m.contactId, m.text);
    relayed.current = storyMessages.length;
  }, [storyMessages, receive]);

  const seen = useRef(0);
  useEffect(() => {
    const arrived = messages.slice(seen.current).filter((m) => m.from === "contact");
    seen.current = messages.length;
    if (arrived.length === 0) return;
    audio.play("notification");
    const { current, thread } = usePhoneStore.getState();
    for (const sms of arrived) {
      emit("message.received", { contactId: sms.contactId });
      if (current !== "sms" || thread !== sms.contactId) {
        notify(phoneCatalog.getContact(sms.contactId)?.name ?? "SMS", sms.text);
      }
    }
  }, [messages, audio, emit, notify]);
}

function StatusBar({ clock }: { clock: EraClock }) {
  const radio = useActiveRadio();
  const airplane = usePhoneStore((s) => s.airplane);
  const [now, setNow] = useState(() => eraNow(clock));
  useEffect(() => {
    const id = window.setInterval(() => setNow(eraNow(clock)), 1000);
    return () => window.clearInterval(id);
  }, [clock]);
  return (
    <div className="ph-status" data-testid="phone-status">
      <span>
        <span className="ph-bars" aria-hidden>
          {airplane ? "✈" : "▂▄▆█"}
        </span>{" "}
        {airplane ? "Mode avion" : "TM Mobile"}
      </span>
      <span className="ph-clock">{formatEraTime(now)}</span>
      <span>
        <span data-testid="phone-radio" data-radio={radio?.id ?? "none"}>
          {radio ? radio.label : ""}
        </span>{" "}
        <span aria-label="Batterie 76 %">76 % ▮</span>
      </span>
    </div>
  );
}

function HomeScreen({
  apps,
  onOpen,
}: {
  apps: AppDefinition[];
  onOpen: (app: AppDefinition) => void;
}) {
  const unread = usePhoneStore((s) => unreadCount(s.sms));
  return (
    <nav className="ph-home" aria-label="Écran d'accueil" data-testid="phone-home-screen">
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className="ph-icon"
          data-testid={`app-${app.id}`}
          onClick={() => onOpen(app)}
        >
          <span className={`ph-icon-tile ph-tile-${app.id}`} aria-hidden>
            {app.icon}
          </span>
          {app.id === "sms" && unread > 0 && (
            <span className="ph-badge" data-testid="sms-badge">
              {unread}
            </span>
          )}
          <span className="ph-icon-label">{app.title}</span>
        </button>
      ))}
    </nav>
  );
}

/**
 * The 2010 smartphone: a status bar, a home screen of icons and one app at a
 * time, full-screen. There are no windows — the home button is the only way
 * out of an app, as on the phones of the time.
 */
export function PhoneScreen({
  era,
  clock,
  apps,
}: {
  era: EraManifest;
  clock: EraClock;
  apps: AppDefinition[];
}) {
  const reset = usePhoneStore((s) => s.reset);
  const current = usePhoneStore((s) => s.current);
  const open = usePhoneStore((s) => s.open);
  const installed = usePhoneStore((s) => s.installed);
  const audio = useAudio();
  const { track } = useAnalytics();
  useSmsRuntime();

  useEffect(() => {
    reset();
  }, [reset, era.id]);

  const home = useMemo(
    () => [...apps, ...installed.map(definitionOf).filter((a): a is AppDefinition => Boolean(a))],
    [apps, installed],
  );

  const launch = (app: AppDefinition) => {
    audio.play("window-open");
    track("app.opened", { eraId: era.id, appId: app.id });
    open(app.id);
  };

  const Screen = current ? screens[current] : undefined;
  const title = current ? definitionOf(current)?.title : undefined;

  return (
    <div className="ph-root" data-app={current ?? "home"}>
      <StatusBar clock={clock} />
      <div className="ph-screen">
        {Screen ? (
          <section className="ph-app" aria-label={title} data-testid={`phone-app-${current}`}>
            <Screen era={era} clock={clock} openApp={(id) => open(id)} />
          </section>
        ) : (
          <HomeScreen apps={home} onOpen={launch} />
        )}
      </div>
      <div className="ph-bottom">
        <button
          type="button"
          className="ph-home-button"
          aria-label="Accueil"
          data-testid="phone-home"
          onClick={() => open(null)}
        />
      </div>
    </div>
  );
}
