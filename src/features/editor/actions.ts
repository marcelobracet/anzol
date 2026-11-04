"use server";

import { revalidatePath } from "next/cache";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { signUpload, type SignedUpload } from "@/features/media/sign-upload";
import { quizService } from "@/features/quiz/server";
import type { Result } from "@/features/quiz/types";
import { revalidateQuizRuntime } from "@/features/runtime/revalidate-quiz";
import { cloudinaryUploadEnv } from "@/lib/env";

export async function saveDraftAction(id: string, document: unknown, revision: number): Promise<Result<{ revision: number }>> {
  await requireStudioUser();
  const result = await quizService().saveDraft(id, document, revision);
  return result.success ? { success: true, data: { revision: result.data.draftRevision } } : result;
}

export async function publishAction(id: string, revision: number): Promise<Result<{ versionNumber: number }>> {
  const { email } = await requireStudioUser();
  const result = await quizService().publish(id, revision, email);
  if (!result.success) return result;

  await revalidateQuizRuntime(id);
  revalidatePath("/studio");
  return { success: true, data: { versionNumber: result.data.versionNumber } };
}

export async function signUploadAction(): Promise<Result<SignedUpload>> {
  await requireStudioUser();
  try {
    const env = cloudinaryUploadEnv();
    const credentials = { cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET };
    return { success: true, data: signUpload(credentials, Math.floor(Date.now() / 1000)) };
  } catch {
    return { success: false, error: "Upload não configurado (variáveis CLOUDINARY_*)" };
  }
}
