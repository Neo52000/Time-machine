import { recordRoute } from "@/lib/apiHandlers";
import { videoClipsCollection } from "@/lib/collections";

export const { GET, PUT, DELETE } = recordRoute(videoClipsCollection);
