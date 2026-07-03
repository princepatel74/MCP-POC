import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getProjectRoot } from "./paths.js";

export interface SiteConfig {
  siteUrl: string;
  siteName: string;
  defaultDescription: string;
  defaultKeywords: string[];
  twitterHandle: string;
  ogImage: string;
}

/**
 * Read site URL and metadata from astro.config.mjs and company data.
 * Falls back to sensible defaults if parsing fails.
 */
export function getSiteConfig(): SiteConfig {
  const root = getProjectRoot();
  const astroConfigPath = join(root, "astro.config.mjs");

  let siteUrl = "https://astroship.web3templates.com";
  try {
    const configContent = readFileSync(astroConfigPath, "utf-8");
    const siteMatch = configContent.match(/site:\s*["']([^"']+)["']/);
    if (siteMatch?.[1]) {
      siteUrl = siteMatch[1].replace(/\/$/, "");
    }
  } catch {
    // Use default
  }

  let companyName = "Astroship";
  let description =
    "Astroship is a starter website template for Astro built with TailwindCSS.";
  try {
    const companyPath = join(root, "src/data/mcp/company.json");
    const company = JSON.parse(readFileSync(companyPath, "utf-8")) as {
      name?: string;
      description?: string;
      siteUrl?: string;
    };
    if (company.name) companyName = company.name;
    if (company.description) description = company.description;
    if (company.siteUrl) siteUrl = company.siteUrl.replace(/\/$/, "");
  } catch {
    // Use defaults
  }

  if (process.env.VERCEL_URL) {
    siteUrl = `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return {
    siteUrl,
    siteName: companyName,
    defaultDescription: description,
    defaultKeywords: [
      "astro",
      "tailwindcss",
      "marketing",
      "startup",
      "saas",
      "website template",
    ],
    twitterHandle: "@surjithctly",
    ogImage: `${siteUrl}/opengraph.jpg`,
  };
}

/** Build a canonical absolute URL from a site path. */
export function toAbsoluteUrl(path: string, siteUrl?: string): string {
  const base = (siteUrl ?? getSiteConfig().siteUrl).replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
