/** Returns true if the request carries a valid MCP API key, or if public access is allowed. */
export function isPublicAccessAllowed(): boolean {
  return (
    process.env.MCP_PUBLIC === "true" ||
    process.env.MCP_AUTH_DISABLED === "true" ||
    !process.env.MCP_API_KEY
  );
}

export function extractApiKeyFromHeaders(headers: Headers): string | undefined {
  const auth = headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return headers.get("x-mcp-api-key")?.trim();
}

export function isAuthorizedRequest(headers: Headers): boolean {
  if (isPublicAccessAllowed()) return true;

  const expected = process.env.MCP_API_KEY;
  if (!expected) return true;

  const provided = extractApiKeyFromHeaders(headers);
  return provided === expected;
}

export function unauthorizedResponse(): Response {
  return Response.json(
    {
      error: "Unauthorized",
      message:
        "Valid API key required. Use Authorization: Bearer <key> or X-MCP-API-Key header, or set MCP_PUBLIC=true for open access.",
    },
    { status: 401 },
  );
}
