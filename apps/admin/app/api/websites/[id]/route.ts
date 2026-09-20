import { recordRoute } from "@/lib/apiHandlers";
import { websitesCollection } from "@/lib/collections";

export const { GET, PUT, DELETE } = recordRoute(websitesCollection);
