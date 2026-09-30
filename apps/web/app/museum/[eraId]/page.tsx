import Link from "next/link";
import { notFound } from "next/navigation";
import type {
  HistoricalEvent,
  HistoricalWebsite,
  SourceReference,
} from "@time-machine/content-schema";
import { describeMachine } from "@time-machine/computer-engine";
import { galleryCoverage, museum, type Sourced } from "@time-machine/museum-engine";

export function generateStaticParams() {
  return museum.galleries.map((g) => ({ eraId: g.era.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const gallery = museum.getGallery(eraId);
  if (!gallery) return { title: "Musée — Time Machine" };
  const title = `Musée ${gallery.era.label} — Time Machine`;
  const description = `La machine, ${gallery.during.length} événement(s) sourcé(s) et ${gallery.online.length} site(s) en ligne : ${gallery.era.label}.`;
  return {
    title,
    description,
    alternates: { canonical: `/museum/${eraId}` },
    openGraph: { title, description, url: `/museum/${eraId}` },
    twitter: { title, description },
  };
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const formatDay = (iso: string) => dateFormat.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

function ToConfirm() {
  return (
    <span className="ml-2 border border-amber-700 px-1 text-[10px] uppercase text-amber-500">
      à vérifier
    </span>
  );
}

const KIND_LABEL: Record<SourceReference["kind"], string | null> = {
  primary: "primaire",
  institutional: "institutionnelle",
  press: "presse",
  reference: null,
  project: null,
};

function KindBadge({ kind }: { kind: SourceReference["kind"] }) {
  const label = KIND_LABEL[kind];
  if (!label) return null;
  return (
    <span
      className="ml-1 border border-emerald-800 px-1 text-[10px] uppercase text-emerald-500"
      data-testid="source-kind"
    >
      {label}
    </span>
  );
}

function Sources({ sources }: { sources: SourceReference[] }) {
  if (sources.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-neutral-500">
      Sources :{" "}
      {sources.map((s, i) => (
        <span key={s.id}>
          {i > 0 ? " · " : ""}
          {s.url ? (
            <a
              href={s.url}
              className="underline hover:text-neutral-300"
              rel="noreferrer"
              target="_blank"
            >
              {s.label}
            </a>
          ) : (
            s.label
          )}
          <KindBadge kind={s.kind} />
        </span>
      ))}
    </p>
  );
}

function EventLabel({ exhibit }: { exhibit: Sourced<HistoricalEvent> }) {
  const { item: event } = exhibit;
  return (
    <li className="border-l border-neutral-800 pl-4" data-testid={`museum-event-${event.id}`}>
      <p className="text-xs text-neutral-500">
        {formatDay(event.date)}
        {exhibit.toConfirm && <ToConfirm />}
      </p>
      <h3 className="font-bold">{event.title}</h3>
      <p className="text-sm text-neutral-300">{event.summary}</p>
      <Sources sources={exhibit.sources} />
    </li>
  );
}

function SiteLabel({ exhibit }: { exhibit: Sourced<HistoricalWebsite> }) {
  const { item: site } = exhibit;
  return (
    <li data-testid={`museum-site-${site.id}`}>
      <span className="font-bold">{site.domain}</span>{" "}
      <span className="text-xs text-neutral-500">
        en ligne depuis le {formatDay(site.availableFrom)}
        {site.availableUntil ? `, jusqu'au ${formatDay(site.availableUntil)}` : ""}
      </span>
      {exhibit.toConfirm && <ToConfirm />}
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-sm uppercase tracking-widest text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

export default async function MuseumGalleryPage({
  params,
}: {
  params: Promise<{ eraId: string }>;
}) {
  const { eraId } = await params;
  const gallery = museum.getGallery(eraId);
  if (!gallery) notFound();
  const { era, machine } = gallery;
  const coverage = galleryCoverage(gallery);

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-16 font-mono text-neutral-200"
      data-testid="museum-gallery"
    >
      <Link href="/museum" className="text-xs text-neutral-500 hover:text-neutral-300">
        ← Musée
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-wide">{era.label}</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Du {formatDay(era.dateStart)} au {formatDay(era.dateEnd)}.
      </p>
      <p className="mt-1 text-xs text-neutral-500" data-testid="museum-coverage">
        {coverage.authoritative}/{coverage.total} dates et sites appuyés sur une source primaire,
        institutionnelle ou de presse.
      </p>
      <Link
        href={`/era/${era.id}/loading`}
        className="mt-6 inline-block border border-neutral-600 px-4 py-2 text-sm hover:border-neutral-300"
        data-testid="museum-boot"
      >
        Démarrer la machine de {era.dateStart.slice(0, 4)} →
      </Link>

      {machine && (
        <Section title="La machine">
          <dl
            className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1 text-sm"
            data-testid="museum-machine"
          >
            {describeMachine(machine.item).map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-neutral-500">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-neutral-500">
            Configuration représentative de l&apos;époque, pas un modèle commercial précis.
            {machine.toConfirm && <ToConfirm />}
          </p>
          {machine.item.notes && (
            <p className="mt-1 text-xs text-neutral-500">{machine.item.notes}</p>
          )}
          <Sources sources={machine.sources} />
        </Section>
      )}

      <Section title={`Pendant cette époque`}>
        {gallery.during.length > 0 ? (
          <ol className="space-y-6">
            {gallery.during.map((e) => (
              <EventLabel key={e.item.id} exhibit={e} />
            ))}
          </ol>
        ) : (
          <p className="text-sm text-neutral-500">Aucun événement documenté pour cette période.</p>
        )}
      </Section>

      <Section title="Déjà en place">
        <ol className="space-y-6">
          {gallery.background.map((e) => (
            <EventLabel key={e.item.id} exhibit={e} />
          ))}
        </ol>
      </Section>

      <Section title="En ligne à cette époque">
        {gallery.online.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {gallery.online.map((s) => (
              <SiteLabel key={s.item.id} exhibit={s} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">
            Aucun site Web documenté : le Web n&apos;existe pas encore.
          </p>
        )}
      </Section>

      {gallery.upcoming.length > 0 && (
        <Section title="Bientôt">
          <ol className="space-y-6">
            {gallery.upcoming.map((e) => (
              <EventLabel key={e.item.id} exhibit={e} />
            ))}
          </ol>
        </Section>
      )}
    </main>
  );
}
