#!/usr/bin/env node
/**
 * Astroship MCP Server (stdio) — for local Claude Desktop / Cursor.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./utils/create-mcp-server.js";
import { getSiteConfig } from "./utils/site-config.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  const config = getSiteConfig();
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`MCP stdio server running (site: ${config.siteUrl})`);
}

main().catch((error) => {
  logger.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
