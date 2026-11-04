import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authenticateStudio } from "./studio-auth";

export async function requireStudioUser(): Promise<{ email: string }> {
  const result = await authenticateStudio(await headers());
  if (!result.ok) notFound();
  return { email: result.email };
}
