import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listEras } from "@time-machine/era-engine";
import { decodePassport, narrativeCatalog } from "@time-machine/narrative-engine";
import { sharedPassportLines } from "@/lib/passportShare";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const earned = decodePassport(narrativeCatalog.stamps, code);
  if (!earned) return {};
  const title = `Passeport du voyageur : ${earned.length}/${narrativeCatalog.stamps.length} tampons — Time Machine`;
  const description =
    "Un voyageur a exploré le Minitel, les BBS et le Web d'avant. À votre tour de démarrer les machines.";
  return {
    title,
    description,
    // Any combination of stamps is a URL: share them, don't index them.
    robots: { index: false },
    openGraph: { title, description, url: `/passport/${code}` },
    twitter: { title, description },
  };
}

/** A passport someone shared: what they earned, and the way in for whoever opens it. */
export default async function SharedPassportPage({ params }: Params) {
  const { code } = await params;
  const earned = decodePassport(narrativeCatalog.stamps, code);
  if (!earned) notFound();
  const total = narrativeCatalog.stamps.length;
  const lines = sharedPassportLines(narrativeCatalog.stamps, earned, listEras());

  return (
    <main
      className="mx-auto max-w-2xl px-6 py-16 font-mono text-neutral-200"
      data-testid="shared-passport"
    >
      <p className="text-xs uppercase tracking-widest text-neutral-500">Passeport du voyageur</p>
      <h1 className="mt-2 text-2xl font-bold" data-testid="shared-passport-count">
        {earned.length} / {total} tampons
      </h1>
      <div className="mt-3 h-1 w-full bg-neutral-800" aria-hidden>
        <div
          className="h-full bg-amber-400"
          style={{ width: `${(earned.length / total) * 100}%` }}
        />
      </div>
      <ul className="mt-8 space-y-6">
        {lines.map((line) => (
          <li key={line.eraId}>
            <p className="text-xs text-neutral-400">
              {line.label}{" "}
              <span className="text-neutral-600">
                {line.stamps.length}/{line.total}
              </span>
            </p>
            <ul className="mt-2 space-y-1">
              {line.stamps.map((stamp) => (
                <li key={stamp.id} className="text-sm" data-testid={`shared-stamp-${stamp.id}`}>
                  <span aria-hidden className="mr-2">
                    {stamp.icon}
                  </span>
                  <span className="font-bold">{stamp.title}</span>{" "}
                  <span className="text-neutral-500">— {stamp.hint}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="mt-10 inline-block border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:border-emerald-400"
        data-testid="shared-passport-start"
      >
        Commencer mon voyage →
      </Link>
    </main>
  );
}
