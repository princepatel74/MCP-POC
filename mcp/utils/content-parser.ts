import { readFileSync, existsSync } from "node:fs";
import { relative, basename, dirname, sep } from "node:path";
import fg from "fast-glob";
import { getPagesDir, getProjectRoot } from "./paths.js";
import { logger } from "./logger.js";

export interface DiscoveredRoute {
  /** URL path, e.g. /about */
  path: string;
  /** Absolute file path on disk */
  filePath: string;
  /** Route type */
  type: "page" | "dynamic";
  /** Whether this is a public page (excludes 404, dynamic templates) */
  isPublic: boolean;
}

const EXCLUDED_SEGMENTS = new Set(["404"]);

/**
 * Convert a file path under src/pages to a URL route.
 * index.astro -> /
 * about.astro -> /about
 * blog/[slug].astro -> /blog/:slug (dynamic template)
 */
export function filePathToRoute(filePath: string, pagesDir: string): string {
  const rel = relative(pagesDir, filePath).replace(/\\/g, "/");
  const withoutExt = rel.replace(/\.(astro|md|mdx)$/, "");

  if (withoutExt === "index") return "/";

  const parts = withoutExt.split("/");
  const routeParts = parts.map((part) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return `:${part.slice(1, -1)}`;
    }
    return part;
  });

  return "/" + routeParts.join("/");
}

function isDynamicTemplate(route: string): boolean {
  return route.includes(":");
}

function isPublicRoute(route: string, fileName: string): boolean {
  if (EXCLUDED_SEGMENTS.has(fileName.replace(/\.(astro|md|mdx)$/, ""))) {
    return false;
  }
  if (isDynamicTemplate(route)) return false;
  return true;
}

/**
 * Discover all Astro routes by scanning src/pages.
 * Dynamic route templates are listed but marked isPublic=false.
 */
export function discoverRoutes(): DiscoveredRoute[] {
  const pagesDir = getPagesDir();
  if (!existsSync(pagesDir)) {
    logger.warn(`Pages directory not found: ${pagesDir}`);
    return [];
  }

  const files = fg.sync("**/*.{astro,md,mdx}", {
    cwd: pagesDir,
    absolute: true,
  });

  const routes: DiscoveredRoute[] = [];

  for (const filePath of files) {
    const route = filePathToRoute(filePath, pagesDir);
    const fileName = basename(filePath);
    const isDynamic = isDynamicTemplate(route);

    routes.push({
      path: route,
      filePath,
      type: isDynamic ? "dynamic" : "page",
      isPublic: isPublicRoute(route, fileName),
    });
  }

  routes.sort((a, b) => a.path.localeCompare(b.path));
  logger.debug(`Discovered ${routes.length} routes`);
  return routes;
}

/** Watch patterns for cache invalidation across pages and content. */
export function getContentWatchPatterns(): string[] {
  const root = getProjectRoot();
  return [
    `${root}/src/pages/**/*`,
    `${root}/src/content/**/*`,
    `${root}/src/data/mcp/**/*`,
    `${root}/src/components/**/*`,
    `${root}/public/robots.txt`,
    `${root}/astro.config.mjs`,
  ];
}

/** Read raw file content safely. */
export function readTextFile(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

/** Extract Astro component frontmatter (between --- delimiters). */
export function extractAstroFrontmatter(source: string): string {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1] ?? "";
}

/** Extract Layout title prop from Astro frontmatter. */
export function extractLayoutTitle(frontmatter: string): string | undefined {
  const match = frontmatter.match(/<Layout\s+title=["']([^"']*)["']/);
  return match?.[1];
}

/** Extract Sectionhead description from Astro template. */
export function extractSectionDescription(source: string): string | undefined {
  const match = source.match(
    /<Fragment\s+slot=["']desc["']>([\s\S]*?)<\/Fragment>/,
  );
  if (!match) return undefined;
  return match[1].replace(/<[^>]+>/g, "").trim();
}

/** Extract visible text from Astro/HTML template (rough extraction). */
export function extractVisibleText(source: string): string {
  const withoutFrontmatter = source.replace(/^---[\s\S]*?---\r?\n/, "");
  const withoutScripts = withoutFrontmatter.replace(
    /<script[\s\S]*?<\/script>/gi,
    "",
  );
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, "");

  return withoutStyles
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract a JavaScript/TypeScript const array from Astro frontmatter by name. */
export function extractConstArray<T>(
  frontmatter: string,
  name: string,
): T[] | undefined {
  const regex = new RegExp(
    `const\\s+${name}\\s*=\\s*(\\[[\\s\\S]*?\\]);`,
    "m",
  );
  const match = frontmatter.match(regex);
  if (!match?.[1]) return undefined;

  try {
    // Safe evaluation: only arrays assigned to const in our own source files
    const fn = new Function(`return (${match[1]})`);
    return fn() as T[];
  } catch (error) {
    logger.warn(`Failed to parse const ${name}:`, error);
    return undefined;
  }
}

/** Get parent directory name for nested routes. */
export function getRouteSegment(filePath: string, pagesDir: string): string {
  const rel = relative(pagesDir, dirname(filePath));
  if (rel === ".") return "";
  return rel.split(sep).pop() ?? "";
}
