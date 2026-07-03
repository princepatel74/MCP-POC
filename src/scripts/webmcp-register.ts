/**
 * Registers Satva site tools with the browser WebMCP API (navigator.modelContext).
 * Required for the Chrome "WebMCP Model Context Tool Inspector" extension.
 */
import "@mcp-b/global";

const TOOL_DEFS = [
  {
    name: "search_site",
    description:
      "Search all pages, blog posts, and documentation on the Satva Solutions website.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: ["query"],
    },
  },
  {
    name: "read_page",
    description: "Read a public page by path (e.g. /about, /solutions).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Page path starting with /" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_pages",
    description: "List all public pages with URL, title, and description.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_faqs",
    description: "Return structured FAQ data for the website.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "contact_information",
    description: "Return contact email, phone, and office addresses.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_blog_post",
    description: "Get a single blog post by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Blog post slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_blog_posts",
    description: "List all published blog posts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_services",
    description: "Return services and integration capabilities.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_pricing",
    description: "Return pricing plans from the pricing page.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "book_demo",
    description:
      "Submit a demo consultation request for accounting/ERP integration.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        phone: { type: "string" },
        company: { type: "string" },
        requirements: { type: "string" },
        preferredDate: { type: "string" },
      },
      required: ["name", "email", "requirements"],
    },
  },
] as const;

async function callToolBridge(tool: string, input: Record<string, unknown>) {
  const res = await fetch("/api/webmcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Tool ${tool} failed`);
  }
  return data;
}

function registerWebMcpTools() {
  const mc = navigator.modelContext;
  if (!mc?.registerTool) {
    console.info(
      "[WebMCP] navigator.modelContext not available. Enable chrome://flags/#enable-webmcp-testing and reload.",
    );
    return;
  }

  for (const def of TOOL_DEFS) {
    mc.registerTool({
      name: def.name,
      description: def.description,
      inputSchema: def.inputSchema,
      async execute(input: Record<string, unknown>) {
        const result = await callToolBridge(def.name, input ?? {});
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    });
  }

  console.info(`[WebMCP] Registered ${TOOL_DEFS.length} tools for browser agents`);
}

registerWebMcpTools();
