# Museum Engine

Package: `packages/museum-engine`. UI: `apps/web/app/museum` (`/museum`,
`/museum/[eraId]`, statically generated).

## Model

One gallery per era, **derived** from the already-validated catalogues —
the museum has no content of its own:

| Section                 | Rule                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| La machine              | the era machine's Computer Engine profile, with its sources         |
| Pendant cette époque    | published events dated inside `[dateStart, dateEnd]`, chronological |
| Déjà en place           | the 6 most important earlier events                                 |
| En ligne à cette époque | published sites online at some point during the era                 |
| Bientôt                 | the next 3 events after the era                                     |

Every exhibit carries its resolved `sources` (a dangling source id throws at
build time) and `toConfirm` = `needsResearch`, rendered as an "à vérifier"
badge: uncertain content is labelled, never presented as fact and never
hidden. Draft (`published: false`) records never appear. Each gallery links
straight to its machine (`/era/[id]/loading`).

```ts
buildMuseum({ eras, events, websites, machines, sources }, { backgroundLimit, upcomingLimit });
museum.getGallery("1998");
```
