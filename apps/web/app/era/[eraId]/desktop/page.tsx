import Link from "next/link";
import { notFound } from "next/navigation";
import { getEra } from "@time-machine/era-engine";

export default async function EraDesktopPage({ params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const era = getEra(eraId);
  if (!era) notFound();

  return (
    <main className="flex min-h-screen flex-col justify-between p-8 font-mono text-neutral-200">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Boot sequence: {era.machine.bootSequence}
        </p>
        <h1 className="mt-4 text-2xl font-bold text-white">{era.label}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {era.machine.resolution.width}×{era.machine.resolution.height} — {era.machine.id}
        </p>
      </div>

      <section aria-label="Applications disponibles" className="mt-12">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-neutral-500">
          Applications disponibles
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="app-list">
          {era.apps.map((appId) => (
            <li
              key={appId}
              data-testid={`app-${appId}`}
              className="rounded border border-neutral-700 px-4 py-6 text-center text-sm text-neutral-300"
            >
              {appId}
            </li>
          ))}
        </ul>
      </section>

      <footer>
        <Link href="/" className="text-sm text-neutral-500 underline hover:text-white">
          ← Retour à la timeline
        </Link>
      </footer>
    </main>
  );
}
