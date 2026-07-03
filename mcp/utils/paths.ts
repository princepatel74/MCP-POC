import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));

/** Project root directory (parent of /mcp). */
export function getProjectRoot(): string {
  if (process.env.MCP_PROJECT_ROOT) {
    return process.env.MCP_PROJECT_ROOT;
  }
  if (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT) {
    return process.cwd();
  }
  return join(moduleDir, "..", "..");
}

export function getSrcDir(): string {
  return join(getProjectRoot(), "src");
}

export function getPagesDir(): string {
  return join(getSrcDir(), "pages");
}

export function getContentDir(): string {
  return join(getSrcDir(), "content");
}

export function getPublicDir(): string {
  return join(getProjectRoot(), "public");
}

export function getMcpDataDir(): string {
  return join(getSrcDir(), "data", "mcp");
}
