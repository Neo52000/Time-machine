import { getEra, listEras } from "@time-machine/era-engine";
import { OG_CONTENT_TYPE, OG_SIZE, eraBackground, renderOgImage } from "@/lib/ogImage";

export const alt = "Démarrer une machine d'époque — Time Machine";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return listEras().map((era) => ({ eraId: era.id }));
}

export default async function Image({ params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const era = getEra(eraId);
  if (!era) return renderOgImage({ kicker: "Time Machine", title: "Époque inconnue" });
  return renderOgImage({
    kicker: `Démarrer la machine de ${era.dateStart.slice(0, 4)}`,
    title: era.label,
    subtitle: `${era.machine.resolution.width}×${era.machine.resolution.height} · dans votre navigateur`,
    background: eraBackground(era),
  });
}
