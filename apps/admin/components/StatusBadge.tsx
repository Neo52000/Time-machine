import { contentStatus, type ContentStatus, type StatusInput } from "@time-machine/content-schema";

export const STATUS_LABELS: Record<ContentStatus, string> = {
  "needs-research": "Needs research",
  "needs-rights-review": "Needs rights review",
  ready: "Ready",
  published: "Published",
};

export function StatusBadge({ record }: { record: StatusInput }) {
  const status = contentStatus(record);
  return <span className={`badge ${status}`}>{STATUS_LABELS[status]}</span>;
}
