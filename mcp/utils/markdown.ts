import matter from "gray-matter";

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  content: string;
  raw: string;
}

/** Parse a markdown/MDX file with YAML frontmatter. */
export function parseMarkdownFile(raw: string): ParsedMarkdown {
  const { data, content } = matter(raw);
  return {
    frontmatter: data as Record<string, unknown>,
    content: content.trim(),
    raw,
  };
}

/** Extract heading structure from markdown content. */
export function extractHeadings(
  markdown: string,
): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      headings.push({ level, text, id });
    }
  }

  return headings;
}

/** Strip markdown syntax for plain-text search snippets. */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Create a short snippet around a search match. */
export function createSnippet(
  text: string,
  query: string,
  maxLength = 200,
): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.slice(0, maxLength) + (text.length > maxLength ? "…" : "");
  }

  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + query.length + 60);
  let snippet = text.slice(start, end).trim();

  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";

  return snippet;
}
