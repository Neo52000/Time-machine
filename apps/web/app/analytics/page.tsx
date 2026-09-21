import { AnalyticsPanel } from "@/components/AnalyticsPanel";

export const metadata = {
  title: "Mesures — Time Machine",
};

export default function AnalyticsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 font-mono text-neutral-200">
      <h1 className="mb-6 text-2xl font-bold tracking-wide">Mesures</h1>
      <AnalyticsPanel />
    </main>
  );
}
