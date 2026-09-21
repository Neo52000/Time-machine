import { collectionRoute } from "@/lib/apiHandlers";
import { videoClipsCollection } from "@/lib/collections";

export const { GET, POST } = collectionRoute(videoClipsCollection);
