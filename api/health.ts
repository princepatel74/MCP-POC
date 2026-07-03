import type { VercelRequest, VercelResponse } from "@vercel/node";
import { healthJson } from "../mcp/handlers/web-mcp-handler";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json(healthJson());
}
