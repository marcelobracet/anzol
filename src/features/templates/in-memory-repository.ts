import { randomUUID } from "node:crypto";
import { toSummary, type Template, type TemplateRepository } from "./repository";

export function createInMemoryTemplateRepository(): TemplateRepository {
  let rows: Template[] = [];
  return {
    async list() {
      return [...rows].reverse().map(toSummary);
    },
    async findById(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async create(input) {
      const template: Template = { ...input, id: randomUUID(), createdAt: new Date().toISOString(), builtIn: false };
      rows = [...rows, template];
      return template;
    },
    async remove(id) {
      const exists = rows.some((r) => r.id === id);
      rows = rows.filter((r) => r.id !== id);
      return exists;
    },
  };
}
