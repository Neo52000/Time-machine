import { notFound } from "next/navigation";
import { videoClipsCollection } from "@/lib/collections";
import { getRecord } from "@/lib/contentStore";
import { VideoClipForm } from "@/components/VideoClipForm";

export default async function EditVideoClipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clip = await getRecord(videoClipsCollection, id);
  if (!clip) notFound();

  return (
    <div>
      <h1>Edit video clip</h1>
      <VideoClipForm initial={clip} />
    </div>
  );
}
