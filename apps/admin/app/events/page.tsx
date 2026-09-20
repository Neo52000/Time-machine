import Link from "next/link";
import { eventsCollection } from "@/lib/collections";
import { readCollection } from "@/lib/contentStore";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";

export default async function EventsPage() {
  const events = await readCollection(eventsCollection);
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div className="toolbar">
        <h1>Events</h1>
        <Link className="button primary" href="/events/new" data-testid="new-event-link">
          New event
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((event) => (
            <tr key={event.id} data-testid={`event-row-${event.id}`}>
              <td>{event.date}</td>
              <td>
                <Link href={`/events/${event.id}`}>{event.title}</Link>
              </td>
              <td data-testid={`event-status-${event.id}`}>
                <StatusBadge record={event} />
              </td>
              <td>
                <DeleteButton url={`/api/events/${event.id}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
