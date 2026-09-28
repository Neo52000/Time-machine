# Phone Engine (2010)

Package: `packages/phone-engine`. Data: `content/phone/phone.json`. Schema:
`PhoneDataSchema` (`packages/content-schema/src/phone.ts`). Shell:
`apps/web/components/phone/` (theme `touch-2010`, `shell: "phone"`), state
in `apps/web/lib/phoneStore.ts`.

## The machine

The 2010 era is a touch smartphone (`phone-2010` in
`content/machines/machines.json`, `kind: "phone"`): a status bar (carrier,
radio, era clock), a home screen of icons, one app at a time full-screen and
a home button. It renders at 360 × 640 and scales like every machine, up to
×1.5, with its bezel and the stage tools kept on screen, so it is usable on
a phone and on a wide monitor alike. The shell and its apps are a separate
chunk: other eras never download them.

## What is historical, what is fictional

| Element                                        | Status                                                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| SMS length: 160 GSM-7 / 70 UCS-2, 153/67 split | Specification (GSM 03.38, `src-wikipedia-gsm-0338`)                                                  |
| 3G+ link: 1 Mbit/s ↓ / 384 kbit/s ↑            | Representative real throughput, `needsResearch` (nominal HSDPA is 3.6 Mbit/s, `src-wikipedia-hsdpa`) |
| Wi-Fi over home ADSL: 8 / 0.8 Mbit/s           | Representative, `needsResearch`                                                                      |
| Photo: 5 Mpx, ~1.8 Mo JPEG; MMS ~90 Ko         | Representative orders of magnitude                                                                   |
| Contacts (Léa, Maman), SMS, 500 Mo plan        | **Fictional** (`src-timemachine-phone-fiction`)                                                      |
| Store apps (Lampe de poche, Serpentin), prices | **Fictional**; nothing is ever charged                                                               |
| Sounds (unlock, tap, SMS ring, shutter)        | Original synthesis (`content/audio/cues.json`), no manufacturer sound                                |

No brand, logo or trademarked UI is reproduced: the OS is « Time Machine
Mobile 2 », the carrier « TM Mobile ».

## Engine (pure)

- **`countSms(text)`**: GSM-7 basic table (1 septet), extension table
  (`€ [ ] { } ^ ~ | \`, 2 septets); any other character (ê, ç, œ, ’, emoji)
  switches the whole message to UCS-2. Returns the encoding, units,
  segments (160/153 or 70/67), remaining capacity and the `culprit`
  character, which the counter shows (« « ê » hors alphabet SMS : 70
  caractères par SMS »).
- **SMS conversations**: `createSmsState`, `tickSms` (openings delivered at
  `afterMs`, answers `replyDelayMs` after each sent SMS, in order, then
  silence), `sendSms` (records the SMS count), `receiveSms` (story
  messages), `markRead`, `unreadCount`, `threadMessages`. No "is typing…":
  SMS never had one.
- **`transferCost(sizeKb, radio, direction)`**: time through the Computer
  Engine's `transferTimeMs`, plus the bytes counted against the allowance
  (metered radios only). `allowanceUsed` feeds the settings gauge.
- **Serpentin**: `createSnake`, `turn` (U-turns ignored, turns queued per
  step), `stepSnake` (walls and self-bites end the game; the random source
  is injected, so the rules are unit-tested).
- **`createPhoneCatalog`** fails fast on duplicate ids, a thread for an
  unknown contact, a missing `mobile` radio or an unknown source.

## Apps

| App       | What it teaches                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Messages  | The live 160/70 counter, multi-part SMS, SMS arriving as banners anywhere on the phone                              |
| Photo     | Weight of a 5 Mpx photo; MMS (reduced, operator network) vs full upload (3G+ slow and metered, Wi-Fi fast and free) |
| Boutique  | An app is a download, timed on the radio in use and counted on 3G+; installed apps join the home screen             |
| Réglages  | Wi-Fi, airplane mode (blocks SMS and data), data used vs the plan, the phone's profile                              |
| Serpentin | The store's game: swipe, pad or arrow keys                                                                          |

Transfers are replayed ×10 faster, and the screen says so with the real
duration.

## Story

Sending an SMS, a multi-part SMS, installing an app, an MMS, a Wi-Fi upload
and 5 points at Serpentin emit `service.opened` (`kiosk` = `sms`, `store`,
`photo`, `game`; the photo carries `network`) and earn the six 2010 passport
stamps. Léa answers an MMS through `send.message` (delivered as an SMS); a
3G+ upload raises a plan warning; all six stamps unlock the « Aurore »
wallpaper.
