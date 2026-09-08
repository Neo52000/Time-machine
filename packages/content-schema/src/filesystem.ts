import { z } from "zod";

export const VirtualFileSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number().nonnegative().optional(),
  contentRef: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  hidden: z.boolean().optional(),
  readonly: z.boolean().optional(),
});

export type VirtualFile = z.infer<typeof VirtualFileSchema>;
