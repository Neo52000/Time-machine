import { z } from "zod";
import { RightsStatusSchema } from "./rights";

/**
 * Minitel / videotex content model. Everything the Minitel Engine shows is
 * data: kiosks (access codes), services (reached by code + mnemonic),
 * pages (blocks laid out on a 40×25 text grid) and lookup datasets. No
 * service is hard-coded into the engine.
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

/** Videotex colours (8-colour palette). */
export const VideotexColorSchema = z.enum([
  "white",
  "yellow",
  "cyan",
  "green",
  "magenta",
  "red",
  "blue",
  "black",
]);

export const MinitelKioskSchema = z.object({
  /** Access code dialled on the phone, e.g. "3615". */
  code: z.string().regex(/^\d{4}$/),
  name: z.string(),
  /** Shown on the kiosk page (tariff / usage), never a precise historical price unless sourced. */
  notice: z.string(),
  /** Direct-connect kiosks (like the directory) skip the service prompt. */
  directServiceId: z.string().optional(),
  availableFrom: isoDate,
  availableUntil: isoDate.optional(),
  sourceIds: z.array(z.string()),
  needsResearch: z.boolean().optional(),
});

export const MinitelServiceSchema = z.object({
  id: z.string(),
  /** Kiosk code the service lives on. */
  kioskCode: z.string().regex(/^\d{4}$/),
  /** Mnemonic typed after the kiosk connects, e.g. "DEMO". Uppercase A-Z/0-9. */
  mnemonic: z.string().regex(/^[A-Z0-9]{1,12}$/),
  title: z.string(),
  description: z.string(),
  /** Clearly fictional services are the default (docs/minitel-engine.md). */
  fictional: z.boolean(),
  homePageId: z.string(),
  /** Page shown by the GUIDE key; defaults to the engine's generic help. */
  guidePageId: z.string().optional(),
  availableFrom: isoDate,
  availableUntil: isoDate.optional(),
  sourceIds: z.array(z.string()),
  rightsStatus: RightsStatusSchema,
  needsResearch: z.boolean().optional(),
});

export const MinitelActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("goto"), pageId: z.string() }),
  /** Look a field up in a dataset and show the matches. */
  z.object({
    type: z.literal("lookup"),
    dataset: z.string(),
    /** Dataset field to match (case/accent-insensitive prefix). */
    field: z.string(),
    /** Title of the generated results page. */
    resultsTitle: z.string(),
    /** Dataset fields to print per match, in order. */
    columns: z.array(z.string()).min(1),
  }),
  /** Echo the typed text back on a confirmation page (e.g. a mailbox). */
  z.object({ type: z.literal("echo"), pageId: z.string() }),
]);

export const MinitelBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    /** One or more lines; each is clipped to 40 columns by the engine. */
    lines: z.array(z.string()),
    color: VideotexColorSchema.optional(),
    inverse: z.boolean().optional(),
    align: z.enum(["left", "center"]).optional(),
  }),
  z.object({ type: z.literal("blank"), rows: z.number().int().positive().optional() }),
  z.object({ type: z.literal("rule") }),
  z.object({
    type: z.literal("menu"),
    items: z.array(
      z.object({
        /** Key the user types before ENVOI ("1".."9" or a letter). */
        key: z.string().regex(/^[A-Z0-9]$/),
        label: z.string(),
        action: MinitelActionSchema,
      }),
    ),
  }),
  z.object({
    type: z.literal("input"),
    label: z.string(),
    /** Field name used by lookup/echo actions. */
    name: z.string(),
    maxLength: z.number().int().positive(),
    action: MinitelActionSchema,
  }),
]);

export const MinitelPageSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  title: z.string(),
  blocks: z.array(MinitelBlockSchema),
});

export const MinitelDatasetSchema = z.object({
  id: z.string(),
  /** Fictional records unless sourced; every row shares the same keys. */
  rows: z.array(z.record(z.string(), z.string())),
  fictional: z.boolean(),
  sourceIds: z.array(z.string()),
});

export type VideotexColor = z.infer<typeof VideotexColorSchema>;
export type MinitelKiosk = z.infer<typeof MinitelKioskSchema>;
export type MinitelService = z.infer<typeof MinitelServiceSchema>;
export type MinitelAction = z.infer<typeof MinitelActionSchema>;
export type MinitelBlock = z.infer<typeof MinitelBlockSchema>;
export type MinitelPage = z.infer<typeof MinitelPageSchema>;
export type MinitelDataset = z.infer<typeof MinitelDatasetSchema>;
