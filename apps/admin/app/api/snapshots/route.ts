import { collectionRoute } from "@/lib/apiHandlers";
import { snapshotsCollection } from "@/lib/collections";

export const { GET, POST } = collectionRoute(snapshotsCollection);
