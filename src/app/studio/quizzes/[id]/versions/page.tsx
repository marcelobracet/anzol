import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { quizService } from "@/features/quiz/server";
import { restoreToDraftAction, rollbackAction } from "@/features/versions/actions";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function VersionsPage({ params }: PageProps<"/studio/quizzes/[id]/versions">) {
  await requireStudioUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const quiz = await quizService().findById(id);
  if (!quiz || quiz.status === "archived") notFound();
  const versions = await quizService().listVersions(id);

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <div>
        <Link href={`/quizzes/${quiz.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao editor</Link>
        <h1 className="mt-2 text-2xl font-semibold">Versões · {quiz.name}</h1>
        <p className="text-sm text-muted-foreground">
          Cada publicação congela uma versão. “Colocar no ar” volta a publicação para ela na hora, sem mexer no rascunho.
        </p>
      </div>
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma versão publicada ainda.</p>
      ) : (
        <ul className="grid gap-2">
          {versions.map((v) => {
            const live = v.id === quiz.publishedVersionId;
            return (
              <li key={v.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-background px-4 py-3">
                <div className="grid flex-1">
                  <span className="font-medium">
                    Versão {v.versionNumber} {live && <Badge className="ml-1">No ar</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dateFormat.format(new Date(v.createdAt))} · {v.createdBy}
                  </span>
                </div>
                <Link href={`/quizzes/${quiz.id}/versions/${v.id}`} className="text-sm underline-offset-2 hover:underline">
                  Pré-visualizar
                </Link>
                <form action={restoreToDraftAction.bind(null, quiz.id, v.id)}>
                  <Button type="submit" variant="outline" size="sm">Copiar para o rascunho</Button>
                </form>
                {!live && (
                  <form action={rollbackAction.bind(null, quiz.id, v.id)}>
                    <Button type="submit" size="sm">Colocar no ar</Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
