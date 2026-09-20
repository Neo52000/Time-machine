import { NextResponse } from "next/server";
import type { CollectionConfig } from "./contentStore";
import {
  RightsViolationError,
  deleteRecord,
  getRecord,
  readCollection,
  upsertRecord,
} from "./contentStore";

function errorResponse(error: unknown): NextResponse {
  if (error instanceof RightsViolationError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 400 });
}

/** GET (list) + POST (create) for a whole collection. */
export function collectionRoute<T extends { id: string }>(config: CollectionConfig<T>) {
  return {
    async GET() {
      try {
        return NextResponse.json(await readCollection(config));
      } catch (error) {
        return errorResponse(error);
      }
    },
    async POST(request: Request) {
      try {
        const record = config.schema.parse(await request.json());
        if (await getRecord(config, record.id)) {
          return NextResponse.json(
            { error: `Record "${record.id}" already exists` },
            { status: 409 },
          );
        }
        await upsertRecord(config, record);
        return NextResponse.json(record, { status: 201 });
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}

/** GET (one) + PUT (update) + DELETE for a single record by id. */
export function recordRoute<T extends { id: string }>(config: CollectionConfig<T>) {
  type Params = { params: Promise<{ id: string }> };
  return {
    async GET(_request: Request, { params }: Params) {
      const { id } = await params;
      const record = await getRecord(config, id);
      return record
        ? NextResponse.json(record)
        : NextResponse.json({ error: "Not found" }, { status: 404 });
    },
    async PUT(request: Request, { params }: Params) {
      try {
        const { id } = await params;
        const body = (await request.json()) as Record<string, unknown>;
        const record = config.schema.parse({ ...body, id });
        await upsertRecord(config, record);
        return NextResponse.json(record);
      } catch (error) {
        return errorResponse(error);
      }
    },
    async DELETE(_request: Request, { params }: Params) {
      try {
        const { id } = await params;
        await deleteRecord(config, id);
        return NextResponse.json({ ok: true });
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}
