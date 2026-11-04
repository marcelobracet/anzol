import "server-only";
import { quizService } from "@/features/quiz/server";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createTemplateService } from "./service";
import { createSupabaseTemplateRepository } from "./supabase-repository";

export const templateService = () =>
  createTemplateService(
    devMemoryEnabled() ? devMemoryStore().templates : createSupabaseTemplateRepository(supabaseAdmin()),
    quizService(),
  );
