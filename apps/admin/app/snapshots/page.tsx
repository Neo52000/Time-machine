import Link from "next/link";
import { snapshotsCollection, websitesCollection } from "@/lib/collections";
import { readCollection } from "@/lib/contentStore";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";

export default async function SnapshotsPage() {
  const [snapshots, websites] = await Promise.all([
    readCollection(snapshotsCollection),
    readCollection(websitesCollection),
  ]);
  const websiteById = new Map(websites.map((w) => [w.id, w]));
  const sorted = [...snapshots].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  return (
    <div>
      <div className="toolbar">
        <h1>Snapshots</h1>
        <Link className="button primary" href="/snapshots/new" data-testid="new-snapshot-link">
          New snapshot
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Captured</th>
            <th>Website</th>
            <th>Type</th>
            <th>Rights</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((snapshot) => {
            const website = websiteById.get(snapshot.websiteId);
            return (
              <tr key={snapshot.id} data-testid={`snapshot-row-${snapshot.id}`}>
                <td>{snapshot.capturedAt}</td>
                <td>
                  <Link href={`/snapshots/${snapshot.id}`}>
                    {website?.domain ?? snapshot.websiteId}
                  </Link>
                </td>
                <td>{snapshot.type}</td>
                <td>{snapshot.rightsStatus}</td>
                <td data-testid={`snapshot-status-${snapshot.id}`}>
                  <StatusBadge record={snapshot} />
                </td>
                <td>
                  {website ? (
                    <a
                      className="button"
                      href={`http://localhost:3000/era/1998/desktop`}
                      target="_blank"
                      rel="noreferrer"
                      title={`Open the 1998 desktop, then browse to ${website.domain}`}
                    >
                      Preview
                    </a>
                  ) : null}
                  <DeleteButton url={`/api/snapshots/${snapshot.id}`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
