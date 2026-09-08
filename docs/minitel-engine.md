# Minitel Engine (Phase 7 — not yet implemented)

Status: **not started.** The 1985 era manifest already declares
`network.minitel: true` and a single `minitel` app id, but no Minitel UI or
routing exists yet. This document captures the design intent from the
master build prompt.

## Planned functions

- Text screen (videotex-style rendering).
- Keyboard navigation.
- Service code entry (e.g. `3615 DEMO`).
- Simulated function keys: `SOMMAIRE`, `RETOUR`, `RÉPÉTITION`, `GUIDE`,
  `ANNULATION`, `ENVOI`, `CORRECTION`, `SUITE`, `CONNEXION/FIN`.
- Configurable latency (to feel period-accurate).
- Screen-to-screen navigation, sessions, dynamic "services" as data.

## Rules

- Services are data-driven (no service hard-coded into the engine).
- Do not use real historical brand names without validated, sourced content
  (see `docs/historical-sources.md`) — start with clearly fictional demo
  services (e.g. `3615 DEMO`).
- The engine must be able to support documentary reconstructions later
  without a rewrite.
