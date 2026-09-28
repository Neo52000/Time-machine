import type { NetworkLink, NetworkLinkKind } from "@time-machine/content-schema";

/**
 * Serial links (videotex, dial-up modems) frame every byte with a start and
 * a stop bit, so a byte costs 10 bits on the wire; broadband links carry
 * 8 bits per byte (framing overhead ignored at this level of simulation).
 */
const BITS_PER_BYTE: Record<NetworkLinkKind, number> = {
  videotex: 10,
  "dial-up": 10,
  broadband: 8,
  mobile: 8,
};

export type TransferDirection = "down" | "up";

/** Time to move `bytes` over the link, including its fixed per-request latency. */
export function transferTimeMs(
  bytes: number,
  link: NetworkLink,
  direction: TransferDirection = "down",
): number {
  if (!Number.isFinite(bytes) || bytes < 0) throw new Error(`Invalid byte count: ${bytes}`);
  const bps = direction === "down" ? link.downstreamBps : link.upstreamBps;
  const wireMs = Math.ceil(((bytes * BITS_PER_BYTE[link.kind]) / bps) * 1000);
  return link.latencyMs + wireMs;
}

/** UTF-8 size of a value once serialised — a stand-in for a page's weight on the wire. */
export function estimatePayloadBytes(value: unknown): number {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return new TextEncoder().encode(text ?? "").length;
}
