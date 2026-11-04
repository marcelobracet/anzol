import { DM_Sans, Inter, Lora, Manrope, Poppins } from "next/font/google";
import type { Theme } from "@/features/quiz/document/schema";

// Cada quiz usa uma fonte só; preload desligado para não baixar as cinco.
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false });

const FONTS: Record<Theme["font"], { className: string }> = {
  inter,
  manrope,
  poppins,
  "dm-sans": dmSans,
  lora,
};

export const fontClassName = (font: Theme["font"]) => FONTS[font].className;
