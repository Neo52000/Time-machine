import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date string (YYYY-MM-DD)");

export const EraMachineSchema = z.object({
  id: z.string(),
  resolution: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  bootSequence: z.string(),
  theme: z.string(),
});

export const EraNetworkSchema = z.object({
  web: z.boolean(),
  minitel: z.boolean(),
  bbs: z.boolean(),
  messenger: z.boolean(),
});

export const EraManifestSchema = z.object({
  id: z.string(),
  label: z.string(),
  dateStart: isoDate,
  dateEnd: isoDate,

  machine: EraMachineSchema,

  apps: z.array(z.string()),

  network: EraNetworkSchema,

  searchProvider: z.string().optional(),

  browser: z.string().optional(),

  timelineTags: z.array(z.string()),
});

export type EraMachine = z.infer<typeof EraMachineSchema>;
export type EraNetwork = z.infer<typeof EraNetworkSchema>;
export type EraManifest = z.infer<typeof EraManifestSchema>;
