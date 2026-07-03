import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "../utils/create-mcp-server.js";
import {
  isAuthorizedRequest,
  unauthorizedResponse,
} from "../utils/verify-api-key.js";
import { getSiteConfig } from "../utils/site-config.js";
import { logger } from "../utils/logger.js";

const MCP_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-MCP-API-Key, mcp-session-id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

/** MCP discovery manifest for AI clients and /.well-known/mcp.json */
export function getMcpManifest(baseUrl: string) {
  const publicAccess = process.env.MCP_PUBLIC === "true" || !process.env.MCP_API_KEY;
  return {
    name: "Satva Solutions MCP",
    description:
      "Accounting & ERP integration website — search pages, read content, book demos, get services and FAQs.",
    version: "1.0.0",
    transport: "streamable-http",
    endpoint: `${baseUrl.replace(/\/$/, "")}/mcp`,
    health: `${baseUrl.replace(/\/$/, "")}/api/health`,
    authentication: publicAccess ? "none" : "api-key",
    tools: [
      "search_site",
      "read_page",
      "list_pages",
      "get_faqs",
      "contact_information",
      "get_blog_post",
      "list_blog_posts",
      "get_services",
      "get_pricing",
      "book_demo",
    ],
    documentation: "https://modelcontextprotocol.io",
  };
}

export function healthJson() {
  const config = getSiteConfig();
  return {
    status: "ok",
    service: "satva-solutions-mcp",
    site: config.siteUrl,
    transport: "streamable-http",
    version: "1.0.0",
    embedded: true,
  };
}

/** Handle CORS preflight for MCP endpoints. */
export function handleMcpOptions(): Response {
  return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
}

/**
 * Stateless Streamable HTTP MCP handler (Vercel, Edge, any Web Request/Response runtime).
 */
export async function handleMcpWebRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return handleMcpOptions();
  }

  if (!isAuthorizedRequest(request.headers)) {
    logger.warn("Unauthorized MCP request");
    const res = unauthorizedResponse();
    Object.entries(MCP_CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createMcpServer();

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    Object.entries(MCP_CORS_HEADERS).forEach(([k, v]) =>
      response.headers.set(k, v),
    );
    return response;
  } catch (error) {
    logger.error("MCP web request error:", error);
    return Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      },
      { status: 500, headers: MCP_CORS_HEADERS },
    );
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
