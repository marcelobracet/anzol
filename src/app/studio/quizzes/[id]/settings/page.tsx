import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { DomainsCard } from "@/features/domains/components/domains-card";
import { domainService } from "@/features/domains/server";
import { archiveQuizAction, duplicateQuizAction, updateQuizMetaAction } from "@/features/quiz/actions";
import { QuizMetaForm } from "@/features/quiz/components/quiz-meta-form";
import { quizService } from "@/features/quiz/server";

// Lê params e dados privados por request.
export const instant = false;

export default async function QuizSettingsPage({ params }: PageProps<"/studio/quizzes/[id]/settings">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const quiz = await quizService().findById(id);
  if (!quiz || quiz.status === "archived") notFound();
  const domains = await domainService().listForQuiz(id);

  const meta = { name: quiz.name, slug: quiz.slug, locale: quiz.locale, currency: quiz.currency };

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <div>
        <Link href={`/quizzes/${quiz.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao editor</Link>
        <h1 className="mt-2 text-2xl font-semibold">{quiz.name}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do quiz</CardTitle></CardHeader>
        <CardContent>
          <QuizMetaForm action={updateQuizMetaAction.bind(null, quiz.id)} defaults={meta} submitLabel="Salvar" successMessage="Salvo." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domínios</CardTitle>
          <CardDescription>O domínio é cadastrado na Vercel automaticamente. O quiz abre em /{quiz.slug} ou na raiz, se for o padrão.</CardDescription>
        </CardHeader>
        <CardContent>
          <DomainsCard quizId={quiz.id} slug={quiz.slug} domains={domains} />
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
