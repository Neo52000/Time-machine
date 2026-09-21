import Link from "next/link";
import { videoClipsCollection } from "@/lib/collections";
import { readCollection } from "@/lib/contentStore";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";

export default async function VideoClipsPage() {
  const clips = await readCollection(videoClipsCollection);
  const sorted = [...clips].sort((a, b) => a.uploadDate.localeCompare(b.uploadDate));

  return (
    <div>
      <div className="toolbar">
        <h1>Video clips</h1>
        <Link className="button primary" href="/video-clips/new" data-testid="new-video-clip-link">
          New video clip
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Uploaded</th>
            <th>Title</th>
            <th>Uploader</th>
            <th>Rights</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((clip) => (
            <tr key={clip.id} data-testid={`video-clip-row-${clip.id}`}>
              <td>{clip.uploadDate}</td>
              <td>
                <Link href={`/video-clips/${clip.id}`}>{clip.title}</Link>
              </td>
              <td>{clip.uploader}</td>
              <td>{clip.rightsStatus}</td>
              <td data-testid={`video-clip-status-${clip.id}`}>
                <StatusBadge record={clip} />
              </td>
              <td>
                <DeleteButton url={`/api/video-clips/${clip.id}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
