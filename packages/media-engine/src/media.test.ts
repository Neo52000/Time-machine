import { describe, expect, it } from "vitest";
import { createMediaCatalog } from "./catalog";
import { mediaCatalog } from "./content";
import { estimateViews, isUnlocked, listLibrary } from "./library";
import { createPlayerState, formatTime, pause, play, seek, tick } from "./player";

const cat = mediaCatalog;

describe("catalogue", () => {
  it("loads videos and comments with referential integrity", () => {
    expect(cat.videos.map((v) => v.id)).toContain("meatthezoo");
    expect(cat.commentsOf("meatthezoo").length).toBeGreaterThan(0);
  });

  it("rejects a comment on an unknown video", () => {
    expect(() =>
      createMediaCatalog({
        videos: cat.videos,
        comments: [{ id: "x", videoId: "ghost", author: "a", date: "01/01/2005", text: "hi" }],
      }),
    ).toThrow(/unknown video "ghost"/);
  });

  it("rejects a non-fictional video published with unknown rights", () => {
    expect(() =>
      createMediaCatalog({
        videos: [{ ...cat.videos[0]!, id: "bad", rightsStatus: "unknown" }],
        comments: [],
      }),
    ).toThrow(/unknown rights/);
  });
});

describe("library temporal lock", () => {
  it("locks a clip before its upload date and unlocks it after", () => {
    const clip = cat.getVideo("meatthezoo")!;
    expect(isUnlocked(clip, "2005-01-01")).toBe(false);
    expect(isUnlocked(clip, "2005-04-23")).toBe(true);
    expect(isUnlocked(clip, "2005-12-01")).toBe(true);
  });

  it("lists the library sorted by upload date with lock state and views", () => {
    const entries = listLibrary(cat, "2005-01-08");
    expect(entries.map((e) => e.clip.id)).toEqual([
      "hamster-skate",
      "vlog-webcam-jour1",
      "chute-velo",
      "meatthezoo",
    ]);
    expect(entries.find((e) => e.clip.id === "meatthezoo")).toMatchObject({
      unlocked: false,
      views: 0,
    });
    expect(entries.find((e) => e.clip.id === "hamster-skate")?.unlocked).toBe(true);
  });

  it("grows views over time for unlocked clips, capped, none for locked ones", () => {
    const clip = cat.getVideo("hamster-skate")!;
    const day0 = estimateViews(clip, clip.uploadDate);
    const day10 = estimateViews(clip, "2005-01-15");
    const farFuture = estimateViews(clip, "2010-01-01");
    expect(day0).toBe(clip.viewsAtLaunch);
    expect(day10).toBeGreaterThan(day0);
    expect(farFuture).toBe(clip.viewsAtLaunch * 50);
    expect(estimateViews(cat.getVideo("meatthezoo")!, "2005-01-01")).toBe(0);
  });
});

describe("player", () => {
  const clip = cat.getVideo("hamster-skate")!;

  it("plays, advances position, and stops at the end", () => {
    let state = createPlayerState(clip);
    expect(state).toMatchObject({ status: "paused", positionMs: 0 });
    state = play(state);
    state = tick(state, 5000);
    expect(state).toMatchObject({ status: "playing", positionMs: 5000 });
    state = tick(state, 100_000);
    expect(state).toMatchObject({ status: "ended", positionMs: clip.durationSeconds * 1000 });
  });

  it("pause stops advancing, seek clamps and restarts an ended clip", () => {
    let state = play(createPlayerState(clip));
    state = pause(state);
    expect(tick(state, 5000)).toBe(state);

    state = seek(state, -100);
    expect(state.positionMs).toBe(0);
    state = seek(state, 999_999);
    expect(state.positionMs).toBe(clip.durationSeconds * 1000);

    state = tick({ ...state, status: "playing" }, 1); // force ended
    state = play(state); // ended → restarts from 0
    expect(state).toMatchObject({ status: "playing", positionMs: 0 });
  });

  it("formats time as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(19_000)).toBe("0:19");
    expect(formatTime(75_000)).toBe("1:15");
  });
});
