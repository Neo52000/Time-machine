import { notFound } from "next/navigation";
import { websitesCollection } from "@/lib/collections";
import { getRecord } from "@/lib/contentStore";
import { WebsiteForm } from "@/components/WebsiteForm";

export default async function EditWebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const website = await getRecord(websitesCollection, id);
  if (!website) notFound();

  return (
    <div>
      <h1>Edit website</h1>
      <WebsiteForm initial={website} />
    </div>
  );
}
