import { listEras } from "@time-machine/era-engine";
import { decodePassport, narrativeCatalog } from "@time-machine/narrative-engine";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/ogImage";
import { sharedPassportLines } from "@/lib/passportShare";

export const alt = "Passeport du voyageur — Time Machine";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const earned = decodePassport(narrativeCatalog.stamps, code) ?? [];
  const lines = sharedPassportLines(narrativeCatalog.stamps, earned, listEras());
  return renderOgImage({
    kicker: "Passeport du voyageur",
    title: `${earned.length} / ${narrativeCatalog.stamps.length} tampons`,
    subtitle: lines.map((l) => `${l.eraId} : ${l.stamps.length}/${l.total}`).join(" · "),
  });
}
