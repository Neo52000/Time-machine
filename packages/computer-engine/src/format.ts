import type { MachineProfile } from "@time-machine/content-schema";

/**
 * French, period-neutral formatting. Numbers go through `Intl` with a fixed
 * locale so server and client render identical strings (no hydration drift).
 */
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** Binary units, French symbols: 640 Ko, 32 Mo, 4 Go. */
export function formatKilobytes(kb: number): string {
  if (kb >= 1024 * 1024) return `${decimal.format(kb / (1024 * 1024))} Go`;
  if (kb >= 1024) return `${decimal.format(kb / 1024)} Mo`;
  return `${integer.format(kb)} Ko`;
}

/** Decimal units, as line speeds are advertised: 1 200 bit/s, 56 kbit/s, 2 Mbit/s. */
export function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) return `${decimal.format(bps / 1_000_000)} Mbit/s`;
  if (bps >= 1000) return `${decimal.format(bps / 1000)} kbit/s`;
  return `${integer.format(bps)} bit/s`;
}

export function formatClock(mhz: number): string {
  return mhz >= 1000 ? `${decimal.format(mhz / 1000)} GHz` : `${integer.format(mhz)} MHz`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${integer.format(ms)} ms`;
  if (ms < 60_000) return `${decimal.format(ms / 1000)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}

/** Label/value rows describing a machine — shared by the terminal and the museum. */
export function describeMachine(machine: MachineProfile): Array<[label: string, value: string]> {
  const rows: Array<[string, string]> = [
    ["Machine", machine.label],
    ["Système", machine.os],
  ];
  if (machine.cpu) {
    rows.push(["Processeur", `${machine.cpu.label} ${formatClock(machine.cpu.clockMHz)}`]);
  }
  if (machine.memoryKb) rows.push(["Mémoire", formatKilobytes(machine.memoryKb)]);
  if (machine.storageKb) rows.push(["Disque", formatKilobytes(machine.storageKb)]);
  rows.push(["Affichage", machine.display]);
  rows.push([
    "Réseau",
    `${machine.network.label} (${formatBitrate(machine.network.downstreamBps)} ↓ / ${formatBitrate(machine.network.upstreamBps)} ↑)`,
  ]);
  return rows;
}
