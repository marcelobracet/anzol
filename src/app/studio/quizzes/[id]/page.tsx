import { notFound } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { archiveQuizAction, duplicateQuizAction, updateQuizMetaAction } from "@/features/quiz/actions";
import { QuizMetaForm } from "@/features/quiz/components/quiz-meta-form";
import { quizService } from "@/features/quiz/server";

export default async function QuizPage({ params }: PageProps<"/studio/quizzes/[id]">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const quiz = await quizService().findById(id);
  if (!quiz || quiz.status === "archived") notFound();

  const meta = { name: quiz.name, slug: quiz.slug, locale: quiz.locale, currency: quiz.currency };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{quiz.name}</h1>
        <p className="text-sm text-muted-foreground">
          {quiz.draftDocument.steps.length} step(s) no rascunho · revisão {quiz.draftRevision}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do quiz</CardTitle></CardHeader>
        <CardContent>
          <QuizMetaForm
            action={updateQuizMetaAction.bind(null, quiz.id)}
            defaults={meta}
            submitLabel="Salvar"
            successMessage="Salvo."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duplicar / trocar locale</CardTitle>
          <CardDescription>Cria um rascunho novo com a mesma estrutura para traduzir.</CardDescription>
        </CardHeader>
        <CardContent>
          <QuizMetaForm
            action={duplicateQuizAction.bind(null, quiz.id)}
            defaults={{ ...meta, name: `${quiz.name} (cópia)`, slug: `${quiz.slug}-copia` }}
            submitLabel="Duplicar"
          />
        </CardContent>
      </Card>

      <form action={archiveQuizAction.bind(null, quiz.id)}>
        <Button type="submit" variant="destructive">Arquivar quiz</Button>
      </form>
    </div>
  );
}
