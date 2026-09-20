import { collectionRoute } from "@/lib/apiHandlers";
import { websitesCollection } from "@/lib/collections";

export const { GET, POST } = collectionRoute(websitesCollection);
