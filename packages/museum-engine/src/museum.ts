import type {
  EraManifest,
  HistoricalEvent,
  HistoricalWebsite,
  MachineProfile,
  SourceReference,
} from "@time-machine/content-schema";

/**
 * Museum Engine — turns the same validated content the machines run on
 * (eras, events, websites, machine profiles, sources) into one gallery per
 * era. Nothing is authored for the museum itself: every label comes from a
 * record that already cites its sources, and anything flagged
 * `needsResearch` is surfaced as "to confirm", never silently presented as fact.
 */
export interface MuseumInput {
  eras: EraManifest[];
  events: HistoricalEvent[];
  websites: HistoricalWebsite[];
  machines: MachineProfile[];
  sources: SourceReference[];
}

export interface MuseumOptions {
  /** Most important earlier events shown as context. */
  backgroundLimit?: number;
  /** Next events after the era, shown as a teaser. */
  upcomingLimit?: number;
}

export interface Sourced<T> {
  item: T;
  sources: SourceReference[];
  toConfirm: boolean;
}

export interface MuseumGallery {
  era: EraManifest;
  machine?: Sourced<MachineProfile>;
  /** Events dated inside the era, chronological. */
  during: Sourced<HistoricalEvent>[];
  /** Earlier events, most important first. */
  background: Sourced<HistoricalEvent>[];
  /** Sites online at some point during the era, by opening date. */
  online: Sourced<HistoricalWebsite>[];
  /** The next events after the era, chronological. */
  upcoming: Sourced<HistoricalEvent>[];
}

export interface Museum {
  galleries: MuseumGallery[];
  getGallery(eraId: string): MuseumGallery | undefined;
}

const day = (date: string) => date.slice(0, 10);

export function buildMuseum(input: MuseumInput, options: MuseumOptions = {}): Museum {
  const backgroundLimit = options.backgroundLimit ?? 6;
  const upcomingLimit = options.upcomingLimit ?? 3;
  const sourceById = new Map(input.sources.map((s) => [s.id, s]));

  function sourced<T extends { id: string; sourceIds: string[]; needsResearch?: boolean }>(
    item: T,
    kind: string,
  ): Sourced<T> {
    const sources = item.sourceIds.map((id) => {
      const source = sourceById.get(id);
      if (!source) throw new Error(`${kind} ${item.id} references unknown source "${id}"`);
      return source;
    });
    return { item, sources, toConfirm: item.needsResearch === true };
  }

  const events = input.events
    .filter((e) => e.published)
    .slice()
    .sort((a, b) => day(a.date).localeCompare(day(b.date)) || a.id.localeCompare(b.id));
  const websites = input.websites.filter((w) => w.published);
  const machineById = new Map(input.machines.map((m) => [m.id, m]));

  const galleries = input.eras
    .slice()
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))
    .map((era): MuseumGallery => {
      const start = era.dateStart;
      const end = era.dateEnd;
      const machine = machineById.get(era.machine.id);

      const background = events
        .filter((e) => day(e.date) < start)
        .sort((a, b) => b.importance - a.importance || day(b.date).localeCompare(day(a.date)))
        .slice(0, backgroundLimit);

      return {
        era,
        machine: machine ? sourced(machine, "machine") : undefined,
        during: events
          .filter((e) => day(e.date) >= start && day(e.date) <= end)
          .map((e) => sourced(e, "event")),
        background: background.map((e) => sourced(e, "event")),
        online: websites
          .filter(
            (w) =>
              day(w.availableFrom) <= end && (!w.availableUntil || day(w.availableUntil) >= start),
          )
          .sort((a, b) => a.availableFrom.localeCompare(b.availableFrom))
          .map((w) => sourced(w, "website")),
        upcoming: events
          .filter((e) => day(e.date) > end)
          .slice(0, upcomingLimit)
          .map((e) => sourced(e, "event")),
      };
    });

  const byId = new Map(galleries.map((g) => [g.era.id, g]));
  return { galleries, getGallery: (eraId) => byId.get(eraId) };
}
