import { notFound } from "next/navigation";
import { snapshotsCollection } from "@/lib/collections";
import { getRecord } from "@/lib/contentStore";
import { SnapshotForm } from "@/components/SnapshotForm";

export default async function EditSnapshotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getRecord(snapshotsCollection, id);
  if (!snapshot) notFound();

  return (
    <div>
      <h1>Edit snapshot</h1>
      <SnapshotForm initial={snapshot} />
    </div>
  );
}
