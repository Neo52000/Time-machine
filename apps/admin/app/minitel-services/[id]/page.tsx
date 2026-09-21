import { notFound } from "next/navigation";
import { minitelServicesCollection } from "@/lib/collections";
import { getRecord } from "@/lib/contentStore";
import { MinitelServiceForm } from "@/components/MinitelServiceForm";

export default async function EditMinitelServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getRecord(minitelServicesCollection, id);
  if (!service) notFound();

  return (
    <div>
      <h1>Edit minitel service</h1>
      <MinitelServiceForm initial={service} />
    </div>
  );
}
