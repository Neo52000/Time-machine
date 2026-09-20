import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { CONTENT_ROOT } from "@/lib/paths";

/**
 * Controlled asset import (master prompt §26/§27): copies an uploaded file
 * into `content/assets/` under a sanitized, collision-resistant name and
 * hands back the id to reference from a `SourceReference`/`assetIds` field.
 * No cloud storage, no scraping pipeline — just a safe local drop point.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "asset";
  const assetId = `${Date.now()}-${safeName}`;
  const assetsDir = path.join(CONTENT_ROOT, "assets");
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(path.join(assetsDir, assetId), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ assetId }, { status: 201 });
}
