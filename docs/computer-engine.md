# Computer Engine

Package: `packages/computer-engine`. Data: `content/machines/machines.json`.
Schema: `MachineProfileSchema` / `NetworkLinkSchema`
(`packages/content-schema/src/computer.ts`).

## What it models

The hardware and network link behind each era's machine.
`EraManifest.machine.id` points at a profile id; a unit test fails if an era
references a machine with no profile.

| Profile      | Kind              | Link                         | Used by |
| ------------ | ----------------- | ---------------------------- | ------- |
| `minitel-1b` | terminal          | modem 1200/75 bauds (V.23)   | 1985    |
| `pc-1992`    | personal-computer | modem 14 400 bit/s (V.32bis) | 1992    |
| `pc-1998`    | personal-computer | modem 56 kbit/s              | 1998    |
| `pc-2005`    | personal-computer | ADSL 2 Mbit/s (to confirm)   | 2005    |

## Honesty rules

- A profile is a **representative configuration**, never a specific
  commercial product: the CPU is described generically ("Processeur x86"),
  the OS is the project's fictional "Time Machine OS". No trademark is
  reproduced.
- Every profile cites `sourceIds` (validated against `content/sources`);
  a figure that is plausible but unsourced sets `needsResearch: true` and
  is shown as "à vérifier" in the museum (the 2005 ADSL speed).

## API

```ts
machineCatalog.getMachine(id); // validated at module load
machineCatalog.sourcesOf(machine); // cited sources, in order
transferTimeMs(bytes, link, "down" | "up"); // latency + bytes × bits-per-byte / bps
estimatePayloadBytes(value); // UTF-8 size of a value once serialised
describeMachine(machine); // [label, value] rows (terminal, museum)
formatKilobytes / formatBitrate / formatClock / formatDuration; // fr-FR
```

Serial links (videotex, dial-up) cost 10 bits per byte on the wire (start +
stop bit); broadband costs 8. `latencyMs` is a simulation parameter, not a
historical claim. The Minitel's own page latency stays in
`packages/minitel-engine`; its profile describes the terminal only.

## Where it shows

- Terminal: `VER` (OS + machine), `MEM`, `SYSINFO`.
- Time Browser: the home page names the machine's link (no more hard-coded
  "56k" on the 2005 machine), and the status bar gives the time a
  reconstructed page would have taken on that link
  ("chargée en 1,4 s (modem 56 kbit/s)"). Nothing is actually delayed.
- Museum: the "La machine" panel of each gallery.
