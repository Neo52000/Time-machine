import { museum } from "@time-machine/museum-engine";
import { OG_CONTENT_TYPE, OG_SIZE, eraBackground, renderOgImage } from "@/lib/ogImage";

export const alt = "Musée Time Machine";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return museum.galleries.map((g) => ({ eraId: g.era.id }));
}

export default async function Image({ params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const gallery = museum.getGallery(eraId);
  if (!gallery) return renderOgImage({ kicker: "Musée", title: "Time Machine" });
  return renderOgImage({
    kicker: `Musée · ${gallery.era.dateStart.slice(0, 4)}`,
    title: gallery.era.label,
    subtitle: `${gallery.during.length} événement(s) sourcé(s) · ${gallery.online.length} site(s) en ligne`,
    background: eraBackground(gallery.era),
  });
}
