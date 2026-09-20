import { notFound } from "next/navigation";
import { sourcesCollection } from "@/lib/collections";
import { getRecord } from "@/lib/contentStore";
import { SourceForm } from "@/components/SourceForm";

export default async function EditSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await getRecord(sourcesCollection, id);
  if (!source) notFound();

  return (
    <div>
      <h1>Edit source</h1>
      <SourceForm initial={source} />
    </div>
  );
}
