import { recordRoute } from "@/lib/apiHandlers";
import { snapshotsCollection } from "@/lib/collections";

export const { GET, PUT, DELETE } = recordRoute(snapshotsCollection);
