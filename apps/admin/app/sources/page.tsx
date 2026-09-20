import Link from "next/link";
import { sourcesCollection } from "@/lib/collections";
import { readCollection } from "@/lib/contentStore";
import { DeleteButton } from "@/components/DeleteButton";

export default async function SourcesPage() {
  const sources = await readCollection(sourcesCollection);
  const sorted = [...sources].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <div className="toolbar">
        <h1>Sources</h1>
        <Link className="button primary" href="/sources/new" data-testid="new-source-link">
          New source
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Publisher</th>
            <th>URL</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((source) => (
            <tr key={source.id} data-testid={`source-row-${source.id}`}>
              <td>
                <Link href={`/sources/${source.id}`}>{source.label}</Link>
              </td>
              <td>{source.publisher ?? "—"}</td>
              <td>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.url}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <DeleteButton url={`/api/sources/${source.id}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
