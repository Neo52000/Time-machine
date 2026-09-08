import { z } from "zod";

/**
 * Reconstructed page — a *declarative* page model rendered by the internal
 * browser. Reconstructions never carry HTML or scripts: the renderer maps
 * blocks to React elements, so nothing untrusted can execute (see
 * docs/browser-engine.md, security constraints).
 */
const LinkSchema = z.object({
  label: z.string(),
  /** Absolute historical URL ("http://www.yahoo.com/") or a path on the same site ("/search"). */
  href: z.string(),
  description: z.string().optional(),
});

export const PageBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    text: z.string(),
  }),
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("links"),
    title: z.string().optional(),
    items: z.array(LinkSchema),
    /** "columns" renders a directory-style grid; "list" a plain list. */
    layout: z.enum(["list", "columns"]).optional(),
  }),
  z.object({
    type: z.literal("search-form"),
    /** Path on the same site that renders the results page. */
    action: z.string(),
    paramName: z.string(),
    placeholder: z.string().optional(),
    buttonLabel: z.string(),
  }),
  z.object({
    type: z.literal("search-results"),
    /** Rendered when the results page is shown; `{query}` is substituted. */
    template: z.string(),
    paramName: z.string(),
  }),
  z.object({ type: z.literal("list"), items: z.array(z.string()) }),
  z.object({ type: z.literal("notice"), text: z.string() }),
  z.object({ type: z.literal("divider") }),
]);

export const ReconstructedPageSchema = z.object({
  id: z.string(),
  websiteId: z.string(),
  /** Path this page answers to, "/" for the home page. */
  path: z.string(),
  title: z.string(),
  /** Visual preset applied by the renderer (never per-brand chrome). */
  style: z.enum(["plain", "gray", "portal"]),
  blocks: z.array(PageBlockSchema),
});

export type PageLink = z.infer<typeof LinkSchema>;
export type PageBlock = z.infer<typeof PageBlockSchema>;
export type ReconstructedPage = z.infer<typeof ReconstructedPageSchema>;
