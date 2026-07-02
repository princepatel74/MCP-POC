import { statSync } from "node:fs";
import fg from "fast-glob";
import { logger } from "./logger.js";

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  sourceMtime: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Default TTL in milliseconds; cache also invalidates when watched files change. */
const DEFAULT_TTL_MS = 30_000;

/**
 * Resolve the latest modification time across a set of glob patterns.
 * Used to invalidate cache when site content changes on disk.
 */
export function getLatestMtime(patterns: string[], cwd: string): number {
  let latest = 0;
  for (const pattern of patterns) {
    const files = fg.sync(pattern, { cwd, absolute: true });
    for (const file of files) {
      try {
        const mtime = statSync(file).mtimeMs;
        if (mtime > latest) latest = mtime;
      } catch {
        logger.debug(`Could not stat file for cache: ${file}`);
      }
    }
  }
  return latest;
}

export function getCached<T>(
  key: string,
  factory: () => T,
  options: { ttlMs?: number; watchPatterns?: string[]; cwd?: string } = {},
): T {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const cwd = options.cwd ?? process.cwd();
  const now = Date.now();

  const sourceMtime = options.watchPatterns
    ? getLatestMtime(options.watchPatterns, cwd)
    : 0;

  const existing = cache.get(key) as CacheEntry<T> | undefined;

  if (existing) {
    const ttlValid = now - existing.createdAt < ttlMs;
    const mtimeValid = sourceMtime <= existing.sourceMtime;
    if (ttlValid && mtimeValid) {
      logger.debug(`Cache hit: ${key}`);
      return existing.value;
    }
    logger.debug(`Cache invalidated: ${key}`);
  }

  const value = factory();
  cache.set(key, { value, createdAt: now, sourceMtime });
  return value;
}

/** Clear all cached entries (useful for testing). */
export function clearCache(): void {
  cache.clear();
}
