import { contentStatus, type ContentStatus, type StatusInput } from "@time-machine/content-schema";

export type StatusCounts = Record<ContentStatus, number>;

export function countByStatus(records: StatusInput[]): StatusCounts {
  const counts: StatusCounts = {
    "needs-research": 0,
    "needs-rights-review": 0,
    ready: 0,
    published: 0,
  };
  for (const record of records) {
    counts[contentStatus(record)] += 1;
  }
  return counts;
}
