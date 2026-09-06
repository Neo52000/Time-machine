import { notFound } from "next/navigation";
import { getEra } from "@time-machine/era-engine";
import { LoadingScreen } from "@/components/LoadingScreen";

export default async function EraLoadingPage({ params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const era = getEra(eraId);
  if (!era) notFound();

  return <LoadingScreen era={era} />;
}
