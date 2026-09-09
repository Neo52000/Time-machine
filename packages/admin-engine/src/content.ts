import { createAdminState } from "./store";

import events from "../../../content/events/events.json";
import sources from "../../../content/sources/sources.json";
import snapshots from "../../../content/snapshots/snapshots.json";
import minitelServices from "../../../content/minitel/services.json";
import videoClips from "../../../content/media/videos.json";

export const adminSeed = { events, sources, snapshots, minitelServices, videoClips };
export const initialAdminState = createAdminState(adminSeed);
