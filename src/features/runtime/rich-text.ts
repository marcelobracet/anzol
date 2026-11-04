// Markdown restrito: **negrito**, *itálico* ou _itálico_, ==destaque== e quebras de linha.
// Sem HTML, links ou aninhamento: o resultado vira nós React, nunca innerHTML.
export type Inline = { type: "text" | "strong" | "em" | "mark"; text: string };
export type Line = Inline[];
export type Paragraph = Line[];

const TOKEN = /\*\*(.+?)\*\*|==(.+?)==|\*(.+?)\*|_(.+?)_/g;

function parseLine(line: string): Line {
  const nodes: Line = [];
  let cursor = 0;
  for (const match of line.matchAll(TOKEN)) {
    if (match.index > cursor) nodes.push({ type: "text", text: line.slice(cursor, match.index) });
    const [, strong, mark, em, emUnderscore] = match;
    if (strong !== undefined) nodes.push({ type: "strong", text: strong });
    else if (mark !== undefined) nodes.push({ type: "mark", text: mark });
    else nodes.push({ type: "em", text: em ?? emUnderscore });
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) nodes.push({ type: "text", text: line.slice(cursor) });
  return nodes;
}

export function parseRichText(source: string): Paragraph[] {
  return source
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").filter((line) => line.trim() !== "").map(parseLine))
    .filter((paragraph) => paragraph.length > 0);
}
