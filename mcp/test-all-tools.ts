import { executeTool } from "./utils/execute-tool.js";

process.env.VERCEL = "1";
process.env.USE_MCP_SNAPSHOT = "true";

const cases: [string, Record<string, unknown>][] = [
  ["list_pages", {}],
  ["search_site", { query: "QuickBooks" }],
  ["read_page", { path: "/about" }],
  ["get_faqs", {}],
  ["contact_information", {}],
  ["get_blog_post", { slug: "complete-guide-fullstack-development" }],
  ["list_blog_posts", {}],
  ["get_services", {}],
  ["get_pricing", {}],
  ["book_demo", { name: "Test", email: "t@t.com", requirements: "demo test" }],
];

let failed = 0;
for (const [name, input] of cases) {
  try {
    await executeTool(name, input);
    console.log(`OK  ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${name}:`, error instanceof Error ? error.message : error);
  }
}

if (failed > 0) process.exit(1);
