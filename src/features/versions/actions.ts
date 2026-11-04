"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { quizService } from "@/features/quiz/server";
import { revalidateQuizRuntime } from "@/features/runtime/revalidate-quiz";

export async function rollbackAction(quizId: string, versionId: string): Promise<void> {
  await requireStudioUser();
  const result = await quizService().rollback(quizId, versionId);
  if (!result.success) throw new Error(result.error);
  await revalidateQuizRuntime(quizId);
  revalidatePath(`/studio/quizzes/${quizId}/versions`);
}

export async function restoreToDraftAction(quizId: string, versionId: string): Promise<void> {
  await requireStudioUser();
  const quiz = await quizService().findById(quizId);
  if (!quiz) throw new Error("Quiz não encontrado");
  const result = await quizService().restoreToDraft(quizId, versionId, quiz.draftRevision);
  if (!result.success) throw new Error(result.error);
  redirect(`/quizzes/${quizId}`);
}
