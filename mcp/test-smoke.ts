/**
 * Smoke test for the content index (run after mcp:build or via tsx).
 */
import { getContentIndex, getPageSummaries } from "./utils/content-index.js";
import { searchSite } from "./utils/search.js";

const index = getContentIndex();

console.log("=== Content Index Smoke Test ===\n");
console.log(`Pages:          ${index.pages.length}`);
console.log(`Blog posts:     ${index.blogPosts.length}`);
console.log(`Services:       ${index.services.length}`);
console.log(`FAQs:           ${index.faqs.length}`);
console.log(`Pricing plans:  ${index.pricing.length}`);
console.log(`Search docs:    ${index.searchDocuments.length}`);

console.log("\n--- Page summaries ---");
for (const page of getPageSummaries().slice(0, 8)) {
  console.log(`  ${page.path} → ${page.title}`);
}

console.log("\n--- Search: 'astro' ---");
const results = searchSite(index.searchDocuments, "astro", 3);
for (const r of results) {
  console.log(`  [${r.type}] ${r.title} (${r.path})`);
}

console.log("\n✓ Smoke test passed");
