import {
  VideoClipSchema,
  VideoCommentSchema,
  type VideoClip,
  type VideoComment,
} from "@time-machine/content-schema";

export interface MediaData {
  videos: unknown[];
  comments: unknown[];
}

export interface MediaCatalog {
  videos: VideoClip[];
  comments: VideoComment[];
  getVideo(id: string): VideoClip | undefined;
  commentsOf(videoId: string): VideoComment[];
}

/** Validates every record and checks referential integrity (fail fast). */
export function createMediaCatalog(data: MediaData): MediaCatalog {
  // Draft (unpublished) videos — and comments on one — are excluded before
  // referential-integrity checks run, so a draft never needs to satisfy them yet.
  const allVideos = data.videos.map((v) => VideoClipSchema.parse(v));
  const videos = allVideos.filter((v) => v.published);
  // A comment may reference a draft video before it's published — that's not a
  // dangling reference, so validate against every parsed video id, not just the
  // published ones. `catalog.commentsOf` still only ever returns published-video comments.
  const knownVideoIds = new Set(allVideos.map((v) => v.id));
  const allComments = data.comments.map((c) => VideoCommentSchema.parse(c));

  const videoById = new Map<string, VideoClip>();
  for (const v of videos) {
    if (videoById.has(v.id)) throw new Error(`Duplicate video id "${v.id}"`);
    videoById.set(v.id, v);
    if (v.rightsStatus === "unknown") {
      throw new Error(`video ${v.id} cannot be published with unknown rights`);
    }
  }
  for (const c of allComments) {
    if (!knownVideoIds.has(c.videoId)) {
      throw new Error(`comment ${c.id} references unknown video "${c.videoId}"`);
    }
  }
  const comments = allComments.filter((c) => videoById.has(c.videoId));

  return {
    videos,
    comments,
    getVideo: (id) => videoById.get(id),
    commentsOf: (videoId) => comments.filter((c) => c.videoId === videoId),
  };
}
