import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The desktops are client-side simulations of the loading pages' content;
    // /analytics only shows the visitor's own local buffer.
    rules: { userAgent: "*", allow: "/", disallow: ["/analytics", "/era/*/desktop"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
