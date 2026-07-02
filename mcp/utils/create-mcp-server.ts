import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../handlers/register-tools.js";
import { registerResources } from "../handlers/register-resources.js";
import { getSiteConfig } from "./site-config.js";

/** Create and configure the MCP server with all tools and resources. */
export function createMcpServer(): McpServer {
  const config = getSiteConfig();

  const server = new McpServer(
    {
      name: "satva-solutions-mcp",
      version: "1.0.0",
      websiteUrl: config.siteUrl,
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  registerTools(server);
  registerResources(server);

  return server;
}
