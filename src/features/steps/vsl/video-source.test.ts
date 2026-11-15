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

  it("capa enviada no Studio vira o poster, no R2 e no lugar da thumbnail do Bunny", () => {
    const poster = { kind: "image" as const, publicId: "capas/vsl", width: 1080, height: 1920, alt: "" };
    expect(videoSource({ kind: "video", provider: "r2", url: "https://media.x.com/a.mp4", poster }, undefined, "demo")?.poster).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_720/capas/vsl",
    );
    expect(videoSource({ kind: "video", provider: "bunny", libraryId: "1", videoId: "abc", poster }, "vz-1.b-cdn.net", "demo")?.poster).toContain(
      "res.cloudinary.com/demo",
    );
  });

  it("sem cloud name, ignora a capa e mantém o comportamento anterior", () => {
    const poster = { kind: "image" as const, publicId: "capas/vsl", width: 1080, height: 1920, alt: "" };
    expect(videoSource({ kind: "video", provider: "r2", url: "https://media.x.com/a.mp4", poster }, undefined)).toEqual({
      src: "https://media.x.com/a.mp4#t=0.001",
      hls: false,
    });
  });
});
