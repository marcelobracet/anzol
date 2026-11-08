import { describe, expect, it } from "vitest";
import { presignUrl, r2ObjectKey, signVideoUpload, VIDEO_TYPES } from "./r2";

describe("presignUrl (AWS SigV4 em query string)", () => {
  // Vetor oficial da AWS: "Authenticating Requests: Using Query Parameters".
  it("reproduz o exemplo da documentação da AWS", () => {
    const url = presignUrl({
      method: "GET",
      url: "https://examplebucket.s3.amazonaws.com/test.txt",
      region: "us-east-1",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      date: new Date("2013-05-24T00:00:00Z"),
      expiresIn: 86400,
    });
    expect(new URL(url).searchParams.get("X-Amz-Signature")).toBe(
      "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
    );
  });
});

describe("r2ObjectKey", () => {
  it("monta vsl/<quiz>/<id>.<ext> pela extensão do tipo", () => {
    expect(r2ObjectKey("quiz123", "video/mp4", "abc")).toBe("vsl/quiz123/abc.mp4");
    expect(r2ObjectKey("quiz123", "video/quicktime", "abc")).toBe("vsl/quiz123/abc.mov");
  });
});

describe("signVideoUpload", () => {
  const env = {
    R2_ACCOUNT_ID: "acc123",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET: "anzol-media",
    R2_PUBLIC_BASE_URL: "https://media.exemplo.com/",
  };

  it("devolve PUT assinado no endpoint do R2 e a URL pública do arquivo", () => {
    const signed = signVideoUpload(env, { quizId: "quiz123", contentType: "video/mp4", id: "abc" }, new Date("2026-01-01T00:00:00Z"));
    if (!signed.success) throw new Error(signed.error);
    const upload = new URL(signed.data.uploadUrl);
    expect(upload.host).toBe("acc123.r2.cloudflarestorage.com");
    expect(upload.pathname).toBe("/anzol-media/vsl/quiz123/abc.mp4");
    expect(upload.searchParams.get("X-Amz-Credential")).toBe("key/20260101/auto/s3/aws4_request");
    expect(signed.data.publicUrl).toBe("https://media.exemplo.com/vsl/quiz123/abc.mp4");
  });

  it("recusa tipo que não é vídeo", () => {
    const signed = signVideoUpload(env, { quizId: "quiz123", contentType: "image/png", id: "abc" });
    expect(signed.success).toBe(false);
  });

  it("aceita os formatos comuns de vídeo", () => {
    expect(VIDEO_TYPES).toEqual(expect.arrayContaining(["video/mp4", "video/quicktime", "video/webm"]));
  });
});
