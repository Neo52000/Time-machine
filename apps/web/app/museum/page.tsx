import Link from "next/link";
import { museum } from "@time-machine/museum-engine";

export const metadata = {
  title: "Musée — Time Machine",
  description: "Une salle par époque : la machine, ce qui se passait, ce qui était en ligne.",
  alternates: { canonical: "/museum" },
};

export default function MuseumPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 font-mono text-neutral-200">
      <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
        ← Timeline
      </Link>
      <h1 className="mb-2 mt-4 text-2xl font-bold tracking-wide">Musée</h1>
      <p className="mb-10 text-sm text-neutral-400">
        Une salle par époque : la machine, ce qui se passait, ce qui était en ligne. Chaque cartel
        cite ses sources ; ce qui reste à vérifier est signalé comme tel.
      </p>
      <ul className="grid gap-4 sm:grid-cols-3" data-testid="museum-galleries">
        {museum.galleries.map((g) => (
          <li key={g.era.id}>
            <Link
              href={`/museum/${g.era.id}`}
              className="block h-full border border-neutral-800 p-4 hover:border-neutral-500 focus-visible:border-neutral-300"
              data-testid={`museum-gallery-${g.era.id}`}
            >
              <span className="block text-3xl font-bold">{g.era.dateStart.slice(0, 4)}</span>
              <span className="mt-1 block text-sm text-neutral-300">{g.era.label}</span>
              <span className="mt-3 block text-xs text-neutral-500">
                {g.during.length} événement(s) · {g.online.length} site(s) en ligne
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
