import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createQuizService } from "./service";
import { createSupabaseQuizRepository } from "./supabase-repository";

export const quizService = () => createQuizService(createSupabaseQuizRepository(supabaseAdmin()));
