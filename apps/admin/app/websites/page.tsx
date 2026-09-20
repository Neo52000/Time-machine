import Link from "next/link";
import { websitesCollection } from "@/lib/collections";
import { readCollection } from "@/lib/contentStore";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";

export default async function WebsitesPage() {
  const websites = await readCollection(websitesCollection);
  const sorted = [...websites].sort((a, b) => a.domain.localeCompare(b.domain));

  return (
    <div>
      <div className="toolbar">
        <h1>Websites</h1>
        <Link className="button primary" href="/websites/new" data-testid="new-website-link">
          New website
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Domain</th>
            <th>Title</th>
            <th>Available</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((website) => (
            <tr key={website.id} data-testid={`website-row-${website.id}`}>
              <td>{website.domain}</td>
              <td>
                <Link href={`/websites/${website.id}`}>{website.title}</Link>
              </td>
              <td>
                {website.availableFrom} → {website.availableUntil ?? "now"}
              </td>
              <td data-testid={`website-status-${website.id}`}>
                <StatusBadge record={website} />
              </td>
              <td>
                <DeleteButton url={`/api/websites/${website.id}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
