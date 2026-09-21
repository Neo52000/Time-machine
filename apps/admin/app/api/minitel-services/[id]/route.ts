import { recordRoute } from "@/lib/apiHandlers";
import { minitelServicesCollection } from "@/lib/collections";

export const { GET, PUT, DELETE } = recordRoute(minitelServicesCollection);
