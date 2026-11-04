import "server-only";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createQuizService } from "./service";
import { createSupabaseQuizRepository } from "./supabase-repository";

export const quizService = () =>
  createQuizService(devMemoryEnabled() ? devMemoryStore().quizzes : createSupabaseQuizRepository(supabaseAdmin()));
