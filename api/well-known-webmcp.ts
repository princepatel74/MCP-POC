import type { VercelRequest, VercelResponse } from "@vercel/node";
import { WEBMCP_TOOL_DEFINITIONS } from "../mcp/dist/utils/execute-tool.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers.host ?? "localhost";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  return res.status(200).json({
    name: "Satva Solutions WebMCP",
    description:
      "Browser-native tools registered via navigator.modelContext on the Satva Solutions website.",
    version: "1.0.0",
    api: "navigator.modelContext",
    bridge: `${baseUrl}/api/webmcp`,
    tools: WEBMCP_TOOL_DEFINITIONS,
    documentation: "https://developer.chrome.com/docs/ai/webmcp",
  });
}
