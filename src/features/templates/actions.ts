"use server";

import { revalidatePath } from "next/cache";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import type { FormState } from "@/features/quiz/actions";
import { templateService } from "./server";

export async function saveAsTemplateAction(quizId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { email } = await requireStudioUser();
  const result = await templateService().saveFromQuiz(quizId, String(form.get("name") ?? ""), email);
  if (!result.success) return result;
  revalidatePath("/studio/templates");
  return { success: true, data: null };
}

export async function deleteTemplateAction(id: string): Promise<void> {
  await requireStudioUser();
  const result = await templateService().remove(id);
  if (!result.success) throw new Error(result.error);
  revalidatePath("/studio/templates");
}
