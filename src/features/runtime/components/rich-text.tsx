import { Fragment } from "react";
import { interpolate, type InterpolationContext } from "../interpolate";
import { parseRichText, type Inline } from "../rich-text";

// accent: ==trecho== vira texto na cor de destaque (títulos), em vez do marca-texto.
function InlineNode({ node, accent = false }: { node: Inline; accent?: boolean }) {
  switch (node.type) {
    case "strong":
      return <strong className="font-semibold">{node.text}</strong>;
    case "em":
      return <em>{node.text}</em>;
    case "mark":
      if (accent) return <span className="text-[var(--q-accent)]">{node.text}</span>;
      return <mark className="rounded bg-[var(--q-accent)]/25 px-1 text-inherit">{node.text}</mark>;
    default:
      return <>{node.text}</>;
  }
}

export function RichText({ text, ctx, className }: { text: string; ctx: InterpolationContext; className?: string }) {
  const paragraphs = parseRichText(interpolate(text, ctx));
  return (
    <div className={className}>
      {paragraphs.map((lines, p) => (
        <p key={p} className="mt-3 first:mt-0">
          {lines.map((line, l) => (
            <Fragment key={l}>
              {l > 0 && <br />}
              {line.map((node, n) => (
                <InlineNode key={n} node={node} />
              ))}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

// Uma linha só (títulos, subtítulos): sem <p>, quebras viram <br />.
export function InlineText({ text, ctx, accent = false }: { text: string; ctx: InterpolationContext; accent?: boolean }) {
  const lines = parseRichText(interpolate(text, ctx)).flat();
  return (
    <>
      {lines.map((line, l) => (
        <Fragment key={l}>
          {l > 0 && <br />}
          {line.map((node, n) => (
            <InlineNode key={n} node={node} accent={accent} />
          ))}
        </Fragment>
      ))}
    </>
  );
}
