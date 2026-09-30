import { ImageResponse } from "next/og";
import { getDesktopTheme } from "@time-machine/desktop-engine";
import type { EraManifest } from "@time-machine/content-schema";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export interface OgCard {
  kicker: string;
  title: string;
  subtitle?: string;
  /** Background colour; defaults to the site's own near-black. */
  background?: string;
}

/**
 * The one share card of the site: plain text on a flat colour, original
 * design only (no logo, screenshot or brand of the period — rights policy).
 */
export function renderOgImage({ kicker, title, subtitle, background = "#050505" }: OgCard) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background,
        color: "#ffffff",
        fontFamily: "monospace",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, opacity: 0.8 }}>
        {kicker.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        {subtitle && <div style={{ display: "flex", fontSize: 32, opacity: 0.85 }}>{subtitle}</div>}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          borderTop: "2px solid rgba(255,255,255,0.4)",
          paddingTop: 20,
        }}
      >
        <span>TIME MACHINE</span>
        <span>Internet History Simulator</span>
      </div>
    </div>,
    OG_SIZE,
  );
}

/** The era's desktop colour (every theme's is dark enough for white text). */
export function eraBackground(era: EraManifest): string {
  const colour = getDesktopTheme(era.machine.theme).tokens["--tm-desktop"] ?? "#050505";
  return /^#[0-9a-f]{6}$/i.test(colour) ? colour : "#050505";
}
