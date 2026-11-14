# Revue des sources primaires (Phase 15)

Sources ajoutées le 2026-09-30 par recherche web. **Aucune page n'a pu être
ouverte directement** depuis l'environnement de travail : chaque ligne repose
sur l'URL renvoyée par le moteur de recherche et sur son résumé. Rien n'a été
modifié dans les dates, et aucun `needsResearch` n'a été levé.

**À faire par un humain** : ouvrir l'URL, vérifier la date, puis dans
`apps/admin` décocher « Needs research » sur l'événement ou le site (et
corriger la source si elle ne dit pas ce que le résumé annonçait).

Légende précision : _jour confirmé_, _mois seulement_, _année seulement_,
_date non indiquée_, _jour non attribué_ (le résumé donne le jour sans dire
quelle page l'affirme), **DATE DIFFÉRENTE** (conflit).

## Conflits — à trancher en priorité

| Élément          | Date du dépôt | Ce que disent les sources                                                                                                           | Action                                                                                 |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `minitel-launch` | 1980-07-01    | HistelFrance : expérimentation de Saint-Malo (55 abonnés) le **15 juillet 1980**, après une présentation au président le 13 juillet | Passé en `needsResearch` ; corriger la date si confirmé                                |
| `yahoo-founded`  | 1994-04-01    | Stanford (étude de cas) : « Jerry and David's Guide » en **janvier 1994**, renommé Yahoo! ≈ 3 mois plus tard                        | Passé en `needsResearch` ; la date du dépôt correspond au renommage, pas à la création |
| `myspace-launch` | 2003-08-01    | Britannica : lancement le **15 août 2003**                                                                                          | Passé en `needsResearch`                                                               |

## Corrections de formulation proposées (non appliquées)

- `wifi-80211` : le 26 juin 1997 est la date d'**approbation** par l'IEEE ; la publication date du 18 novembre 1997. Remplacer « L'IEEE publie » par « L'IEEE approuve ».
- `google-com` (site) : 1997-09-15 est l'**enregistrement du domaine** (Stanford, 9to5Google), pas une mise en ligne publique.
- `youtube-com` (site) : 2005-04-23 est la mise en ligne de la **première vidéo** ; le site est fondé le 2005-02-14.
- `first-webcam` : en 1991 la caméra est sur le réseau local de Cambridge ; elle n'arrive sur le Web que le 22 novembre 1993.
- `info-cern-ch` : 1991-08-06 est l'annonce publique sur alt.hypertext ; le serveur fonctionnait au CERN depuis fin 1990.
- `amazon-launch` : le 16 juillet 1995 correspond, selon Amazon, à l'ouverture en bêta à ~300 proches ; le communiqué des 5 ans dit seulement « juillet 1995 ».
- `mosaic-release` : une page NCSA mentionne aussi une sortie le 23 janvier 1993 (version X Window) ; le 22 avril 1993 est la version 1.0.

## Toujours sans source d'autorité

`yahoo-com` et `myspace-com` : seules des encyclopédies (Wikipédia,
Britannica) ou Web Design Museum confirment leurs dates. Le test
`packages/browser-engine/src/sourcing.test.ts` bloque toute nouvelle
régression (cliquet à 2).

## Détail par événement et site

### `minitel-launch` — 1980-07-01 — à vérifier

| Type          | Précision       | Source                                                | Résumé de recherche                                                                                                                                                                                                          |
| ------------- | --------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| institutional | DATE DIFFÉRENTE | <https://www.histelfrance.fr/minitelteletelvideotex/> | L'expérimentation de l'annuaire électronique avec 55 abonnés volontaires de Saint-Malo débute le 15 juillet 1980, deux jours après une présentation au président Giscard d'Estaing le 13 juillet 1980 (dépôt : 1er juillet). |

### `ibm-pc-launch` — 1981-08-12 — publié

| Type    | Précision     | Source                                          | Résumé de recherche                                                                                |
| ------- | ------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://www.ibm.com/history/personal-computer> | On August 12, 1981, Estridge unveiled the IBM PC at New York's Waldorf Hotel, priced at USD 1,565. |

### `arpanet-tcpip` — 1983-01-01 — publié

| Type          | Précision       | Source                                                                                  | Résumé de recherche                                                                                                       |
| ------------- | --------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| primary       | jour confirmé   | <https://www.rfc-editor.org/rfc/rfc801.html>                                            | The plan's goal was a complete switch-over from NCP to IP/TCP by 1 January 1983, when NCP was to be removed from service. |
| institutional | année seulement | <https://www.internetsociety.org/blog/2016/09/final-report-on-tcpip-migration-in-1983/> | Internet Society blog publishing the final report on the 1983 TCP/IP migration (search summary gives only the year 1983). |

### `macintosh-launch` — 1984-01-24 — publié

| Type          | Précision     | Source                                                            | Résumé de recherche                                                                                               |
| ------------- | ------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| institutional | jour confirmé | <https://computerhistory.org/blog/a-computer-for-the-rest-of-us/> | On January 24, 1984, at Apple's annual shareholders meeting at the Flint Center, Jobs unveiled the Macintosh.     |
| institutional | jour confirmé | <https://americanhistory.si.edu/collections/object/nmah_334371>   | Released January 24, 1984, the Macintosh brought the mouse-driven graphical user interface to a consumer desktop. |

### `plan-informatique-pour-tous` — 1985-01-25 — à vérifier

| Type          | Précision         | Source                                               | Résumé de recherche                                                                                                                                                                 |
| ------------- | ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| institutional | jour confirmé     | <https://www.epi.asso.fr/revue/37/b37p023.htm>       | Le plan IPT est présenté à la presse le 25 janvier 1985 par le Premier ministre Laurent Fabius : plus de 120 000 machines dans 50 000 établissements et 110 000 enseignants formés. |
| institutional | date non indiquée | <https://1024.socinfo.fr/2015/03/1024_5_2015_95.pdf> | Article historique de la SIF sur le plan IPT ; le résumé de recherche ne précise pas la date.                                                                                       |

### `first-com-domain` — 1985-03-15 — publié

| Type          | Précision     | Source                                                                                                                                   | Résumé de recherche                                                                                                                               |
| ------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| institutional | jour confirmé | <https://www.icann.org/en/blogs/details/celebrating-the-rise-of-the-modern-internet-the-first-dot-com-domain-name-turns-30-16-3-2015-en> | Symbolics Inc registered the first .com domain name, symbolics.com, on March 15, 1985 (ICANN blog of 16 March 2015 marking its 30th anniversary). |
| press         | jour confirmé | <https://www.edn.com/1st-com-domain-name-is-registered-march-15-1985/>                                                                   | On March 15, 1985, Symbolics Inc registered the first .com domain name, symbolics.com.                                                            |

### `amiga-launch` — 1985-07-23 — publié

| Type          | Précision       | Source                                                                             | Résumé de recherche                                                                                                                    |
| ------------- | --------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| institutional | année seulement | <https://computerhistory.org/blog/amiga-computing-at-the-computer-history-museum/> | The Amiga 1000 was announced at a major event at New York's Lincoln Center in 1985 with Andy Warhol and Debbie Harry; sold for $1,295. |

### `windows-1-release` — 1985-11-20 — publié

| Type    | Précision     | Source                                                                         | Résumé de recherche                                                                                              |
| ------- | ------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://news.microsoft.com/de-at/features/die-geschichte-von-windows/>        | Windows 1.0 was released on November 20, 1985 (Microsoft's own Windows history feature).                         |
| primary | jour confirmé | <https://learn.microsoft.com/en-us/archive/blogs/uktechnet/history-of-windows> | Microsoft history page stating Windows 1.0 shipped on November 20, 1985, requiring 256 KB and two floppy drives. |

### `irc-created` — 1988-08-01 — à vérifier

| Type          | Précision         | Source                                        | Résumé de recherche                                                                                                                                   |
| ------------- | ----------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary       | mois seulement    | <http://www.irc.org/history_docs/jarkko.html> | Oikarinen writes that the exact date is unknown, but IRC's birthday was in August 1988, at the end of the month; the first server was tolsun.oulu.fi. |
| institutional | date non indiquée | <https://www.ietf.org/rfc/rfc1459.html>       | Standards document for the IRC protocol by Oikarinen and Reed; the search summary gives no creation date.                                             |

### `morris-worm` — 1988-11-02 — publié

| Type          | Précision         | Source                                                                               | Résumé de recherche                                                                                                                                         |
| ------------- | ----------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| institutional | jour confirmé     | <https://www.fbi.gov/history/cases-and-criminals/morris-worm>                        | At around 8:30 p.m. on November 2, 1988, the worm was unleashed on the Internet from an MIT computer; about 6,000 of 60,000 connected machines were halted. |
| institutional | date non indiquée | <https://www.cs.cornell.edu/courses/cs1110/2009sp/assignments/a1/p706-eisenberg.pdf> | Cornell commission report on Robert T. Morris's worm; date not given in the search summary.                                                                 |

### `www-proposal` — 1989-03-12 — à vérifier

| Type          | Précision      | Source                                                                                    | Résumé de recherche                                                                                                                                 |
| ------------- | -------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary       | mois seulement | <https://www.w3.org/History/1989/proposal-msw.html>                                       | The original proposal document, dated March 1989, describing a distributed hypertext system for CERN.                                               |
| institutional | mois seulement | <https://home.cern/news/news/computing/web30-30-year-anniversary-invention-changed-world> | CERN dates the proposal to March 1989 and held its Web@30 celebration on 12 March 2019; the search summary does not state 12 March 1989 explicitly. |

### `arpanet-decommissioned` — 1990-02-28 — à vérifier

| Type          | Précision       | Source                                                   | Résumé de recherche                                            |
| ------------- | --------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| institutional | année seulement | <https://www.computerhistory.org/internethistory/1990s/> | States that ARPANET formally shuts down in 1990; no day given. |

### `first-web-server` — 1990-12-25 — à vérifier

| Type          | Précision      | Source                                                                                    | Résumé de recherche                                                                                                                        |
| ------------- | -------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| institutional | mois seulement | <https://timeline.web.cern.ch/worlds-first-browsereditor-website-and-server-go-live-cern> | By Christmas 1990 Berners-Lee had written the first browser/editor and server software, running on a NeXT computer at CERN (info.cern.ch). |
| institutional | mois seulement | <https://home.cern/science/computing/the-birth-of-the-web/short-history-web/>             | By Christmas 1990 the Web's basic concepts (HTML, HTTP, URL) and first server were in place; no exact day.                                 |

### `first-website` — 1991-08-06 — publié

| Type          | Précision      | Source                                                                                    | Résumé de recherche                                                                                                                   |
| ------------- | -------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| primary       | mois seulement | <https://www.w3.org/People/Berners-Lee/1991/08/art-6484.txt>                              | Original alt.hypertext post by timbl@info.cern.ch announcing the WWW project, archived under 1991/08.                                 |
| institutional | jour confirmé  | <https://timeline.web.cern.ch/berners-lee-posts-a-summary-of-the-project-on-althypertext> | The first announcement was made on 6 August 1991 to the alt.hypertext newsgroup, with instructions to get the WWW software from CERN. |

### `info-cern-ch` — 1991-08-06 — publié

| Type          | Précision     | Source                                                                        | Résumé de recherche                                                                                                                                                                         |
| ------------- | ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary       | jour confirmé | <https://www.w3.org/People/Berners-Lee/1991/08/art-6484.txt>                  | Copy of Tim Berners-Lee's August 6, 1991 alt.hypertext post announcing WorldWideWeb and pointing to info.cern.ch.                                                                           |
| institutional | jour confirmé | <https://home.cern/science/computing/the-birth-of-the-web/short-history-web/> | CERN: on 6 August 1991 the files were made available by FTP and announced on alt.hypertext, opening the Web to the public (server info.cern.ch had run internally at CERN since late 1990). |

### `linux-announced` — 1991-08-25 — publié

| Type    | Précision     | Source                                             | Résumé de recherche                                                                                                  |
| ------- | ------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://lwn.net/2001/0823/a/lt-announcement.php3> | Reproduces Torvalds's 25 August 1991 comp.os.minix post announcing a free OS for 386(486) AT clones, 'just a hobby'. |

### `first-webcam` — 1991-11-01 — à vérifier

| Type    | Précision       | Source                                              | Résumé de recherche                                                                                                                                  |
| ------- | --------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | mois seulement  | <https://www.cl.cam.ac.uk/coffee/qsf/timeline.html> | XCoffee was created in late (November) 1991; first published mention by Bob Metcalfe on 27 January 1992; images reached the Web on 22 November 1993. |
| primary | année seulement | <https://www.cl.cam.ac.uk/coffee/qsf/coffee.html>   | The camera started in 1991 on the local network; the first Web images of the pot appeared on 22 November 1993.                                       |

### `linux-gpl` — 1992-02-01 — à vérifier

| Type    | Précision     | Source                                                                                | Résumé de recherche                                                                                                                                                    |
| ------- | ------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <http://mirrors.edge.kernel.org/pub/linux/kernel/Historic/old-versions/RELNOTES-0.12> | Torvalds announces the copyright will change to the GNU copyleft, taking effect as of the first of February (1992), removing the no-commercial-distribution condition. |

### `windows-31` — 1992-04-06 — publié

| Type          | Précision         | Source                                                                      | Résumé de recherche                                                                                     |
| ------------- | ----------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| institutional | jour confirmé     | <https://www.computerhistory.org/tdih/april/6/>                             | Microsoft released Windows 3.1 on April 6, 1992, retail price $149, with over 1 million advance orders. |
| primary       | date non indiquée | <https://learn.microsoft.com/en-us/shows/history/history-of-microsoft-1992> | Microsoft's own 1992 history episode covering the Windows 3.1 release; exact date not in summary.       |

### `first-web-photo` — 1992-07-18 — à vérifier

| Type          | Précision         | Source                                                                 | Résumé de recherche                                                                                       |
| ------------- | ----------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| primary       | jour confirmé     | <https://musiclub.web.cern.ch/MusiClub/bands/cernettes/firstband.html> | On July 18, 1992 the first picture of Les Horribles Cernettes was uploaded to the Web by Tim Berners-Lee. |
| institutional | date non indiquée | <http://cds.cern.ch/record/1711824?ln=en>                              | CERN record on the Cernettes photo as the origin of images on the Web; date not stated in summary.        |

### `first-sms` — 1992-12-03 — publié

| Type    | Précision     | Source                                                                                                           | Résumé de recherche                                                                                                                       |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://www.vodafone.co.uk/newscentre/features/merry-christmas-the-30th-anniversary-of-the-first-text-message/> | Neil Papworth sent the first text message, 'Merry Christmas', from a computer to Richard Jarvis's Orbitel 901 handset on 3 December 1992. |
| primary | jour confirmé | <https://www.vodafone.com/news/newsroom/technology/25-anniversary-text-message>                                  | Vodafone marks 25 years since the first SMS sent on 3 December 1992.                                                                      |

### `mosaic-release` — 1993-04-22 — à vérifier

| Type          | Précision      | Source                                                                      | Résumé de recherche                                                                                                                                                           |
| ------------- | -------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary       | mois seulement | <https://www.ncsa.illinois.edu/research/project-highlights/ncsa-mosaic/>    | The X (Unix) version of Mosaic was released in April 1993; Windows and Macintosh versions followed in December (an NCSA 30 page also cites an early 23 January 1993 release). |
| institutional | jour confirmé  | <https://www.guinnessworldrecords.com/world-records/first-internet-browser> | Released on 22 April 1993, NCSA Mosaic was created at NCSA, University of Illinois Urbana-Champaign.                                                                          |

### `www-public-domain` — 1993-04-30 — publié

| Type          | Précision     | Source                                                                | Résumé de recherche                                                                          |
| ------------- | ------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| primary       | jour confirmé | <https://cds.cern.ch/record/1164399>                                  | The signed CERN document releasing the WWW software into the public domain on 30 April 1993. |
| institutional | jour confirmé | <https://timeline.web.cern.ch/cern-puts-world-wide-web-public-domain> | On 30 April 1993 CERN put the World Wide Web software in the public domain.                  |

### `yahoo-founded` — 1994-04-01 — à vérifier

| Type          | Précision       | Source                                                                            | Résumé de recherche                                                                                                                                                            |
| ------------- | --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| institutional | DATE DIFFÉRENTE | <https://web.stanford.edu/class/e145/2007_fall/materials/Yahoo_1995_STVPCase.pdf> | States Yahoo was founded in January 1994 as 'Jerry and David's Guide to the World Wide Web', renamed Yahoo about three months later (≈April 1994), incorporated March 2, 1995. |

### `lycos-com` — 1994-07-20 — à vérifier

| Type          | Précision       | Source                                            | Résumé de recherche                                                                         |
| ------------- | --------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| primary       | jour confirmé   | <https://lazytoad.com/lti/pub/ieee97.html>        | Creator's paper: Lycos went public on July 20, 1994 with a catalog of 54,000 documents.     |
| institutional | année seulement | <https://www.cs.cmu.edu/csd50/dr-michael-mauldin> | CMU: Lycos was created in 1994 by Michael Mauldin at Carnegie Mellon as a research project. |

### `lycos-launch` — 1994-07-20 — à vérifier

| Type          | Précision       | Source                                             | Résumé de recherche                                                                                                         |
| ------------- | --------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| primary       | jour confirmé   | <http://lazytoad.com/lti/lycos/lycos-post-02.html> | Mauldin's announcement posted to robots@nexor.co.uk on July 20, 1994: Lycos goes public with a catalog of 54,000 documents. |
| institutional | année seulement | <https://www.cs.cmu.edu/csd50/dr-michael-mauldin>  | Lycos was created from a research project by Michael 'Fuzzy' Mauldin at Carnegie Mellon in 1994.                            |

### `netscape-navigator` — 1994-12-15 — publié

| Type      | Précision         | Source                                                                                                         | Résumé de recherche                                                                                                                           |
| --------- | ----------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| reference | jour confirmé     | <https://www.ebsco.com/research-starters/computer-science/release-netscape-navigator-10>                       | Netscape Navigator 1.0 was released on December 15, 1994, from Mountain View, California, and took 75% of the market within four months.      |
| reference | date non indiquée | <https://www.britannica.com/technology/Netscape-Navigator>                                                     | Britannica article on the Netscape Navigator browser; the search summary does not give the exact day.                                         |
| press     | jour non attribué | <https://www.neowin.net/news/a-quick-look-back-at-the-launch-of-netscape-navigator-10-29-years-ago-this-week/> | Article rétrospectif ; le résumé de recherche situe la sortie de Navigator 1.0 au 15 décembre 1994 sans l'attribuer précisément à cette page. |

### `yahoo-com` — 1995-01-18 — à vérifier

| Type      | Précision       | Source                                                          | Résumé de recherche                                                                                                     |
| --------- | --------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| reference | jour confirmé   | <https://www.webdesignmuseum.org/web-design-history/yahoo-1994> | States Yahoo! was renamed in March 1994 and the yahoo.com domain was registered on January 18, 1995.                    |
| reference | année seulement | <https://www.britannica.com/money/Yahoo-Inc>                    | Yahoo founded 1994 by Stanford students Jerry Yang and David Filo; incorporated April 1995 (no domain date in summary). |

### `amazon-com` — 1995-07-16 — à vérifier

| Type          | Précision      | Source                                                                                                                         | Résumé de recherche                                                                                              |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| primary       | mois seulement | <https://press.aboutamazon.com/news-releases/news-release-details/amazoncom-celebrates-fifth-anniversary-timeline-illustrates> | Amazon press release timeline: in July 1995 Amazon.com opened as an online bookseller from Bezos' Bellevue home. |
| institutional | jour confirmé  | <https://mimmsmuseum.org/2025/07/16/celebrating-30-years-of-amazon-com-from-bookstore-to-global-tech-titan/>                   | Museum timeline (published on the 30th anniversary, 2025-07-16): Amazon.com opened on July 16, 1995.             |

### `amazon-launch` — 1995-07-16 — publié

| Type    | Précision      | Source                                                                                                                         | Résumé de recherche                                                                                                                                 |
| ------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | mois seulement | <https://press.aboutamazon.com/news-releases/news-release-details/amazoncom-celebrates-fifth-anniversary-timeline-illustrates> | Amazon's July 2000 anniversary release: in July 1995 Amazon.com opened as an online bookseller out of Bezos' Bellevue home.                         |
| primary | jour confirmé  | <https://www.aboutamazon.com/news/workplace/first-amazon-office-jeff-bezos-garage>                                             | On July 16, 1995, Bezos invited 300 friends to beta test the website; the first book sold was Hofstadter's 'Fluid Concepts and Creative Analogies'. |

### `windows-95-release` — 1995-08-24 — publié

| Type          | Précision     | Source                                                          | Résumé de recherche                                                                                                                     |
| ------------- | ------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| primary       | jour confirmé | <https://news.microsoft.com/announcement/launch-of-windows-95/> | Microsoft's own announcement page for the Windows 95 launch, surfaced in a search whose results give 24 August 1995 as the launch date. |
| institutional | jour confirmé | <https://www.computerhistory.org/tdih/august/24/>               | CHM 'This Day in History' for August 24 is titled 'Microsoft Ships Windows 95' (launch on 24 August 1995).                              |

### `ebay-founded` — 1995-09-03 — publié

| Type    | Précision      | Source                                         | Résumé de recherche                                                                                                                                                     |
| ------- | -------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | mois seulement | <https://www.ebayinc.com/company/our-history/> | eBay's history page says Omidyar launched AuctionWeb after spending Labor Day weekend 1995 writing code; this is consistent with September 1995 but gives no exact day. |
| press   | jour confirmé  | <https://time.com/4013672/ebay-founded-story/> | This came up in a search whose summary says eBay was founded on 3 September 1995 as AuctionWeb. The summary does not say which result stated the exact day.             |

### `excite-com` — 1995-10-01 — à vérifier

| Type          | Précision         | Source                                                                                          | Résumé de recherche                                                                                  |
| ------------- | ----------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| reference     | mois seulement    | <https://www.encyclopedia.com/economics/encyclopedias-almanacs-transcripts-and-maps/excitehome> | In October 1995 Architext launched the Excite suite of services at www.excite.com.                   |
| institutional | date non indiquée | <https://www.computerhistory.org/collections/catalog/102737095>                                 | CHM collection record for Architext Software (Excite's original company); no launch date in summary. |

### `geocities-com` — 1995-12-01 — à vérifier

| Type          | Précision         | Source                                                              | Résumé de recherche                                                                                                      |
| ------------- | ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| reference     | année seulement   | <https://www.webdesignmuseum.org/web-design-history/geocities-1994> | Beverly Hills Internet founded November 1994 by David Bohnett and John Rezner, renamed GeoCities in 1995 (no day given). |
| institutional | date non indiquée | <https://www.computerhistory.org/collections/catalog/102738191>     | CHM oral-history record with co-founder David Bohnett; summary gives no launch date.                                     |

### `altavista-com` — 1995-12-15 — publié

| Type          | Précision         | Source                                                                                                                                                                                                                                   | Résumé de recherche                                                                                                                                                           |
| ------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reference     | jour confirmé     | <https://www.webdesignmuseum.org/web-design-history/altavista-1995>                                                                                                                                                                      | States that on December 15, 1995 a DEC research team led by Louise Monier and Michael Burrows launched AltaVista.                                                             |
| institutional | année seulement   | <https://www.computerhistory.org/revolution/the-web/20/intro/2056>                                                                                                                                                                       | CHM exhibit: AltaVista, first full-text web search, created in 1995 at DEC's Palo Alto lab (no day given in summary).                                                         |
| press         | jour non attribué | <https://www.tomshardware.com/tech-industry/big-tech/search-pioneer-altavistas-star-shone-bright-with-a-clean-and-minimal-ui-30-years-ago-engine-lost-momentum-after-multiple-ownership-changes-and-the-embrace-of-the-web-portal-trend> | Article rétrospectif ; le résumé de recherche situe le lancement au 15 décembre 1995 sans l'attribuer précisément à cette page. Aucun communiqué de Digital Equipment trouvé. |

### `altavista-launch` — 1995-12-15 — publié

| Type      | Précision         | Source                                                                                                                                                                                                                                   | Résumé de recherche                                                                                                                                                           |
| --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reference | jour confirmé     | <https://www.encyclopedia.com/books/politics-and-business-magazines/altavista-company>                                                                                                                                                   | The search summary states that AltaVista, built by researchers at Digital Equipment, launched on 15 December 1995. The summary does not tie the day to this one result.       |
| press     | jour non attribué | <https://www.tomshardware.com/tech-industry/big-tech/search-pioneer-altavistas-star-shone-bright-with-a-clean-and-minimal-ui-30-years-ago-engine-lost-momentum-after-multiple-ownership-changes-and-the-embrace-of-the-web-portal-trend> | Article rétrospectif ; le résumé de recherche situe le lancement au 15 décembre 1995 sans l'attribuer précisément à cette page. Aucun communiqué de Digital Equipment trouvé. |

### `hotmail-com` — 1996-07-04 — publié

| Type    | Précision         | Source                                                                                            | Résumé de recherche                                                                                        |
| ------- | ----------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé     | <https://news.microsoft.com/1999/02/08/msn-hotmail-from-zero-to-30-million-members-in-30-months/> | Microsoft press release (1999): 2-1/2 years after its July 4, 1996 launch, Hotmail had 30 million members. |
| primary | date non indiquée | <https://news.microsoft.com/source/1997/12/31/microsoft-acquires-hotmail/>                        | Acquisition press release (1997-12-31); launch date not given in summary.                                  |

### `hotmail-launch` — 1996-07-04 — publié

| Type    | Précision         | Source                                                                                            | Résumé de recherche                                                                                                                                            |
| ------- | ----------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé     | <https://news.microsoft.com/1999/02/08/msn-hotmail-from-zero-to-30-million-members-in-30-months/> | Microsoft's press release says Hotmail launched on 4 July 1996 and had more than 30 million active members 2.5 years later.                                    |
| press   | date non indiquée | <https://www.technologyreview.com/innovator/sabeer-bhatia/>                                       | MIT Technology Review names Bhatia and Jack Smith as the founders of Hotmail, the first free web-based email service. The summary gives no date for this page. |

### `icq-launch` — 1996-11-15 — à vérifier

| Type  | Précision      | Source                                                                                                               | Résumé de recherche                                                                                                                               |
| ----- | -------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| press | mois seulement | <https://www.haaretz.com/israel-news/business/2016-11-22/ty-article/technation/0000017f-e78d-da9b-a1ff-efeffe0f0000> | Haaretz (22 Nov 2016) says ICQ, made by the Israeli startup Mirabilis, was first released 20 years earlier that month, which means November 1996. |

### `wifi-80211` — 1997-06-26 — à vérifier

| Type          | Précision       | Source                                         | Résumé de recherche                                                                                                                                                |
| ------------- | --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| institutional | jour confirmé   | <https://standards.ieee.org/ieee/802.11/1163/> | The IEEE SA page gives Board approval of 802.11 on 26 June 1997 and publication on 18 November 1997. The repo date is the approval date, not the publication date. |
| primary       | année seulement | <https://ieeexplore.ieee.org/document/654749/> | The full text of the 802.11-1997 standard as published by IEEE (1997).                                                                                             |

### `google-com` — 1997-09-15 — publié

| Type          | Précision     | Source                                                                 | Résumé de recherche                                                                                                                                                                      |
| ------------- | ------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| institutional | jour confirmé | <https://graphics.stanford.edu/~dk/google_name_origin.html>            | Stanford page: Larry Page registered google.com on September 15, 1997 after a misspelling of 'googol'. Note: this is the domain registration; Google Inc. was founded September 4, 1998. |
| press         | jour confirmé | <https://9to5google.com/2017/09/15/google-domain-20-year-anniversary/> | Article dated 2017-09-15 stating google.com was registered September 15, 1997.                                                                                                           |

### `google-founded` — 1998-09-04 — publié

| Type    | Précision      | Source                                                                             | Résumé de recherche                                                                                                                                                           |
| ------- | -------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | mois seulement | <https://about.google/intl/ALL_us/our-story/>                                      | Google's 'Our Story' page describes the August 1998 Bechtolsheim cheque and incorporation in September 1998. The search summary also gives incorporation on 4 September 1998. |
| primary | mois seulement | <https://www.sec.gov/Archives/edgar/data/0001288776/000119312504204864/d424b3.htm> | The search summary says the SEC filings list Google's incorporation in California as September 1998.                                                                          |

### `napster-com` — 1999-06-01 — à vérifier

| Type          | Précision       | Source                                                                                                     | Résumé de recherche                                                                  |
| ------------- | --------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| press         | jour confirmé   | <https://www.npr.org/2024/06/02/nx-s1-4985877/25-years-ago-napster-changed-how-we-listen-to-music-forever> | NPR 25th-anniversary piece: Napster launched June 1, 1999, created by Shawn Fanning. |
| institutional | année seulement | <https://www.computerhistory.org/revolution/the-web/20/403/2128>                                           | CHM exhibit entry on Napster's 1999 arrival and decentralized P2P music sharing.     |

### `napster-launch` — 1999-06-01 — à vérifier

| Type      | Précision       | Source                                                                                                                | Résumé de recherche                                                                                                                                   |
| --------- | --------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| press     | jour confirmé   | <https://www.npr.org/2024/06/03/nx-s1-4982796/napster-the-file-sharing-service-helped-to-disrupt-the-record-industry> | This NPR anniversary piece (June 2024) came up in a search whose summary says Napster was born on 1 June 1999 as a peer-to-peer file-sharing service. |
| reference | année seulement | <https://www.britannica.com/topic/Napster>                                                                            | Britannica says Napster was created by college student Shawn Fanning in 1999.                                                                         |

### `msn-messenger-launch` — 1999-07-22 — à vérifier

| Type    | Précision     | Source                                                                                                                             | Résumé de recherche                                                                                                 |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://news.microsoft.com/source/1999/07/21/microsoft-launches-msn-messenger-service/>                                           | The press release is dated 21 July 1999 and says the client could be downloaded free from midnight on 22 July 1999. |
| primary | jour confirmé | <https://news.microsoft.com/source/1999/07/28/msn-messenger-service-reaches-over-700000-people-in-first-six-days-of-availability/> | Microsoft says the service reached more than 700,000 people after becoming available on 22 July 1999.               |

### `dotcom-peak` — 2000-03-10 — publié

| Type      | Précision      | Source                                                                                     | Résumé de recherche                                                                                                                                        |
| --------- | -------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| press     | jour confirmé  | <https://www.npr.org/2010/03/10/124537450/a-decade-later-nasdaq-is-half-its-all-time-high> | This NPR piece, dated 10 March 2010, marks ten years since the NASDAQ peak, which the search summary gives as a record close of 5,048.62 on 10 March 2000. |
| reference | mois seulement | <https://www.britannica.com/money/dot-com-bubble>                                          | Britannica says the NASDAQ fell from 5,048 to 1,139 between March 2000 and October 2002.                                                                   |

### `wikipedia-launch` — 2001-01-15 — publié

| Type      | Précision       | Source                                                                                            | Résumé de recherche                                                                                                                                                                   |
| --------- | --------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reference | jour confirmé   | <https://www.britannica.com/topic/Wikipedia>                                                      | The search summary says Wikipedia launched on 15 January 2001, founded by Wales and Sanger as a companion to Nupedia. Britannica's article is one of the results behind that summary. |
| press     | année seulement | <https://content.time.com/time/specials/packages/article/0,28804,2042333_2042334_2042587,00.html> | TIME says Larry Sanger co-founded Wikipedia with Jimmy Wales in 2001.                                                                                                                 |

### `wikipedia-org` — 2001-01-15 — publié

| Type      | Précision       | Source                                                                               | Résumé de recherche                                                                                                  |
| --------- | --------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| reference | jour confirmé   | <https://www.britannica.com/topic/Wikipedia>                                         | Wikipedia launched January 15, 2001 as a feature of Nupedia.com, relaunched as an independent site a few days later. |
| primary   | année seulement | <https://wikimediafoundation.org/news/2016/01/14/wikipedia-15-foundation-endowment/> | WMF announcement of Wikipedia's 15th anniversary (Jan 2016), consistent with a January 2001 launch.                  |

### `bittorrent-release` — 2001-07-02 — à vérifier

| Type      | Précision         | Source                                                                                       | Résumé de recherche                                                                                                                 |
| --------- | ----------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| press     | jour confirmé     | <https://torrentfreak.com/bittorrent-turns-20-the-file-sharing-revolution-revisited-210702/> | TorrentFreak (2 July 2021) quotes Bram Cohen's Yahoo! group post of 2 July 2001: 'My new app, BitTorrent, is now in working order'. |
| reference | date non indiquée | <https://www.britannica.com/technology/BitTorrent>                                           | Britannica's BitTorrent article came up in the same search. The summary does not give its date.                                     |

### `ipod-announced` — 2001-10-23 — publié

| Type          | Précision     | Source                                                          | Résumé de recherche                                                                                   |
| ------------- | ------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| primary       | jour confirmé | <https://www.apple.com/newsroom/2001/10/23Apple-Presents-iPod/> | Apple's press release of 23 October 2001 introduces the iPod: 1,000 songs, 5 GB hard drive, FireWire. |
| institutional | jour confirmé | <https://www.computerhistory.org/tdih/october/23/>              | CHM 'This Day in History' for 23 October is titled 'Apple Computer Releases the iPod'.                |

### `myspace-com` — 2003-08-01 — à vérifier

| Type      | Précision      | Source                                                            | Résumé de recherche                                                                                |
| --------- | -------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| reference | mois seulement | <https://www.britannica.com/topic/Myspace>                        | Myspace founded August 2003 by Tom Anderson and Chris DeWolfe, then at eUniverse.                  |
| reference | mois seulement | <https://www.webdesignmuseum.org/web-design-history/myspace-2003> | In August 2003 Tom Anderson and Chris DeWolfe founded MySpace; one million users by February 2004. |

### `myspace-launch` — 2003-08-01 — à vérifier

| Type          | Précision       | Source                                                           | Résumé de recherche                                                                                                             |
| ------------- | --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| reference     | DATE DIFFÉRENTE | <https://www.britannica.com/topic/Myspace>                       | Britannica says Tom Anderson and Chris DeWolfe launched the site on 15 August 2003. The repo has 1 August 2003.                 |
| institutional | DATE DIFFÉRENTE | <https://www.computerhistory.org/revolution/the-web/20/403/2360> | This came up in a search whose summary says MySpace launched on 15 August 2003. The summary does not tie that day to this page. |

### `skype-launch` — 2003-08-29 — à vérifier

| Type      | Précision       | Source                                                                                             | Résumé de recherche                                                                                                                                     |
| --------- | --------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary   | jour confirmé   | <https://blogs.skype.com/stories/2013/08/28/skype-celebrates-a-decade-of-meaningful-conversations> | Skype's 10th-anniversary post (Aug 2013) came up in a search whose summary says Skype was founded or launched on 29 August 2003 by Zennström and Friis. |
| reference | année seulement | <https://www.britannica.com/technology/Skype>                                                      | Britannica calls Skype, founded by Niklas Zennström and Janus Friis, one of the early VoIP successes (2003).                                            |

### `facebook-launch` — 2004-02-04 — publié

| Type  | Précision     | Source                                                                                    | Résumé de recherche                                                                                                                           |
| ----- | ------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| press | jour confirmé | <https://www.thecrimson.com/article/2004/2/9/hundreds-register-for-new-facebook-website/> | This contemporary Crimson article reports that thefacebook.com was launched to the Harvard campus on 4 February and that hundreds registered. |
| press | jour confirmé | <https://www.thecrimson.com/article/2014/2/4/facebook-ten-years-feature-1/>               | The Crimson says that on 4 February 2004 Mark Zuckerberg launched thefacebook from his Kirkland House dorm room.                              |

### `gmail-com` — 2004-04-01 — publié

| Type    | Précision     | Source                                                                            | Résumé de recherche                                                                                   |
| ------- | ------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <http://googlepress.blogspot.com/2004/04/google-gets-message-launches-gmail.html> | Google press release of April 1, 2004 announcing a preview (test) release of Gmail with 1 GB storage. |
| press   | jour confirmé | <https://time.com/43263/gmail-10th-anniversary/>                                  | TIME 10th-anniversary article (April 1, 2014) on Gmail's April 1, 2004 launch.                        |

### `gmail-launch` — 2004-04-01 — publié

| Type    | Précision     | Source                                                                            | Résumé de recherche                                                                                     |
| ------- | ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <http://googlepress.blogspot.com/2004/04/google-gets-message-launches-gmail.html> | Google's press release of 1 April 2004 announces a test preview of Gmail with 1,000 MB of free storage. |
| press   | jour confirmé | <https://time.com/43263/gmail-10th-anniversary/>                                  | TIME's 10th-anniversary article (1 April 2014) tells the story of Gmail's launch ten years earlier.     |

### `firefox-1` — 2004-11-09 — publié

| Type    | Précision      | Source                                                                                                                       | Résumé de recherche                                                                                        |
| ------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé  | <https://www-archive.mozilla.org/press/mozilla-2004-11-09.html>                                                              | The Mozilla Foundation's press release of 9 November 2004 announces worldwide availability of Firefox 1.0. |
| primary | mois seulement | <https://blog.mozilla.org/press/2004/11/mozilla-foundation-releases-the-highly-anticipated-mozilla-firefox-1-0-web-browser/> | The same announcement on the Mozilla Press Center (November 2004).                                         |

### `youtube-founded` — 2005-02-14 — publié

| Type      | Précision     | Source                                                                  | Résumé de recherche                                                                                        |
| --------- | ------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| reference | jour confirmé | <https://www.britannica.com/topic/YouTube>                              | Britannica says Chen, Hurley and Karim registered the YouTube domain on 14 February 2005.                  |
| press     | jour confirmé | <https://www.npr.org/2025/02/14/nx-s1-5296900/youtube-20th-anniversary> | NPR's piece of 14 February 2025 marks YouTube's 20th anniversary, dating its founding to 14 February 2005. |

### `first-youtube-video` — 2005-04-23 — publié

| Type    | Précision     | Source                                                                                                                                             | Résumé de recherche                                                                                                                                                                                         |
| ------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://blog.youtube/news-and-events/va-museum-youtube-first-video/>                                                                              | The search summary says 'Me at the zoo' became the first video uploaded to YouTube on Saturday 23 April 2005. This YouTube blog post about the V&A preserving it is one of the results behind that summary. |
| press   | jour confirmé | <https://www.smithsonianmag.com/smart-news/watch-the-first-ever-video-uploaded-to-youtube-a-grainy-19-second-clip-called-me-at-the-zoo-180988225/> | The search summary says Jawed Karim uploaded 'Me at the zoo' on 23 April 2005. This Smithsonian article is one of the results behind that summary.                                                          |

### `youtube-com` — 2005-04-23 — à vérifier

| Type          | Précision     | Source                                                                                                                                             | Résumé de recherche                                                                                                                                                                   |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| institutional | jour confirmé | <https://www.vam.ac.uk/articles/acquiring-an-early-youtube-watch-page-and-its-first-ever-video>                                                    | 'Me at the zoo', the first YouTube video, was uploaded April 23, 2005; YouTube itself founded (domain) February 14, 2005 — repo date is the first-upload date, not domain activation. |
| press         | jour confirmé | <https://www.smithsonianmag.com/smart-news/watch-the-first-ever-video-uploaded-to-youtube-a-grainy-19-second-clip-called-me-at-the-zoo-180988225/> | First video 'Me at the zoo' uploaded April 23, 2005 by co-founder Jawed Karim.                                                                                                        |

### `twitter-launch` — 2006-07-15 — à vérifier

| Type      | Précision     | Source                                                                 | Résumé de recherche                                                                                                                                                                       |
| --------- | ------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reference | jour confirmé | <https://www.britannica.com/money/Twitter>                             | The search summary says the completed version of Twitter debuted on 15 July 2006, after the first tweet on 21 March 2006. Britannica's article is one of the results behind that summary. |
| press     | jour confirmé | <https://www.history.com/this-day-in-history/july-15/twitter-launches> | HISTORY says Odeo released Twttr to the public on 15 July 2006.                                                                                                                           |

### `youtube-acquired` — 2006-10-09 — publié

| Type    | Précision     | Source                                                                               | Résumé de recherche                                                                                  |
| ------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://googlepress.blogspot.com/2006/10/google-to-acquire-youtube-for-165_09.html> | Google announced on 9 October 2006 that it had agreed to acquire YouTube for $1.65 billion in stock. |
| primary | jour confirmé | <https://www.sec.gov/Archives/edgar/data/0001288776/000119312506206884/dex991.htm>   | The same 9 October 2006 announcement as filed with the SEC. The deal closed on 13 November 2006.     |

### `iphone-announced` — 2007-01-09 — publié

| Type    | Précision     | Source                                                                            | Résumé de recherche                                                                                                                                |
| ------- | ------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://www.apple.com/newsroom/2007/01/09Apple-Reinvents-the-Phone-with-iPhone/> | Apple's press release of 9 January 2007 (Macworld San Francisco) introduces the iPhone as phone, widescreen iPod and Internet communicator in one. |

### `netflix-streaming` — 2007-01-16 — à vérifier

| Type    | Précision      | Source                                                                           | Résumé de recherche                                                                                                                                                           |
| ------- | -------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | mois seulement | <https://www.sec.gov/Archives/edgar/data/0001065280/000119312507042689/d10k.htm> | Netflix's annual report says the company introduced a feature in January 2007 that lets subscribers instantly watch movies and TV series on their PCs. No exact day is given. |

### `iphone-france` — 2007-11-29 — à vérifier

| Type    | Précision     | Source                                                                                                     | Résumé de recherche                                                                                                                                                |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| primary | jour confirmé | <https://www.apple.com/newsroom/2007/10/16Apple-Chooses-Orange-as-Exclusive-Carrier-for-iPhone-in-France/> | Apple's press release says the iPhone would debut in France with Orange on Thursday 29 November, at 399 euros for the 8 GB model.                                  |
| primary | jour confirmé | <https://histoire.orange.com/fr/nos_objets/iphone/>                                                        | This came up in a search whose summary says the device was sold in France from 29 November 2007. The summary does not tie that day to Orange's history page alone. |

### `app-store-opens` — 2008-07-10 — publié

| Type    | Précision      | Source                                                                 | Résumé de recherche                                                                                                                                                  |
| ------- | -------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé  | <https://www.apple.com/newsroom/2008/07/10iPhone-3G-on-Sale-Tomorrow/> | Apple's release of 10 July 2008 says the App Store was available from that day via iTunes 7.7 with more than 500 apps, before the iPhone 3G went on sale on 11 July. |
| primary | mois seulement | <https://www.apple.com/newsroom/2018/07/app-store-turns-10/>           | Apple's July 2018 post marks the App Store's 10th anniversary.                                                                                                       |

### `chrome-release` — 2008-09-02 — publié

| Type    | Précision     | Source                                                                               | Résumé de recherche                                                                                                               |
| ------- | ------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://googleblog.blogspot.com/2008/09/fresh-take-on-browser.html>                 | Search summary: Google announced Chrome on the Official Google Blog as a 'fresh take on the browser', launched September 2, 2008. |
| primary | jour confirmé | <https://googlepress.blogspot.com/2008/09/google-chrome-new-take-on-browser_02.html> | Press release: Google launched Google Chrome on September 2, 2008, beta in 40+ languages, each tab a separate process.            |

### `android-htc-dream` — 2008-09-23 — publié

| Type    | Précision     | Source                                                                                            | Résumé de recherche                                                                                                                        |
| ------- | ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| primary | jour confirmé | <https://www.t-mobile.com/news/press/t-mobile-unveils-the-t-mobile-g1-the-first-phone-powered-by> | T-Mobile press release: on September 23, 2008 T-Mobile announced the first Android-powered phone, on sale in the US from October 22, 2008. |
| press   | jour confirmé | <https://techcrunch.com/2008/09/23/t-mobile-officially-announces-the-g1-android-phone/>           | Article dated 2008-09-23 reporting the G1 announcement at a New York launch event.                                                         |

### `android-market-opens` — 2008-10-22 — publié

| Type    | Précision     | Source                                                                                          | Résumé de recherche                                                                                                                   |
| ------- | ------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://android-developers.googleblog.com/2008/10/android-market-now-available-for-users.html> | Official post dated October 22, 2008: Android Market launched for users alongside the T-Mobile G1; developer uploads from October 27. |

### `bitcoin-whitepaper` — 2008-10-31 — publié

| Type    | Précision     | Source                                                         | Résumé de recherche                                                                                                                  |
| ------- | ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| primary | jour confirmé | <https://satoshi.nakamotoinstitute.org/emails/cryptography/1/> | Archive of Satoshi Nakamoto's email 'Bitcoin P2P e-cash paper' to the Cryptography mailing list, sent October 31, 2008 at 18:10 UTC. |

### `ipad-announced` — 2010-01-27 — publié

| Type    | Précision     | Source                                                          | Résumé de recherche                                                                          |
| ------- | ------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://www.apple.com/newsroom/2010/01/27Apple-Launches-iPad/> | Apple press release dated January 27, 2010 introducing iPad, available late March from $499. |

### `instagram-launch` — 2010-10-06 — publié

| Type      | Précision     | Source                                                | Résumé de recherche                                                                                      |
| --------- | ------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| press     | jour confirmé | <https://techcrunch.com/2010/10/06/instagram-launch/> | Contemporary launch article dated 2010-10-06.                                                            |
| reference | jour confirmé | <https://www.britannica.com/money/Instagram>          | States Instagram was released in Apple's App Store on October 6, 2010, reaching 25,000 users on day one. |

### `free-mobile-launch` — 2012-01-10 — publié

| Type  | Précision     | Source                                                                                                                          | Résumé de recherche                                                                               |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| press | jour confirmé | <https://www.franceinfo.fr/economie/entreprises/free-mobile-sera-lance-le-10-janvier_48007.html>                                | Reports the launch of Free Mobile (Iliad) on Tuesday January 10, 2012 with 2 € and 19,99 € plans. |
| press | jour confirmé | <https://www.journaldunet.com/ebusiness/internet-mobile/1096710-free-lance-un-forfait-tout-illimite-pour-19-99-euros-par-mois/> | Contemporary JDN article on the 19,99 € unlimited plan launched January 10, 2012.                 |

### `ipv6-launch` — 2012-06-06 — publié

| Type    | Précision     | Source                                                                                                                            | Résumé de recherche                                                                                             |
| ------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://www.internetsociety.org/blog/2012/01/world-ipv6-launch-on-june-6-2012-to-bring-permanent-ipv6-deployment/>               | ISOC (organiser) announced World IPv6 Launch for June 6, 2012, when participants permanently enabled IPv6.      |
| primary | jour confirmé | <https://www.internetsociety.org/news/press-releases/2012/world-ipv6-launch-solidifies-global-support-for-new-internet-protocol/> | ISOC press release on the June 6, 2012 launch (participants incl. Google, Facebook, Bing, Yahoo, Free Telecom). |

### `minitel-shutdown` — 2012-06-30 — publié

| Type  | Précision     | Source                                                                                                | Résumé de recherche                                                                                              |
| ----- | ------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| press | jour confirmé | <https://www.aljazeera.com/news/2012/6/30/france-pulls-the-plug-on-minitel>                           | Contemporary report: France Telecom shut down the Minitel network on June 30, 2012, with ~400,000 regular users. |
| press | jour confirmé | <https://www.france24.com/en/20120628-france-switches-off-landmark-minitel-network-predated-internet> | Reports the Minitel network switched off on Saturday June 30 (2012).                                             |

### `snowden-disclosures` — 2013-06-05 — publié

| Type  | Précision     | Source                                                                                                                    | Résumé de recherche                                                                                              |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| press | jour confirmé | <https://www.npr.org/sections/thetwo-way/2013/06/05/189037290/nsa-collecting-verizon-phone-records-of-american-customers> | NPR piece dated 2013-06-05 relaying The Guardian's revelation of the secret FISA court order on Verizon records. |
| press | jour confirmé | <https://www.eff.org/deeplinks/2014/05/snowden-anniversary>                                                               | EFF identifies June 5 (2013) as the date of the first Snowden release (Guardian Verizon story).                  |

### `gdpr-applies` — 2018-05-25 — publié

| Type          | Précision     | Source                                                                                                         | Résumé de recherche                                                                             |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| institutional | jour confirmé | <https://eur-lex.europa.eu/content/news/general-data-protection-regulation-GDPR-applies-from-25-May-2018.html> | EUR-Lex: the GDPR is applicable from 25 May 2018 in all Member States.                          |
| primary       | jour confirmé | <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32016R0679>                                       | Official text of Regulation 2016/679: entered into force 24 May 2016, applies from 25 May 2018. |

### `chatgpt-release` — 2022-11-30 — publié

| Type    | Précision     | Source                              | Résumé de recherche                                                                            |
| ------- | ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| primary | jour confirmé | <https://openai.com/index/chatgpt/> | OpenAI announcement of ChatGPT (GPT-3.5 based, free research preview) dated November 30, 2022. |
