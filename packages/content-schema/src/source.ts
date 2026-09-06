import { z } from "zod";

export const SourceReferenceSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().url().optional(),
  publisher: z.string().optional(),
  accessedAt: z.string().optional(),
  notes: z.string().optional(),
});

export type SourceReference = z.infer<typeof SourceReferenceSchema>;
