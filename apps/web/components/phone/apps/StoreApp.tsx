"use client";

import { useMemo } from "react";
import { formatDuration, formatKilobytes } from "@time-machine/computer-engine";
import { eraNow } from "@time-machine/desktop-engine";
import { phoneCatalog, transferCost } from "@time-machine/phone-engine";
import type { StoreApp as StoreEntry } from "@time-machine/content-schema";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import { useActiveRadio, usePhoneStore } from "@/lib/phoneStore";
import type { PhoneAppProps } from "../types";
import { TRANSFER_SPEEDUP, useTransfer } from "../useTransfer";

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function isoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Boutique: the app store. An app is a download like any other — timed on
 * the radio in use and, on 3G, counted against the plan. Apps and prices are
 * fictional; nothing is ever charged.
 */
export function StoreApp({ clock, openApp }: PhoneAppProps) {
  const radio = useActiveRadio();
  const installed = usePhoneStore((s) => s.installed);
  const install = usePhoneStore((s) => s.install);
  const addMetered = usePhoneStore((s) => s.addMetered);
  const { emit } = useNarrative();
  const apps = useMemo(() => phoneCatalog.storeAt(isoDate(eraNow(clock))), [clock]);

  const { transfer, start, busy } = useTransfer((appId) => {
    const app = phoneCatalog.getStoreApp(appId);
    if (!app || !radio) return;
    addMetered(transferCost(app.sizeKb, radio).meteredBytes);
    install(appId);
    emit("service.opened", { kiosk: "store", service: appId });
  });

  const cost = (app: StoreEntry) => (radio ? transferCost(app.sizeKb, radio) : null);

  return (
    <div className="ph-list">
      <div className="ph-appbar">
        <strong>Boutique</strong>
        <span className="ph-muted">{radio ? `via ${radio.label}` : "hors connexion"}</span>
      </div>
      {apps.map((app) => {
        const owned = installed.includes(app.id);
        const loading = transfer?.key === app.id && transfer.progress < 1;
        const time = cost(app);
        return (
          <div key={app.id} className="ph-store-item" data-testid={`store-${app.id}`}>
            <span className="ph-icon-tile" aria-hidden>
              {app.icon}
            </span>
            <div className="ph-row-main">
              <span className="ph-row-title">{app.title}</span>
              <span className="ph-row-sub">{app.description}</span>
              <span className="ph-muted">
                {formatKilobytes(app.sizeKb)}
                {time && radio ? ` · ${formatDuration(time.realMs)} en ${radio.label}` : ""}
              </span>
              {loading && (
                <div className="ph-bar" aria-label={`Téléchargement de ${app.title}`}>
                  <div style={{ width: `${transfer.progress * 100}%` }} />
                </div>
              )}
            </div>
            {owned ? (
              <button
                type="button"
                className="ph-btn ph-btn-small"
                onClick={() => openApp(app.id)}
                data-testid={`store-open-${app.id}`}
              >
                Ouvrir
              </button>
            ) : (
              <button
                type="button"
                className="ph-btn ph-btn-small"
                disabled={!radio || busy}
                onClick={() => time && start(app.id, time.realMs)}
                data-testid={`store-install-${app.id}`}
              >
                {app.priceCents === 0 ? "Gratuit" : euros.format(app.priceCents / 100)}
              </button>
            )}
          </div>
        );
      })}
      {!radio && <p className="ph-error">Mode avion : la boutique est inaccessible.</p>}
      <p className="ph-muted ph-footnote">
        Applications et prix fictifs : rien n&apos;est débité. Téléchargements affichés ×
        {TRANSFER_SPEEDUP}.
      </p>
    </div>
  );
}
