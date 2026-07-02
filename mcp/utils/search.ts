import { createSnippet } from "./markdown.js";
import type { SearchDocument, SearchResult } from "../schemas/content.js";

/**
 * Score a document against a search query using simple token matching.
 * Higher scores indicate better relevance.
 */
function scoreDocument(doc: SearchDocument, queryTokens: string[]): number {
  const titleLower = doc.title.toLowerCase();
  const summaryLower = doc.summary.toLowerCase();
  const bodyLower = doc.body.toLowerCase();
  const pathLower = doc.path.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    if (titleLower.includes(token)) score += 10;
    if (summaryLower.includes(token)) score += 5;
    if (pathLower.includes(token)) score += 3;
    if (bodyLower.includes(token)) score += 1;

    // Bonus for exact title match
    if (titleLower === token) score += 20;
  }

  return score;
}

/**
 * Search all indexed site content and return ranked results.
 */
export function searchSite(
  documents: SearchDocument[],
  query: string,
  limit = 20,
): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queryTokens = trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (queryTokens.length === 0) return [];

  const scored = documents
    .map((doc) => ({
      doc,
      score: scoreDocument(doc, queryTokens),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ doc, score }) => {
    const combinedText = `${doc.title}. ${doc.summary} ${doc.body}`;
    const snippet = createSnippet(combinedText, trimmed);

    return {
      title: doc.title,
      url: doc.url,
      path: doc.path,
      summary: doc.summary,
      snippet,
      type: doc.type,
      score,
    };
  });
}
