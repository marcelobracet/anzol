import "server-only";
import { loadPublishedQuiz } from "@/features/runtime/load-published";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { trackingEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendCapiEvent } from "./capi";
import { createSupabaseTrackingRepository } from "./supabase-repository";
import { createTrackService } from "./track-service";

export function trackService() {
  const token = trackingEnv().META_CAPI_TOKEN;
  return createTrackService({
    loadQuiz: loadPublishedQuiz,
    repo: devMemoryEnabled() ? devMemoryStore().tracking : createSupabaseTrackingRepository(supabaseAdmin()),
    sendCapi: (pixelId, event) => sendCapiEvent({ pixelId, token: token!, event }),
    capiToken: token,
    now: () => new Date(),
  });
}
