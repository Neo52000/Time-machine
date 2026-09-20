import { promises as fs } from "node:fs";
import path from "node:path";
import { CONTENT_ROOT } from "./paths";

export class RightsViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RightsViolationError";
  }
}

export interface CollectionConfig<T extends { id: string }> {
  /** Path to the JSON file, relative to the content root. */
  file: string;
  /** A Zod schema — typed structurally so this module doesn't need its own zod dependency. */
  schema: { parse: (data: unknown) => T };
  /** Return why `record` may not be written as given, or null if it's fine. */
  assertPublishable?: (record: T) => string | null;
}

async function readJsonArray(filePath: string): Promise<unknown[]> {
  const raw = await fs.readFile(filePath, "utf-8");
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error(`${filePath} does not contain a JSON array`);
  return data;
}

export async function readCollection<T extends { id: string }>(
  config: CollectionConfig<T>,
  root: string = CONTENT_ROOT,
): Promise<T[]> {
  const raw = await readJsonArray(path.join(root, config.file));
  return raw.map((item) => config.schema.parse(item));
}

/**
 * Validates every record and rejects a duplicate id, but does **not** run
 * `assertPublishable` here — some seed events predate the `published` field
 * and are already live despite `needsResearch: true` (grandfathered in by
 * `published`'s schema default). Re-validating the whole file on every write
 * would make the collection permanently unwritable because of unrelated
 * legacy rows. The rights/research gate instead applies only to the record
 * actually being written — see `upsertRecord`.
 */
export async function writeCollection<T extends { id: string }>(
  config: CollectionConfig<T>,
  records: T[],
  root: string = CONTENT_ROOT,
): Promise<void> {
  const parsed = records.map((r) => config.schema.parse(r));

  const seenIds = new Set<string>();
  for (const record of parsed) {
    if (seenIds.has(record.id)) throw new Error(`Duplicate id "${record.id}"`);
    seenIds.add(record.id);
  }

  await fs.writeFile(path.join(root, config.file), `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
}

export async function getRecord<T extends { id: string }>(
  config: CollectionConfig<T>,
  id: string,
  root?: string,
): Promise<T | undefined> {
  const records = await readCollection(config, root);
  return records.find((r) => r.id === id);
}

export async function upsertRecord<T extends { id: string }>(
  config: CollectionConfig<T>,
  record: T,
  root?: string,
): Promise<T> {
  const parsed = config.schema.parse(record);
  const reason = config.assertPublishable?.(parsed);
  if (reason) throw new RightsViolationError(reason);

  const existing = await readCollection(config, root);
  const idx = existing.findIndex((r) => r.id === parsed.id);
  const next =
    idx === -1 ? [...existing, parsed] : existing.map((r, i) => (i === idx ? parsed : r));
  await writeCollection(config, next, root);
  return parsed;
}

export async function deleteRecord<T extends { id: string }>(
  config: CollectionConfig<T>,
  id: string,
  root?: string,
): Promise<void> {
  const existing = await readCollection(config, root);
  const next = existing.filter((r) => r.id !== id);
  if (next.length === existing.length) throw new Error(`No record with id "${id}"`);
  await writeCollection(config, next, root);
}
