import type { Metadata } from "next";
import { QuizPlayer } from "@/features/runtime/components/quiz-player";
import { playableSteps } from "@/features/runtime/engine";
import { mediaEnv } from "@/lib/env";
import { quizFromParams } from "./load";

export async function generateMetadata({ params }: PageProps<"/r/[host]/[[...slug]]">): Promise<Metadata> {
  const quiz = await quizFromParams(params);
  const first = playableSteps(quiz.document)[0];
  const title = first && "title" in first ? first.title : quiz.slug;
  // Página de anúncio: fora dos buscadores.
  return { title, robots: { index: false, follow: false } };
}

export default async function QuizPage({ params }: PageProps<"/r/[host]/[[...slug]]">) {
  const quiz = await quizFromParams(params);
  return <QuizPlayer document={quiz.document} cloudName={mediaEnv().CLOUDINARY_CLOUD_NAME} />;
}
