#!/usr/bin/env node
/**
 * Hosted MCP Server — Streamable HTTP transport with API key auth.
 *
 * Deploy to Railway, Render, Fly.io, etc. and connect from:
 * - Claude Desktop: Settings → Connectors → Add custom connector (HTTPS URL)
 * - Cursor: mcp.json with "url" + Authorization header
 * - Claude Desktop (local): mcp-remote bridge to your HTTPS URL
 */
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createApiKeyAuth, isPublicPath } from "./middleware/api-key-auth.js";
import { createMcpServer } from "./utils/create-mcp-server.js";
import { getSiteConfig } from "./utils/site-config.js";
import { logger } from "./utils/logger.js";

const PORT = Number(process.env.MCP_HTTP_PORT ?? process.env.PORT ?? "8080");
const HOST = process.env.MCP_HTTP_HOST ?? "0.0.0.0";
const API_KEY = process.env.MCP_API_KEY;

if (!API_KEY || API_KEY.length < 16) {
  logger.error(
    "MCP_API_KEY is required (min 16 characters). Set it in your hosting provider environment variables.",
  );
  process.exit(1);
}

const allowedHosts = process.env.MCP_ALLOWED_HOSTS
  ? process.env.MCP_ALLOWED_HOSTS.split(",").map((h) => h.trim())
  : undefined;

const app = createMcpExpressApp({
  host: HOST,
  allowedHosts,
});

const apiKeyAuth = createApiKeyAuth(API_KEY);

// Public routes
app.get("/health", (_req, res) => {
  const config = getSiteConfig();
  res.json({
    status: "ok",
    service: "satva-solutions-mcp",
    site: config.siteUrl,
    transport: "streamable-http",
    version: "1.0.0",
  });
});

app.get("/", (_req, res) => {
  res.json({
    name: "Satva Solutions MCP Server",
    endpoints: {
      health: "/health",
      mcp: "/mcp",
    },
    docs: "https://modelcontextprotocol.io",
  });
});

app.get("/.well-known/mcp.json", (_req, res) => {
  res.json({
    name: "Satva Solutions MCP",
    description: "Accounting & ERP integration website MCP server",
    transport: "streamable-http",
    endpoint: "/mcp",
    authentication: "api-key",
  });
});

// Auth for all other routes
app.use((req, res, next) => {
  if (isPublicPath(req.path)) {
    next();
    return;
  }
  apiKeyAuth(req, res, next);
});

/** Stateless MCP handler — new server instance per request (cloud-friendly). */
async function handleMcpRequest(
  req: import("express").Request,
  res: import("express").Response,
): Promise<void> {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });
  } catch (error) {
    logger.error("MCP request error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}

app.post("/mcp", handleMcpRequest);
app.get("/mcp", handleMcpRequest);
app.delete("/mcp", handleMcpRequest);

app.listen(PORT, HOST, () => {
  const config = getSiteConfig();
  logger.info(`Hosted MCP server listening on http://${HOST}:${PORT}`);
  logger.info(`Site: ${config.siteUrl}`);
  logger.info(`MCP endpoint: /mcp (API key required)`);
  logger.info(`Health check: /health`);
});

process.on("SIGINT", () => {
  logger.info("Shutting down MCP HTTP server...");
  process.exit(0);
});
