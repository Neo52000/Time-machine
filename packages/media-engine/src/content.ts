import { createMediaCatalog } from "./catalog";

import videos from "../../../content/media/videos.json";
import comments from "../../../content/media/comments.json";

export const mediaCatalog = createMediaCatalog({ videos, comments });
