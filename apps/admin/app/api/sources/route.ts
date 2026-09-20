import { collectionRoute } from "@/lib/apiHandlers";
import { sourcesCollection } from "@/lib/collections";

export const { GET, POST } = collectionRoute(sourcesCollection);
