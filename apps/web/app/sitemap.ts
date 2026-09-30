import type { MetadataRoute } from "next";
import { listEras } from "@time-machine/era-engine";
import { museum } from "@time-machine/museum-engine";
import { SITE_URL } from "@/lib/site";

/** Every public page, derived from the era registry and the museum — no hard-coded list. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/museum`, priority: 0.8 },
    ...museum.galleries.map((g) => ({ url: `${SITE_URL}/museum/${g.era.id}`, priority: 0.7 })),
    ...listEras().map((era) => ({ url: `${SITE_URL}/era/${era.id}/loading`, priority: 0.6 })),
  ];
}
