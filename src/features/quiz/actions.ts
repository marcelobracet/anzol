"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { quizService } from "./server";
import type { Result } from "./types";

export type FormState = Result<null> | null;

const metaFromForm = (form: FormData) => ({
  name: form.get("name"),
  slug: form.get("slug"),
  locale: form.get("locale"),
  currency: form.get("currency"),
});

// Cada action revalida a sessão: o proxy pode não cobrir todo POST de Server Function.
export async function createQuizAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { email } = await requireStudioUser();
  const result = await quizService().create(metaFromForm(form), email);
  if (!result.success) return result;
  revalidatePath("/studio");
  redirect(`/quizzes/${result.data.id}`);
}

export async function updateQuizMetaAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireStudioUser();
  const result = await quizService().updateMeta(id, metaFromForm(form));
  if (!result.success) return result;
  revalidatePath("/studio");
  return { success: true, data: null };
}

export async function duplicateQuizAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { email } = await requireStudioUser();
  const result = await quizService().duplicate(id, metaFromForm(form), email);
  if (!result.success) return result;
  revalidatePath("/studio");
  redirect(`/quizzes/${result.data.id}`);
}

export async function archiveQuizAction(id: string): Promise<void> {
  await requireStudioUser();
  const result = await quizService().archive(id);
  if (!result.success) throw new Error(result.error);
  revalidatePath("/studio");
  redirect("/");
}
