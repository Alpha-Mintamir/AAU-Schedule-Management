/**
 * Minimal Markdown parser producing a typed AST that is rendered to React
 * elements (see components/markdown-view.tsx). Because output is a React
 * tree — never an HTML string — user content cannot inject markup or
 * scripts. Only http(s) link destinations are honored.
 *
 * Supported syntax: headings (##, ###), paragraphs, unordered/ordered lists,
 * blockquotes, bold, italic, inline code, links.
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: InlineNode[] };

export type BlockNode =
  | { type: "heading"; level: 2 | 3; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "blockquote"; children: InlineNode[] };

export function isSafeHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

const INLINE_PATTERN =
  /(\*\*(?<bold>[^*]+)\*\*)|(\*(?<italic>[^*]+)\*)|(`(?<code>[^`]+)`)|(\[(?<label>[^\]]+)\]\((?<href>[^)\s]+)\))/g;

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    const groups = match.groups ?? {};
    if (groups.bold !== undefined) {
      nodes.push({ type: "bold", children: [{ type: "text", value: groups.bold }] });
    } else if (groups.italic !== undefined) {
      nodes.push({ type: "italic", children: [{ type: "text", value: groups.italic }] });
    } else if (groups.code !== undefined) {
      nodes.push({ type: "code", value: groups.code });
    } else if (groups.label !== undefined && groups.href !== undefined) {
      if (isSafeHref(groups.href)) {
        nodes.push({
          type: "link",
          href: groups.href,
          children: [{ type: "text", value: groups.label }],
        });
      } else {
        // Unsafe scheme: render the label as plain text, drop the destination.
        nodes.push({ type: "text", value: groups.label });
      }
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }
  return nodes;
}

export function parseMarkdown(markdown: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({
        type: "list",
        ordered: list.ordered,
        items: list.items.map((item) => parseInline(item)),
      });
      list = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{2,3})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 2 | 3,
        children: parseInline(headingMatch[2]),
      });
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/.exec(trimmed);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "blockquote", children: parseInline(quoteMatch[1]) });
      continue;
    }

    const bulletMatch = /^[-*]\s+(.*)$/.exec(trimmed);
    if (bulletMatch) {
      flushParagraph();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraph();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(orderedMatch[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

/** Plain-text version of markdown, for search indexing and meta descriptions. */
export function markdownToPlainText(markdown: string): string {
  const collectInline = (nodes: InlineNode[]): string =>
    nodes
      .map((n) => {
        switch (n.type) {
          case "text":
            return n.value;
          case "code":
            return n.value;
          case "bold":
          case "italic":
          case "link":
            return collectInline(n.children);
        }
      })
      .join("");

  return parseMarkdown(markdown)
    .map((block) => {
      switch (block.type) {
        case "heading":
        case "paragraph":
        case "blockquote":
          return collectInline(block.children);
        case "list":
          return block.items.map((item) => collectInline(item)).join(" ");
      }
    })
    .join("\n")
    .trim();
}
