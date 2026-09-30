import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEra, listEras } from "@time-machine/era-engine";
import { Desktop } from "@/components/desktop/Desktop";

export function generateStaticParams() {
  return listEras().map((era) => ({ eraId: era.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eraId: string }>;
}): Promise<Metadata> {
  const { eraId } = await params;
  const era = getEra(eraId);
  if (!era) return {};
  const title = `${era.label} — Time Machine`;
  const description = `Démarrez la machine de ${era.dateStart.slice(0, 4)} et utilisez les réseaux et services disponibles à cette date.`;
  return {
    title,
    description,
    alternates: { canonical: `/era/${era.id}/loading` },
    // The desktop is the loading page's simulation; only the latter is indexed.
    robots: { index: false },
    openGraph: { title, description, url: `/era/${era.id}/loading` },
    twitter: { title, description },
  };
}

export default async function EraDesktopPage({ params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const era = getEra(eraId);
  if (!era) notFound();

  return <Desktop era={era} />;
}
