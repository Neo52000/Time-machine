"use client";

import { useEffect, useState } from "react";
import { formatDuration, formatKilobytes } from "@time-machine/computer-engine";
import { eraNow, formatEraDate, formatEraTime } from "@time-machine/desktop-engine";
import { phoneCatalog, transferCost } from "@time-machine/phone-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import { useActiveRadio, usePhoneStore, type Photo } from "@/lib/phoneStore";
import type { PhoneAppProps } from "../types";
import { TRANSFER_SPEEDUP, useTransfer } from "../useTransfer";

/** An original landscape, drawn from a hue: no photograph is ever shipped. */
function Scene({ hue, className }: { hue: number; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 90"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`sky-${hue}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 70% 55%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 40) % 360} 80% 80%)`} />
        </linearGradient>
      </defs>
      <rect width="120" height="90" fill={`url(#sky-${hue})`} />
      <circle cx={30 + (hue % 60)} cy="28" r="10" fill={`hsl(${(hue + 30) % 360} 95% 75%)`} />
      <path d="M0 62 Q30 44 60 60 T120 56 V90 H0Z" fill={`hsl(${(hue + 120) % 360} 35% 35%)`} />
      <path d="M0 74 Q40 62 80 74 T120 70 V90 H0Z" fill={`hsl(${(hue + 140) % 360} 40% 25%)`} />
    </svg>
  );
}

type ShareKind = "mms" | "upload";

function ShareSheet({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const radio = useActiveRadio();
  const addMetered = usePhoneStore((s) => s.addMetered);
  const { emit } = useNarrative();
  const audio = useAudio();
  const { photo: spec } = phoneCatalog;
  const [sent, setSent] = useState<string | null>(null);
  // MMS travel on the operator's network whatever the Wi-Fi does.
  const mobile = phoneCatalog.getRadio("mobile");
  const mms = transferCost(spec.mmsSizeKb, mobile, "up");
  const upload = radio ? transferCost(spec.sizeKb, radio, "up") : null;

  const { transfer, start, busy } = useTransfer((key) => {
    const kind = key as ShareKind;
    if (kind === "upload" && upload) addMetered(upload.meteredBytes);
    audio.play("sent");
    emit("service.opened", { kiosk: "photo", service: kind, network: radio?.id ?? "none" });
    setSent(kind === "mms" ? "Photo envoyée à Léa par MMS." : "Photo publiée en ligne.");
  });

  return (
    <div
      className="ph-sheet"
      role="dialog"
      aria-label="Partager la photo"
      data-testid="share-sheet"
    >
      <Scene hue={photo.hue} className="ph-sheet-photo" />
      <p className="ph-muted">
        {spec.width} × {spec.height} px · {formatKilobytes(spec.sizeKb)} · {photo.takenAt}
      </p>
      {!radio && <p className="ph-error">Mode avion : aucun envoi possible.</p>}
      <button
        type="button"
        className="ph-btn"
        disabled={!radio || busy}
        onClick={() => start("mms", mms.realMs)}
        data-testid="share-mms"
      >
        Envoyer à Léa par MMS — réduite à {formatKilobytes(spec.mmsSizeKb)} (
        {formatDuration(mms.realMs)})
      </button>
      <button
        type="button"
        className="ph-btn"
        disabled={!upload || busy}
        onClick={() => upload && start("upload", upload.realMs)}
        data-testid="share-upload"
      >
        Publier en ligne — photo entière, {formatKilobytes(spec.sizeKb)}
        {upload && radio ? ` (${formatDuration(upload.realMs)} en ${radio.label})` : ""}
      </button>
      {upload && radio?.metered && (
        <p className="ph-muted">
          En 3G+, ces {formatKilobytes(spec.sizeKb)} sont décomptés du forfait.
        </p>
      )}
      {transfer && (
        <div className="ph-transfer" data-testid="share-progress">
          <div className="ph-bar" aria-hidden>
            <div style={{ width: `${transfer.progress * 100}%` }} />
          </div>
          <p className="ph-muted">
            {transfer.progress < 1 ? `Envoi… ${Math.round(transfer.progress * 100)} %` : sent} —
            durée réelle {formatDuration(transfer.realMs)}, affichée ×{TRANSFER_SPEEDUP}
          </p>
        </div>
      )}
      <button type="button" className="ph-link" onClick={onClose} data-testid="share-close">
        Fermer
      </button>
    </div>
  );
}

/**
 * Photo: one 5-megapixel shot outweighs a whole floppy disk, so sharing it
 * is a real choice — a reduced MMS, or the full picture over 3G (slow,
 * counted against the plan) or Wi-Fi (fast, free).
 */
export function CameraApp({ clock }: PhoneAppProps) {
  const photos = usePhoneStore((s) => s.photos);
  const addPhoto = usePhoneStore((s) => s.addPhoto);
  const audio = useAudio();
  const [hue, setHue] = useState(200);
  const [flash, setFlash] = useState(false);
  const [selected, setSelected] = useState<Photo | null>(null);

  // The world in the viewfinder drifts slowly, so no two shots are alike.
  useEffect(() => {
    const id = window.setInterval(() => setHue((h) => (h + 7) % 360), 400);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(false), 150);
    return () => window.clearTimeout(id);
  }, [flash]);

  function shoot() {
    const now = eraNow(clock);
    addPhoto({ hue, takenAt: `${formatEraDate(now)} ${formatEraTime(now)}` });
    audio.play("capture");
    setFlash(true);
  }

  if (selected) return <ShareSheet photo={selected} onClose={() => setSelected(null)} />;

  return (
    <div className="ph-camera">
      <div className="ph-viewfinder" data-testid="camera-viewfinder">
        <Scene hue={hue} className="ph-scene" />
        {flash && <div className="ph-flash" aria-hidden />}
        <span className="ph-camera-spec">5 Mpx</span>
      </div>
      <button
        type="button"
        className="ph-shutter"
        aria-label="Prendre une photo"
        onClick={shoot}
        data-testid="camera-shutter"
      />
      <div className="ph-gallery" aria-label="Galerie" data-testid="camera-gallery">
        {photos.length === 0 && (
          <p className="ph-muted">Aucune photo. Appuyez sur le déclencheur.</p>
        )}
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            className="ph-thumb"
            onClick={() => setSelected(p)}
            aria-label={`Photo du ${p.takenAt} — partager`}
            data-testid={`photo-${p.id}`}
          >
            <Scene hue={p.hue} />
          </button>
        ))}
      </div>
    </div>
  );
}
