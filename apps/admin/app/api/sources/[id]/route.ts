import { recordRoute } from "@/lib/apiHandlers";
import { sourcesCollection } from "@/lib/collections";

export const { GET, PUT, DELETE } = recordRoute(sourcesCollection);
