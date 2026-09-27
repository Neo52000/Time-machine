import { z } from "zod";

/**
 * Computer Engine — the hardware and network link behind each era's machine.
 * A profile is a *representative configuration* for its period (what a
 * typical home setup looked like), never a specific commercial product, so
 * the CPU is described generically and the OS is the project's own fictional
 * "Time Machine OS". `EraManifest.machine.id` points at a profile id.
 */
export const NetworkLinkKindSchema = z.enum(["videotex", "dial-up", "broadband"]);

export const NetworkLinkSchema = z.object({
  kind: NetworkLinkKindSchema,
  /** Human label shown to the user, e.g. "modem 56 kbit/s". */
  label: z.string().min(1),
  downstreamBps: z.number().int().positive(),
  upstreamBps: z.number().int().positive(),
  /** Fixed cost added once per request (dial-up handshake excluded), in ms. */
  latencyMs: z.number().int().nonnegative(),
});

export const MachineKindSchema = z.enum(["terminal", "personal-computer"]);

export const MachineProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: MachineKindSchema,
  cpu: z
    .object({
      label: z.string().min(1),
      clockMHz: z.number().positive(),
    })
    .optional(),
  memoryKb: z.number().int().positive().optional(),
  storageKb: z.number().int().positive().optional(),
  os: z.string().min(1),
  display: z.string().min(1),
  network: NetworkLinkSchema,
  sourceIds: z.array(z.string()),
  /** Set when a figure is plausible for the period but not yet sourced. */
  needsResearch: z.boolean().optional(),
  notes: z.string().optional(),
});

export type NetworkLinkKind = z.infer<typeof NetworkLinkKindSchema>;
export type NetworkLink = z.infer<typeof NetworkLinkSchema>;
export type MachineKind = z.infer<typeof MachineKindSchema>;
export type MachineProfile = z.infer<typeof MachineProfileSchema>;
