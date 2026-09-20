import { recordRoute } from "@/lib/apiHandlers";
import { eventsCollection } from "@/lib/collections";

export const { GET, PUT, DELETE } = recordRoute(eventsCollection);
