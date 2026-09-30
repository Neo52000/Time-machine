import { listEras } from "@time-machine/era-engine";
import { timeWebCatalog } from "@time-machine/browser-engine";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/ogImage";

export const alt = "Time Machine — Internet History Simulator";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  const years = listEras().map((e) => e.dateStart.slice(0, 4));
  return renderOgImage({
    kicker: "When do you want to go?",
    title: `${years.join(" · ")}`,
    subtitle: `${timeWebCatalog.events.length} dates, ${years.length} machines à démarrer dans le navigateur.`,
  });
}
