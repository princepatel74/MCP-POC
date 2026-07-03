/**
 * Export content index to JSON for Vercel serverless (no filesystem scan at runtime).
 * Run: npm run mcp:export
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { clearCache } from "../utils/cache.js";
import { getContentIndex } from "../utils/content-index.js";
import { getProjectRoot } from "../utils/paths.js";

clearCache();
const index = getContentIndex();

const outDir = join(getProjectRoot(), "mcp", "data");
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const outPath = join(outDir, "content-snapshot.json");
writeFileSync(outPath, JSON.stringify(index, null, 2), "utf-8");

console.log(`✓ Exported content snapshot: ${outPath}`);
console.log(
  `  ${index.pages.length} pages, ${index.blogPosts.length} blog posts, ${index.searchDocuments.length} search docs`,
);
