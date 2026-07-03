import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  executeTool,
  ToolExecutionError,
  WEBMCP_TOOL_DEFINITIONS,
} from "../mcp/utils/execute-tool";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Browser WebMCP bridge — executes site tools server-side for navigator.modelContext */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      service: "satva-webmcp-bridge",
      tools: WEBMCP_TOOL_DEFINITIONS.map((t) => t.name),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  const { tool, input } = body as { tool?: string; input?: Record<string, unknown> };

  if (!tool) {
    return res.status(400).json({ error: "Missing tool name" });
  }

  try {
    const result = await executeTool(tool, input ?? {});
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ToolExecutionError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Tool execution failed",
    });
  }
}
