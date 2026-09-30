import Link from "next/link";
import type { SourceReference } from "@time-machine/content-schema";
import { timeWebCatalog } from "@time-machine/browser-engine";
import { listEras } from "@time-machine/era-engine";
import { buildVerticalTimeline, listCategories } from "@time-machine/timeline-engine";
import { HomeTimeline } from "@/components/HomeTimeline";
import { Passport } from "@/components/Passport";

export const metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  const eras = listEras();
  // The catalogue has already validated events and sources and dropped drafts.
  const { events } = timeWebCatalog;
  const years = buildVerticalTimeline(events, eras);
  const sources: Record<string, SourceReference> = {};
  for (const id of new Set(events.flatMap((e) => e.sourceIds))) {
    const source = timeWebCatalog.getSource(id);
    if (source) sources[id] = source;
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 px-4 py-16 font-mono sm:py-24">
      <header className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-widest text-white sm:text-5xl">
          WHEN DO YOU WANT TO GO?
        </h1>
        <p className="max-w-md text-sm text-neutral-500">
          {events.length} dates de l&apos;histoire de l&apos;informatique et d&apos;Internet,{" "}
          {eras.length} machines à démarrer. Descendez le temps, ou partez directement :
        </p>
        <nav className="flex flex-wrap justify-center gap-3" aria-label="Machines disponibles">
          {eras.map((era) => (
            <a
              key={era.id}
              href={`#era-${era.id}`}
              className="border border-emerald-700 px-3 py-1.5 text-sm text-emerald-300 hover:border-emerald-400"
              data-testid={`era-jump-${era.id}`}
            >
              {era.dateStart.slice(0, 4)}
            </a>
          ))}
        </nav>
        <nav className="flex gap-6 text-xs">
          <Link
            href="/museum"
            className="text-neutral-500 hover:text-neutral-300"
            data-testid="home-museum"
          >
            Musée
          </Link>
          <a href="/analytics" className="text-neutral-700 hover:text-neutral-400">
            Mesures
          </a>
        </nav>
      </header>
      <Passport eras={eras} />
      <HomeTimeline
        years={years}
        categories={listCategories(events)}
        sources={sources}
        todayYear={new Date().getFullYear()}
      />
    </main>
  );
}
