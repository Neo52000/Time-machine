import { z } from "zod";

export const DesktopWindowSchema = z.object({
  id: z.string(),
  appId: z.string(),
  title: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  minimized: z.boolean(),
  maximized: z.boolean(),
  zIndex: z.number().int(),
});

export type DesktopWindow = z.infer<typeof DesktopWindowSchema>;
