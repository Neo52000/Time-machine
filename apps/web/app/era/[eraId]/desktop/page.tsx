import { notFound } from "next/navigation";
import { getEra } from "@time-machine/era-engine";
import { Desktop } from "@/components/desktop/Desktop";

export default async function EraDesktopPage({ params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const era = getEra(eraId);
  if (!era) notFound();

  return <Desktop era={era} />;
}
