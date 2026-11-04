import { Fragment } from "react";
import { interpolate, type InterpolationContext } from "../interpolate";
import { parseRichText, type Inline } from "../rich-text";

function InlineNode({ node }: { node: Inline }) {
  switch (node.type) {
    case "strong":
      return <strong className="font-semibold">{node.text}</strong>;
    case "em":
      return <em>{node.text}</em>;
    case "mark":
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
