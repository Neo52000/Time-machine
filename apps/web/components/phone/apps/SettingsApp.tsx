"use client";

import { describeMachine, formatBitrate, machineCatalog } from "@time-machine/computer-engine";
import { allowanceUsed, phoneCatalog } from "@time-machine/phone-engine";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import { usePhoneStore } from "@/lib/phoneStore";
import type { PhoneAppProps } from "../types";

const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

function Toggle({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  testId: string;
}) {
  return (
    <label className="ph-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
    </label>
  );
}

/** Réglages: the radios, the plan's data counter, and what this phone is. */
export function SettingsApp({ era }: PhoneAppProps) {
  const wifi = usePhoneStore((s) => s.wifi);
  const airplane = usePhoneStore((s) => s.airplane);
  const metered = usePhoneStore((s) => s.meteredBytes);
  const setWifi = usePhoneStore((s) => s.setWifi);
  const setAirplane = usePhoneStore((s) => s.setAirplane);
  const { emit } = useNarrative();
  const usage = allowanceUsed(metered, phoneCatalog.dataAllowanceMb);
  const machine = machineCatalog.getMachine(era.machine.id);

  return (
    <div className="ph-list">
      <div className="ph-appbar">
        <strong>Réglages</strong>
      </div>
      <div className="ph-group">
        <Toggle
          label="Mode avion"
          checked={airplane}
          onChange={(on) => {
            setAirplane(on);
            if (on) emit("service.opened", { kiosk: "settings", service: "airplane" });
          }}
          testId="settings-airplane"
        />
        <Toggle
          label="Wi-Fi (box de la maison)"
          checked={wifi && !airplane}
          onChange={(on) => {
            setWifi(on);
            if (on) setAirplane(false);
          }}
          testId="settings-wifi"
        />
      </div>

      <div className="ph-group" data-testid="settings-data">
        <p className="ph-row-title">Données mobiles ce mois-ci</p>
        <div
          className={`ph-bar${usage.ratio > 0.8 ? " ph-bar-warn" : ""}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={phoneCatalog.dataAllowanceMb}
          aria-valuenow={Math.round(usage.usedMb)}
          aria-label="Forfait data utilisé"
        >
          <div style={{ width: `${usage.ratio * 100}%` }} />
        </div>
        <p className="ph-muted" data-testid="settings-data-used">
          {decimal.format(usage.usedMb)} Mo sur {phoneCatalog.dataAllowanceMb} Mo (forfait fictif).
          Le Wi-Fi n&apos;est pas décompté.
        </p>
      </div>

      <div className="ph-group">
        <p className="ph-row-title">Réseaux</p>
        {phoneCatalog.radios.map((radio) => (
          <p key={radio.id} className="ph-muted">
            {radio.link.label} : {formatBitrate(radio.link.downstreamBps)} ↓ /{" "}
            {formatBitrate(radio.link.upstreamBps)} ↑, {radio.link.latencyMs} ms
            {radio.needsResearch ? " — débit réel moyen, à vérifier" : ""}
          </p>
        ))}
      </div>

      {machine && (
        <div className="ph-group" data-testid="settings-about">
          <p className="ph-row-title">À propos du téléphone</p>
          <dl className="ph-about">
            {describeMachine(machine).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
