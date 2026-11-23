import type { AnswerCount } from "./engagement";

export type AnswerStats = { counts: AnswerCount[]; answeredByStep: Record<string, number> };
export type ResponseRow = {
  sessionId: string;
  startedAt: string | null;
  lastAt: string | null;
  stepsViewed: number;
  answers: Record<string, string[]>;
  lead: { name: string | null; email: string | null; phone: string | null } | null;
  utm: Record<string, string>;
};
export type ResponsePage = { rows: ResponseRow[]; total: number };
