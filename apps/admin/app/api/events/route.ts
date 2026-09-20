import { collectionRoute } from "@/lib/apiHandlers";
import { eventsCollection } from "@/lib/collections";

export const { GET, POST } = collectionRoute(eventsCollection);
