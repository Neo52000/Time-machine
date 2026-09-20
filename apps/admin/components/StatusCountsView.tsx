import type { ContentStatus } from "@time-machine/content-schema";
import type { StatusCounts } from "@/lib/statusCounts";
import { STATUS_LABELS } from "./StatusBadge";

const ORDER: ContentStatus[] = ["needs-research", "needs-rights-review", "ready", "published"];

export function StatusCountsView({ counts }: { counts: StatusCounts }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {ORDER.map((key) => (
        <span key={key} className={`badge ${key}`}>
          {STATUS_LABELS[key]}: {counts[key]}
        </span>
      ))}
    </div>
  );
}
