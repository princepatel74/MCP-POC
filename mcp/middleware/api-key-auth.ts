import type { Request, Response, NextFunction } from "express";
import {
  isAuthorizedRequest as checkAuth,
} from "../utils/verify-api-key.js";
import { logger } from "../utils/logger.js";

/**
 * API key authentication for hosted MCP HTTP endpoints (Express).
 * Skipped when MCP_PUBLIC=true or MCP_API_KEY is unset.
 */
export function createApiKeyAuth(_apiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    if (!checkAuth(headers)) {
      logger.warn(`Unauthorized MCP request from ${req.ip}`);
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Valid API key required. Use Authorization: Bearer <key> or set MCP_PUBLIC=true.",
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
