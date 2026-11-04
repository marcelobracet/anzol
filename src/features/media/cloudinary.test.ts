import { describe, expect, it } from "vitest";
import { animatedUrl, imageUrl } from "./cloudinary";

describe("cloudinary", () => {
  it("monta URL de imagem com formato e qualidade automáticos", () => {
    expect(imageUrl("demo", "anzol/foto 1", 640)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/anzol/foto%201",
    );
  });

  it("entrega GIF animado como mp4", () => {
    expect(animatedUrl("demo", "anzol/gif", 480)).toBe(
      "https://res.cloudinary.com/demo/image/upload/q_auto,c_limit,w_480/anzol/gif.mp4",
    );
  });

  it("rejeita cloud name e largura inválidos", () => {
    expect(() => imageUrl("../x", "a", 100)).toThrow();
    expect(() => imageUrl("demo", "a", 0)).toThrow();
  });
});
