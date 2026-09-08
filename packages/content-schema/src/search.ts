import { z } from "zod";

export const SearchDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  keywords: z.array(z.string()),
  availableFrom: z.string(),
  availableUntil: z.string().optional(),
  contentRef: z.string().optional(),
});

export type SearchDocument = z.infer<typeof SearchDocumentSchema>;

/**
 * A resource may only be returned if it was supposed to exist on `selectedDate`:
 * availableFrom <= selectedDate AND (availableUntil is null OR availableUntil >= selectedDate)
 */
export function isAvailableAt(
  doc: Pick<SearchDocument, "availableFrom" | "availableUntil">,
  selectedDate: string,
): boolean {
  if (doc.availableFrom > selectedDate) return false;
  if (doc.availableUntil && doc.availableUntil < selectedDate) return false;
  return true;
}
