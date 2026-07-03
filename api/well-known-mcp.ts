import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMcpManifest } from "../mcp/handlers/web-mcp-handler";

/** Dynamic MCP discovery manifest — also available via vercel rewrite at /.well-known/mcp.json */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers.host ?? "localhost";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json(getMcpManifest(baseUrl));
}
