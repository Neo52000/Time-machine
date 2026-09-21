import { collectionRoute } from "@/lib/apiHandlers";
import { minitelServicesCollection } from "@/lib/collections";

export const { GET, POST } = collectionRoute(minitelServicesCollection);
