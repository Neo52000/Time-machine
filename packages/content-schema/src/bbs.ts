import { z } from "zod";
import { RightsStatusSchema } from "./rights";

/**
 * BBS (bulletin board system) content model. A board is a server someone
 * ran on their own phone line: callers dialled it with a modem, picked a
 * handle, and read forums, bulletins or downloaded files. Boards here are
 * fictional and say so; nothing is copied from a real board.
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

export const BbsColorSchema = z.enum([
  "white",
  "gray",
  "yellow",
  "cyan",
  "green",
  "magenta",
  "red",
  "blue",
]);

export const BbsItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().optional(),
  date: isoDate.optional(),
  /** Message text, bulletin text, or a file's description. */
  body: z.array(z.string()),
  /** Files only: DOS 8.3 name and size, used to time the download on the modem. */
  filename: z
    .string()
    .regex(/^[A-Z0-9_-]{1,8}\.[A-Z0-9]{1,3}$/, "Expected a DOS 8.3 file name")
    .optional(),
  sizeKb: z.number().int().positive().optional(),
});

export const BbsAreaKindSchema = z.enum(["messages", "files", "bulletins"]);

export const BbsAreaSchema = z.object({
  id: z.string().min(1),
  /** Letter typed at the main menu. "G" is reserved for goodbye. */
  key: z.string().regex(/^[A-FH-Z0-9]$/, 'One letter or digit, never "G"'),
  title: z.string().min(1),
  kind: BbsAreaKindSchema,
  items: z.array(BbsItemSchema).min(1),
});

export const BbsBoardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Displayed number; fictional boards use an obviously fictional one. */
  phone: z.string().min(1),
  sysop: z.string().min(1),
  tagline: z.string().min(1),
  /** Welcome banner, drawn with plain ASCII. */
  banner: z.array(z.string()),
  bannerColor: BbsColorSchema.optional(),
  areas: z.array(BbsAreaSchema).min(1),
  fictional: z.boolean(),
  availableFrom: isoDate,
  sourceIds: z.array(z.string()),
  rightsStatus: RightsStatusSchema,
});

export type BbsColor = z.infer<typeof BbsColorSchema>;
export type BbsItem = z.infer<typeof BbsItemSchema>;
export type BbsAreaKind = z.infer<typeof BbsAreaKindSchema>;
export type BbsArea = z.infer<typeof BbsAreaSchema>;
export type BbsBoard = z.infer<typeof BbsBoardSchema>;
