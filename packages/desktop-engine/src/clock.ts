/**
 * Era clock — the desktop shows the *simulated* date, never the real one.
 * The clock starts at `dateStart` of the era at a fixed time of day and
 * advances in real time from the moment the machine booted.
 */
export interface EraClock {
  /** Simulated instant when the machine booted. */
  epoch: Date;
  /** Real instant when the machine booted. */
  bootedAt: number;
}

const BOOT_HOUR = 9;
const BOOT_MINUTE = 41;

export function createEraClock(isoDateStart: string, bootedAt: number = Date.now()): EraClock {
  const [y, m, d] = isoDateStart.split("-").map(Number) as [number, number, number];
  return { epoch: new Date(y, m - 1, d, BOOT_HOUR, BOOT_MINUTE, 0, 0), bootedAt };
}

export function eraNow(clock: EraClock, now: number = Date.now()): Date {
  return new Date(clock.epoch.getTime() + Math.max(0, now - clock.bootedAt));
}

export function formatEraTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatEraDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}
