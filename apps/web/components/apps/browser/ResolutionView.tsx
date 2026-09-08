"use client";

import type { ReactNode } from "react";
import type { HistoricalUrlResolution, TimeWebCatalog } from "@time-machine/browser-engine";
import type { EraManifest } from "@time-machine/content-schema";
import { ReconstructedPageView, type SearchResultsData } from "./ReconstructedPage";

interface Props {
  resolution: HistoricalUrlResolution;
  catalog: TimeWebCatalog;
  era: EraManifest;
  selectedDate: string;
  searchResults?: SearchResultsData;
  onNavigate: (href: string) => void;
}

function frDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Content pane of the Time Browser: one view per resolution type. */
export function ResolutionView({
  resolution,
  catalog,
  era,
  selectedDate,
  searchResults,
  onNavigate,
}: Props) {
  switch (resolution.type) {
    case "reconstruction": {
      const page = catalog.getPage(resolution.pageId);
      if (!page) {
        return (
          <Card title="Page introuvable" testId="error-card">
            <p>Reconstitution manquante.</p>
          </Card>
        );
      }
      return (
        <ReconstructedPageView
          page={page}
          query={resolution.url.query}
          searchResults={searchResults}
          onNavigate={onNavigate}
        />
      );
    }
    case "snapshot": {
      const snap = catalog.getSnapshot(resolution.snapshotId);
      const site = catalog.getWebsite(resolution.websiteId);
      return (
        <Card title={site?.title ?? resolution.url.hostname} testId="snapshot-card">
          <p>
            Capture historique du {snap ? frDate(snap.capturedAt) : "?"} ({snap?.type}).
          </p>
          <p className="tw-notice">
            Réf. {snap?.contentRef} — droits : {snap?.rightsStatus}.
          </p>
        </Card>
      );
    }
    case "archive": {
      const site = catalog.getWebsite(resolution.websiteId);
      return (
        <Card title={site?.title ?? resolution.url.hostname} testId="archive-card">
          <p>
            Aucune reconstitution locale n&apos;existe pour cette date, mais une archive
            documentaire est référencée.
          </p>
          <p>
            <a
              className="tw-link"
              href={resolution.archiveUrl}
              target="_blank"
              rel="noopener noreferrer external"
            >
              Consulter l&apos;archive (ouvre le vrai navigateur)
            </a>
          </p>
          <p className="tw-notice">
            L&apos;archive n&apos;est jamais affichée à l&apos;intérieur de la machine : c&apos;est
            une source documentaire, pas un moteur de rendu.
          </p>
        </Card>
      );
    }
    case "document": {
      const event = catalog.getEvent(resolution.eventId);
      const site = catalog.getWebsite(resolution.websiteId);
      return (
        <Card title={site?.title ?? resolution.url.hostname} testId="document-card">
          <p>{site?.description}</p>
          {event && (
            <>
              <h3 className="tw-heading">
                {frDate(event.date)} — {event.title}
              </h3>
              <p>{event.summary}</p>
              {event.needsResearch && (
                <p className="tw-notice">Date exacte à confirmer (recherche en cours).</p>
              )}
            </>
          )}
          <p className="tw-notice">
            Aucune reconstitution de ce site n&apos;est disponible pour {frDate(selectedDate)}.
          </p>
        </Card>
      );
    }
    case "website-card": {
      const site = catalog.getWebsite(resolution.websiteId);
      return (
        <Card title={site?.title ?? resolution.url.hostname} testId="website-card">
          <p>{site?.description}</p>
          <p>
            En ligne depuis le {site ? frDate(site.availableFrom) : "?"}
            {site?.needsResearch ? " (date à confirmer)" : ""}.
          </p>
          <p className="tw-notice">
            Fiche documentaire : ce site est connu du Time Web mais n&apos;a pas encore été
            reconstitué.
          </p>
        </Card>
      );
    }
    case "not-found":
      return (
        <TemporalNotFound
          resolution={resolution}
          catalog={catalog}
          era={era}
          selectedDate={selectedDate}
        />
      );
  }
}

function TemporalNotFound({
  resolution,
  catalog,
  era,
  selectedDate,
}: {
  resolution: Extract<HistoricalUrlResolution, { type: "not-found" }>;
  catalog: TimeWebCatalog;
  era: EraManifest;
  selectedDate: string;
}) {
  const site = resolution.websiteId ? catalog.getWebsite(resolution.websiteId) : undefined;
  const events = resolution.eventIds
    .map((id) => catalog.getEvent(id))
    .filter((e) => e !== undefined);
  const host = resolution.url?.hostname ?? "";
  const name = site?.title ?? host;
  const research = site?.needsResearch ? " (date à confirmer)" : "";

  const message: Record<typeof resolution.reason, string> = {
    "invalid-url": "L'adresse saisie n'est pas une adresse Web valide.",
    "domain-unknown": `Le Time Web ne connaît pas encore ${host}. Ce site n'a pas été documenté pour cette époque.`,
    "not-yet-online": `${name} n'existe pas encore le ${frDate(selectedDate)}${
      site ? ` : il apparaît le ${frDate(site.availableFrom)}${research}` : ""
    }.`,
    "no-longer-online": `${name} n'est plus en ligne le ${frDate(selectedDate)}${
      site?.availableUntil ? ` : le service a fermé le ${frDate(site.availableUntil)}` : ""
    }.`,
    "page-unknown": `Cette page de ${name} n'a pas été reconstituée. Essayez la page d'accueil.`,
  };

  return (
    <Card title="404 temporelle" testId="temporal-404" reason={resolution.reason}>
      <p>{message[resolution.reason]}</p>
      {events.length > 0 && (
        <>
          <h3 className="tw-heading">Dans la chronologie</h3>
          <ul className="tw-list">
            {events.map((event) => (
              <li key={event.id}>
                <strong>{frDate(event.date)}</strong> — {event.title}
                {event.needsResearch ? " (date à confirmer)" : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="tw-notice">
        La machine est réglée sur {era.label}. Le Time Web ne montre que ce qui existait à cette
        date.
      </p>
    </Card>
  );
}

function Card({
  title,
  children,
  testId,
  reason,
}: {
  title: string;
  children: ReactNode;
  testId: string;
  reason?: string;
}) {
  return (
    <div className="tw-page" data-testid={testId} data-reason={reason}>
      <h2 className="tw-heading">{title}</h2>
      {children}
    </div>
  );
}
