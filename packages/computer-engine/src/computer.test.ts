import { describe, expect, it } from "vitest";
import { listEras } from "@time-machine/era-engine";
import type { NetworkLink } from "@time-machine/content-schema";
import {
  createMachineCatalog,
  describeMachine,
  estimatePayloadBytes,
  formatBitrate,
  formatDuration,
  formatKilobytes,
  machineCatalog,
  transferTimeMs,
} from "./index";

/** `Intl` groups French thousands with a narrow no-break space. */
const plain = (s: string) => s.replace(/\u202f|\u00a0/g, " ");

const dialUp: NetworkLink = {
  kind: "dial-up",
  label: "modem",
  downstreamBps: 56000,
  upstreamBps: 33600,
  latencyMs: 150,
};

describe("machine catalogue", () => {
  it("has a profile for every era's machine", () => {
    for (const era of listEras()) {
      expect(machineCatalog.getMachine(era.machine.id), era.id).toBeDefined();
    }
  });

  it("resolves the sources a profile cites", () => {
    const pc = machineCatalog.getMachine("pc-1998")!;
    expect(machineCatalog.sourcesOf(pc).map((s) => s.id)).toEqual(pc.sourceIds);
  });

  it("rejects dangling sources and duplicate ids", () => {
    const machine = {
      id: "m",
      label: "M",
      kind: "terminal",
      os: "os",
      display: "d",
      network: dialUp,
      sourceIds: ["missing"],
    };
    expect(() => createMachineCatalog({ machines: [machine], sources: [] })).toThrow(
      /unknown source "missing"/,
    );
    const clean = { ...machine, sourceIds: [] };
    expect(() => createMachineCatalog({ machines: [clean, clean], sources: [] })).toThrow(
      /Duplicate machine id/,
    );
  });

  it("rejects malformed profiles", () => {
    expect(() =>
      createMachineCatalog({
        machines: [{ id: "m", label: "M", kind: "mainframe" }],
        sources: [],
      }),
    ).toThrow();
  });
});

describe("network model", () => {
  it("frames serial bytes with 10 bits and adds the per-request latency", () => {
    // 7 000 bytes × 10 bits / 56 000 bit/s = 1 250 ms, + 150 ms latency.
    expect(transferTimeMs(7000, dialUp)).toBe(1400);
    expect(transferTimeMs(7000, dialUp, "up")).toBe(150 + Math.ceil((70000 / 33600) * 1000));
  });

  it("uses 8 bits per byte on broadband", () => {
    const adsl: NetworkLink = { ...dialUp, kind: "broadband", downstreamBps: 2_048_000 };
    expect(transferTimeMs(256_000, adsl)).toBe(150 + 1000);
  });

  it("makes the Minitel an order of magnitude slower than a 1998 modem", () => {
    const minitel = machineCatalog.getMachine("minitel-1b")!.network;
    const pc = machineCatalog.getMachine("pc-1998")!.network;
    expect(transferTimeMs(1000, minitel)).toBeGreaterThan(10 * (transferTimeMs(1000, pc) - 150));
  });

  it("refuses nonsense sizes", () => {
    expect(() => transferTimeMs(-1, dialUp)).toThrow();
    expect(() => transferTimeMs(Number.NaN, dialUp)).toThrow();
  });

  it("measures UTF-8 bytes, not characters", () => {
    expect(estimatePayloadBytes("é")).toBe(2);
    expect(estimatePayloadBytes({ a: 1 })).toBe('{"a":1}'.length);
  });
});

describe("formatting", () => {
  it("formats sizes, bitrates and durations in French", () => {
    expect(formatKilobytes(640)).toBe("640 Ko");
    expect(formatKilobytes(32768)).toBe("32 Mo");
    expect(formatKilobytes(4194304)).toBe("4 Go");
    expect(plain(formatBitrate(1200))).toBe("1,2 kbit/s");
    expect(formatBitrate(75)).toBe("75 bit/s");
    expect(formatBitrate(2_048_000)).toBe("2 Mbit/s");
    expect(formatDuration(320)).toBe("320 ms");
    expect(formatDuration(4200)).toBe("4,2 s");
    expect(formatDuration(125_000)).toBe("2 min 05 s");
  });

  it("describes a machine without the fields it lacks", () => {
    const minitel = describeMachine(machineCatalog.getMachine("minitel-1b")!);
    expect(minitel.map(([label]) => label)).toEqual(["Machine", "Système", "Affichage", "Réseau"]);
    const pc = Object.fromEntries(describeMachine(machineCatalog.getMachine("pc-1998")!));
    expect(pc["Processeur"]).toBe("Processeur x86 266 MHz");
    expect(pc["Mémoire"]).toBe("32 Mo");
    expect(pc["Réseau"]).toContain("56 kbit/s ↓");
  });
});
