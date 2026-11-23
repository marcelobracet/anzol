import { describe, expect, it } from "vitest";
import { VoiceNote } from "@/features/steps/shared/primitives";
import { InfoStep } from "@/features/steps/info/schema";
import { audioUrl } from "../cloudinary";
import { uploadedToAudio } from "../upload-media";
import { ambienceGain } from "./ambience";

describe("áudio no Cloudinary", () => {
  it("entrega em mp3 pelo endpoint de vídeo", () => {
    expect(audioUrl("demo", "anzol/audio/voz laura")).toBe("https://res.cloudinary.com/demo/video/upload/anzol/audio/voz%20laura.mp3");
  });
  it("resposta do upload vira AudioMedia com a duração", () => {
    expect(uploadedToAudio({ public_id: "anzol/audio/x", duration: 25.37, resource_type: "video", format: "m4a" })).toEqual({
      kind: "audio",
      publicId: "anzol/audio/x",
      durationSec: 25.4,
    });
    expect(() => uploadedToAudio({ public_id: "x", duration: 700, resource_type: "video" })).toThrow();
  });
  it("voice note nasce válida sem áudio e com fundo padrão", () => {
    const note = VoiceNote.parse({ senderName: "Laura" });
    expect(note.ambience).toEqual({ kind: "none", volume: 20 });
    expect(note.senderColor).toBe("#1f9d55");
    expect(InfoStep.safeParse({ id: "abcd", name: "Info", type: "info", title: "Hola", ctaLabel: "Seguir", voiceNote: note }).success).toBe(true);
  });
  it("fundo nunca passa de 35% do volume da voz", () => {
    expect(ambienceGain(100)).toBeCloseTo(0.35);
    expect(ambienceGain(20)).toBeCloseTo(0.07);
    expect(ambienceGain(500)).toBeCloseTo(0.35);
  });
});
