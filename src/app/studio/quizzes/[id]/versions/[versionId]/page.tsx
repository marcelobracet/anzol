import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { Preview } from "@/features/editor/components/preview";
import { quizService } from "@/features/quiz/server";
import { mediaEnv } from "@/lib/env";

export const instant = false;

export default async function VersionPreviewPage({ params }: PageProps<"/studio/quizzes/[id]/versions/[versionId]">) {
  await requireStudioUser();
  const { id, versionId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(versionId).success) notFound();
  const [quiz, version] = await Promise.all([quizService().findById(id), quizService().findVersion(versionId)]);
  if (!quiz || !version || version.quizId !== id) notFound();
  const media = mediaEnv();

  return (
    <div className="mx-auto grid max-w-3xl justify-items-center gap-4 px-4 py-8">
      <div className="justify-self-start">
        <Link href={`/quizzes/${id}/versions`} className="text-sm text-muted-foreground hover:text-foreground">← Versões</Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {quiz.name} · versão {version.versionNumber}
        </h1>
      </div>
      <Preview
        document={version.document}
        selectedId={version.document.steps.find((s) => !s.hidden)?.id ?? null}
        cloudName={media.CLOUDINARY_CLOUD_NAME}
        bunnyHost={media.BUNNY_CDN_HOST}
        locale={quiz.locale}
        resetKey={0}
      />
    </div>
  );
}
