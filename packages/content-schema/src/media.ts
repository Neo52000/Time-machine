import { z } from "zod";
import { RightsStatusSchema } from "./rights";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

/**
 * Video library content model. No real footage is ever embedded: each clip
 * is rendered by the media player as an original animated placeholder
 * (`visual`), so a documentary reconstruction of a real event (e.g. the
 * first YouTube video) never reproduces the actual copyrighted recording.
 */
export const VideoVisualSchema = z.enum(["zoo", "skate", "webcam", "bicycle"]);

export const VideoClipSchema = z.object({
  id: z.string(),
  title: z.string(),
  uploader: z.string(),
  uploadDate: isoDate,
  durationSeconds: z.number().int().positive(),
  description: z.string(),
  category: z.array(z.string()),
  viewsAtLaunch: z.number().int().nonnegative(),
  /** Original placeholder animation the player renders instead of real footage. */
  visual: VideoVisualSchema,
  relatedEventId: z.string().optional(),
  sourceIds: z.array(z.string()),
  rightsStatus: RightsStatusSchema,
  needsResearch: z.boolean().optional(),
});

export const VideoCommentSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  author: z.string(),
  /** Display date, already in the era's convention (DD/MM/YYYY). */
  date: z.string(),
  text: z.string(),
});

export type VideoVisual = z.infer<typeof VideoVisualSchema>;
export type VideoClip = z.infer<typeof VideoClipSchema>;
export type VideoComment = z.infer<typeof VideoCommentSchema>;
