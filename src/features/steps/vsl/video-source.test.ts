import { describe, expect, it } from "vitest";
import { videoSource } from "./video-source";

describe("videoSource", () => {
  it("R2 toca o arquivo direto, sem HLS", () => {
    expect(videoSource({ kind: "video", provider: "r2", url: "https://media.x.com/a.mp4" }, undefined)).toEqual({
      src: "https://media.x.com/a.mp4#t=0.001",
      hls: false,
    });
  });

  it("Bunny usa a playlist HLS e a thumbnail da pull zone", () => {
    expect(videoSource({ kind: "video", provider: "bunny", libraryId: "1", videoId: "abc" }, "vz-1.b-cdn.net")).toEqual({
      src: "https://vz-1.b-cdn.net/abc/playlist.m3u8",
      poster: "https://vz-1.b-cdn.net/abc/thumbnail.jpg",
      hls: true,
    });
  });

  it("sem vídeo, ou Bunny sem pull zone configurada, não há fonte", () => {
    expect(videoSource(undefined, "vz-1.b-cdn.net")).toBeNull();
    expect(videoSource({ kind: "video", provider: "bunny", libraryId: "1", videoId: "abc" }, undefined)).toBeNull();
  });
});
