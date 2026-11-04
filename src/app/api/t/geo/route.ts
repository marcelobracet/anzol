import { NextResponse, type NextRequest } from "next/server";
import { isEuCountry } from "@/features/tracking/consent";
import { requestMeta } from "@/features/tracking/request-meta";

// Diz ao navegador se o visitante está no EEE/UK/CH (país pela borda da Vercel). Não guarda nada.
export function GET(request: NextRequest) {
  const { country } = requestMeta(request.headers);
  return NextResponse.json(
    { success: true, data: { euVisitor: isEuCountry(country) } },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
