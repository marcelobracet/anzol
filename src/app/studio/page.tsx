import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { createQuizAction } from "@/features/quiz/actions";
import { QuizMetaForm } from "@/features/quiz/components/quiz-meta-form";
import { quizService } from "@/features/quiz/server";
import { templateService } from "@/features/templates/server";

export default async function StudioHome() {
  await requireStudioUser();
  const [quizzes, templates] = await Promise.all([quizService().list(), templateService().list()]);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8">
      <Card>
        <CardHeader><CardTitle>Novo quiz</CardTitle></CardHeader>
        <CardContent>
          <QuizMetaForm action={createQuizAction} submitLabel="Criar quiz" templates={templates} />
        </CardContent>
      </Card>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Quizzes</h2>
        {quizzes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum quiz ainda.</p>}
        <ul className="grid gap-2">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <Link
                href={`/quizzes/${quiz.id}`}
                className="flex items-center justify-between rounded-lg border bg-background px-4 py-3 hover:bg-muted"
              >
                <span className="grid">
                  <span className="font-medium">{quiz.name}</span>
                  <span className="text-xs text-muted-foreground">/{quiz.slug} · {quiz.locale} · {quiz.currency}</span>
                </span>
                <Badge variant={quiz.status === "published" ? "default" : "secondary"}>
                  {quiz.status === "published" ? "Publicado" : "Rascunho"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
