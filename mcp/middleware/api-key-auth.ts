import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * API key authentication for hosted MCP HTTP endpoints.
 * Accepts: Authorization: Bearer <key>  OR  X-MCP-API-Key: <key>
 */
export function createApiKeyAuth(apiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const headerKey = req.headers["x-mcp-api-key"];

    let provided: string | undefined;

    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      provided = authHeader.slice(7).trim();
    } else if (typeof headerKey === "string") {
      provided = headerKey.trim();
    }

    if (!provided || provided !== apiKey) {
      logger.warn(`Unauthorized MCP request from ${req.ip}`);
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Valid API key required. Use Authorization: Bearer <key> or X-MCP-API-Key header.",
      });
      return;
    }

    next();
  };
}

/** Paths that skip authentication (health checks, metadata). */
export function isPublicPath(path: string): boolean {
  return path === "/health" || path === "/" || path === "/.well-known/mcp.json";
}
