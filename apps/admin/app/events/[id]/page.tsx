import { notFound } from "next/navigation";
import { eventsCollection } from "@/lib/collections";
import { getRecord } from "@/lib/contentStore";
import { EventForm } from "@/components/EventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getRecord(eventsCollection, id);
  if (!event) notFound();

  return (
    <div>
      <h1>Edit event</h1>
      <EventForm initial={event} />
    </div>
  );
}
