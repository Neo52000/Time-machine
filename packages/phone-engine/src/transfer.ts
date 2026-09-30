import type { PhoneRadio } from "@time-machine/content-schema";
import { transferTimeMs, type TransferDirection } from "@time-machine/computer-engine";

/** What moving `sizeKb` over a radio costs: time, and allowance when metered. */
export interface TransferCost {
  realMs: number;
  /** Bytes counted against the monthly allowance (0 on Wi-Fi). */
  meteredBytes: number;
}

export function transferCost(
  sizeKb: number,
  radio: PhoneRadio,
  direction: TransferDirection = "down",
): TransferCost {
  const bytes = sizeKb * 1024;
  return {
    realMs: transferTimeMs(bytes, radio.link, direction),
    meteredBytes: radio.metered ? bytes : 0,
  };
}

/** Allowance use as shown in the settings: "12,4 Mo sur 500 Mo". */
export function allowanceUsed(meteredBytes: number, allowanceMb: number) {
  const usedMb = meteredBytes / (1024 * 1024);
  return { usedMb, ratio: Math.min(1, usedMb / allowanceMb), exhausted: usedMb >= allowanceMb };
}
