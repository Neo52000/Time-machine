import Link from "next/link";
import {
  eventsCollection,
  snapshotsCollection,
  sourcesCollection,
  websitesCollection,
} from "@/lib/collections";
import { readCollection } from "@/lib/contentStore";
import { countByStatus } from "@/lib/statusCounts";
import { StatusCountsView } from "@/components/StatusCountsView";

export default async function DashboardPage() {
  const [events, websites, snapshots, sources] = await Promise.all([
    readCollection(eventsCollection),
    readCollection(websitesCollection),
    readCollection(snapshotsCollection),
    readCollection(sourcesCollection),
  ]);

  const websitesNeedingResearch = websites.filter((w) => w.needsResearch).length;

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="subtitle">
        Content status across the seed data in <code>content/</code>. Nothing with a rights or
        research blocker can be published — see the rights policy.
      </p>

      <div className="card">
        <div className="toolbar">
          <h2>Events ({events.length})</h2>
          <Link className="button" href="/events">
            Manage
          </Link>
        </div>
        <StatusCountsView counts={countByStatus(events)} />
      </div>

      <div className="card">
        <div className="toolbar">
          <h2>Snapshots ({snapshots.length})</h2>
          <Link className="button" href="/snapshots">
            Manage
          </Link>
        </div>
        <StatusCountsView counts={countByStatus(snapshots)} />
      </div>

      <div className="card">
        <div className="toolbar">
          <h2>Websites ({websites.length})</h2>
          <Link className="button" href="/websites">
            Manage
          </Link>
        </div>
        <p className="status-note">{websitesNeedingResearch} flagged needs-research.</p>
      </div>

      <div className="card">
        <div className="toolbar">
          <h2>Sources ({sources.length})</h2>
          <Link className="button" href="/sources">
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
