import type { Metadata } from "next";
import { AnalyticsProvider } from "@/lib/analytics/AnalyticsProvider";
import { ConsentBanner } from "@/components/ConsentBanner";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const title = `${SITE_NAME} — Internet History Simulator`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <AnalyticsProvider>
          {children}
          <ConsentBanner />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
