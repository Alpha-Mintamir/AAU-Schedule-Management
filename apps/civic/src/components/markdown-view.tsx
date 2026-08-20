import type { ReactNode } from "react";
import { parseMarkdown, type BlockNode, type InlineNode } from "@/lib/markdown";
import { cn } from "@/lib/utils";

function renderInline(nodes: InlineNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case "text":
        return node.value;
      case "bold":
        return <strong key={key}>{renderInline(node.children, key)}</strong>;
      case "italic":
        return <em key={key}>{renderInline(node.children, key)}</em>;
      case "code":
        return (
          <code key={key} className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[0.9em]">
            {node.value}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={node.href}
            rel="noopener noreferrer nofollow"
            target="_blank"
            className="text-primary-700 underline underline-offset-2 hover:text-primary-900"
          >
            {renderInline(node.children, key)}
          </a>
        );
    }
  });
}

function renderBlock(block: BlockNode, index: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = block.level === 2 ? "h3" : "h4";
      return (
        <Tag
          key={index}
          className={cn(
            "font-semibold text-stone-900",
            block.level === 2 ? "mt-5 text-lg" : "mt-4 text-base",
          )}
        >
          {renderInline(block.children, `h${index}`)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p key={index} className="leading-relaxed text-stone-700">
          {renderInline(block.children, `p${index}`)}
        </p>
      );
    case "list":
      return block.ordered ? (
        <ol key={index} className="list-decimal space-y-1 pl-5 text-stone-700">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item, `ol${index}-${i}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={index} className="list-disc space-y-1 pl-5 text-stone-700">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item, `ul${index}-${i}`)}</li>
          ))}
        </ul>
      );
    case "blockquote":
      return (
        <blockquote
          key={index}
          className="border-l-4 border-stone-300 pl-3 text-stone-600 italic"
        >
          {renderInline(block.children, `q${index}`)}
        </blockquote>
      );
  }
}

/**
 * Renders user Markdown as a React tree. No HTML strings are ever injected,
 * so user content cannot introduce markup, styles, or scripts.
 */
export function MarkdownView({ markdown, className }: { markdown: string; className?: string }) {
  const blocks = parseMarkdown(markdown);
  return <div className={cn("space-y-3 text-[15px]", className)}>{blocks.map(renderBlock)}</div>;
}
