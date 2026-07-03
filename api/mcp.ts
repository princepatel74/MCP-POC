import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleMcpWebRequest, handleMcpOptions } from "../mcp/handlers/web-mcp-handler";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

/** Vercel serverless MCP endpoint — same domain as your Astro site at /mcp */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    const options = handleMcpOptions();
    res.status(204);
    options.headers.forEach((value, key) => res.setHeader(key, value));
    return res.end();
  }

  const host = req.headers.host ?? "localhost";
  const protocol = host.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${host}${req.url ?? "/api/mcp"}`;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const request = new Request(url, {
    method: req.method ?? "GET",
    headers,
    body,
  });

  const response = await handleMcpWebRequest(request);

  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));

  const text = await response.text();
  return res.send(text);
}
