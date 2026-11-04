"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import type { Result } from "@/features/quiz/types";
import { runtimeTags } from "@/features/runtime/runtime-tags";
import { domainService } from "./server";
import type { DomainVerification } from "./vercel-client";

export type DomainFormState = Result<{ host: string; verified: boolean; verification: DomainVerification[] }> | null;

export async function addDomainAction(quizId: string, _prev: DomainFormState, form: FormData): Promise<DomainFormState> {
  await requireStudioUser();
  const result = await domainService().add(quizId, String(form.get("host") ?? ""), form.get("makeDefault") === "on");
  if (!result.success) return result;
  revalidateTag(runtimeTags.host(result.data.host), { expire: 0 });
  revalidatePath(`/studio/quizzes/${quizId}/settings`);
  return result;
}

export async function removeDomainAction(quizId: string, host: string): Promise<void> {
  await requireStudioUser();
  const result = await domainService().remove(quizId, host);
  if (!result.success) throw new Error(result.error);
  revalidateTag(runtimeTags.host(host), { expire: 0 });
  revalidatePath(`/studio/quizzes/${quizId}/settings`);
}
