import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bookDemo } from "../mcp/dist/utils/demo-booking.js";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Direct demo booking API — used by WebMCP bridge and contact integrations */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const result = await bookDemo(body);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return res.status(400).json({ error: `Invalid demo request: ${details}` });
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Demo booking failed",
    });
  }
}
