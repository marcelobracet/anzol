import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { domainService } from "@/features/domains/server";
import { QuizEditor } from "@/features/editor/components/quiz-editor";
import { quizService } from "@/features/quiz/server";
import { mediaEnv } from "@/lib/env";

// Lê params e dados privados por request.
export const instant = false;

export default async function QuizEditorPage({ params }: PageProps<"/studio/quizzes/[id]">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const quiz = await quizService().findById(id);
  if (!quiz || quiz.status === "archived") notFound();

  const domains = await domainService().listForQuiz(id);
  const live = quiz.status === "published" ? domains[0] : undefined;
  const liveUrl = live ? `https://${live.host}${live.isDefault ? "/" : `/${quiz.slug}`}` : null;

  const media = mediaEnv();
  return (
    <QuizEditor
      quiz={{ id: quiz.id, name: quiz.name, locale: quiz.locale, status: quiz.status, draftDocument: quiz.draftDocument, draftRevision: quiz.draftRevision }}
      liveUrl={liveUrl}
      cloudName={media.CLOUDINARY_CLOUD_NAME}
      bunnyHost={media.BUNNY_CDN_HOST}
    />
  );
}
