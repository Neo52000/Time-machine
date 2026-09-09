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
  const videos = data.videos.map((v) => VideoClipSchema.parse(v));
  const comments = data.comments.map((c) => VideoCommentSchema.parse(c));

  const videoById = new Map<string, VideoClip>();
  for (const v of videos) {
    if (videoById.has(v.id)) throw new Error(`Duplicate video id "${v.id}"`);
    videoById.set(v.id, v);
    if (v.rightsStatus === "unknown") {
      throw new Error(`video ${v.id} cannot be published with unknown rights`);
    }
  }
  for (const c of comments) {
    if (!videoById.has(c.videoId)) {
      throw new Error(`comment ${c.id} references unknown video "${c.videoId}"`);
    }
  }

  return {
    videos,
    comments,
    getVideo: (id) => videoById.get(id),
    commentsOf: (videoId) => comments.filter((c) => c.videoId === videoId),
  };
}
