import { describe, expect, it } from "vitest";
import { cloudinarySignature, signUpload } from "./sign-upload";
import { uploadedToMedia } from "./upload-media";

describe("cloudinarySignature", () => {
  it("bate com o exemplo da documentação do Cloudinary", () => {
    const params = { eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 };
    expect(cloudinarySignature(params, "abcd")).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("ignora parâmetros vazios", () => {
    expect(cloudinarySignature({ a: "1", b: "" }, "s")).toBe(cloudinarySignature({ a: "1" }, "s"));
  });
});

describe("signUpload", () => {
  it("assina pasta, formatos e timestamp", () => {
    const signed = signUpload({ cloudName: "demo", apiKey: "123", apiSecret: "abcd" }, 1_700_000_000);
    expect(signed).toEqual({
      uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
      fields: {
        api_key: "123",
        timestamp: "1700000000",
        folder: "anzol",
        allowed_formats: "jpg,jpeg,png,webp,gif",
        signature: cloudinarySignature(
          { timestamp: 1_700_000_000, folder: "anzol", allowed_formats: "jpg,jpeg,png,webp,gif" },
          "abcd",
        ),
      },
    });
  });
});

describe("uploadedToMedia", () => {
  it("imagem comum", () => {
    expect(uploadedToMedia({ public_id: "anzol/a", width: 800, height: 600, format: "jpg" })).toEqual({
      kind: "image",
      publicId: "anzol/a",
      width: 800,
      height: 600,
      alt: "",
    });
  });

  it("GIF vira mídia animada", () => {
    expect(uploadedToMedia({ public_id: "anzol/g", width: 400, height: 400, format: "gif" }).kind).toBe("animated");
  });

  it("resposta inesperada lança", () => {
    expect(() => uploadedToMedia({ public_id: "" })).toThrow();
  });
});
