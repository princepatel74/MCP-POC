import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import fg from "fast-glob";
import { getCached } from "./cache.js";
import {
  getContentDir,
  getMcpDataDir,
  getProjectRoot,
  getPublicDir,
} from "./paths.js";
import { getSiteConfig, toAbsoluteUrl } from "./site-config.js";
import {
  discoverRoutes,
  extractAstroFrontmatter,
  extractConstArray,
  extractLayoutTitle,
  extractSectionDescription,
  extractVisibleText,
  readTextFile,
  getContentWatchPatterns,
} from "./content-parser.js";
import {
  parseMarkdownFile,
  extractHeadings,
  stripMarkdown,
} from "./markdown.js";
import { createRequire } from "node:module";
import { logger } from "./logger.js";
import type {
  BlogPost,
  PageContent,
  PageSummary,
  PricingPlan,
  Service,
  FaqItem,
  ContactInfo,
  CompanyInfo,
  SearchDocument,
  PageMetadata,
} from "../schemas/content.js";

const CACHE_KEY = "content-index";
const SNAPSHOT_RELATIVE = join("mcp", "data", "content-snapshot.json");
const require = createRequire(import.meta.url);

let bundledSnapshotCache: ContentIndex | null = null;

function getBundledSnapshot(): ContentIndex {
  if (!bundledSnapshotCache) {
    bundledSnapshotCache = require("../data/content-snapshot.json") as ContentIndex;
  }
  return bundledSnapshotCache;
}

function loadContentSnapshot(): ContentIndex | null {
  const candidates = [
    join(getProjectRoot(), SNAPSHOT_RELATIVE),
    join(process.cwd(), SNAPSHOT_RELATIVE),
  ];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      logger.info(`Loading MCP content snapshot: ${filePath}`);
      return JSON.parse(readFileSync(filePath, "utf-8")) as ContentIndex;
    } catch (error) {
      logger.warn(`Failed to load content snapshot ${filePath}:`, error);
    }
  }
  return null;
}

export interface ContentIndex {
  pages: PageContent[];
  blogPosts: BlogPost[];
  teamMembers: Array<{
    slug: string;
    name: string;
    title: string;
    publishDate: string;
  }>;
  pricing: PricingPlan[];
  services: Service[];
  faqs: FaqItem[];
  contact: ContactInfo;
  company: CompanyInfo;
  searchDocuments: SearchDocument[];
  robotsTxt: string;
  sitemapXml: string | null;
}

function loadJsonFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch (error) {
    logger.warn(`Failed to parse JSON: ${filePath}`, error);
    return fallback;
  }
}

function defaultPageTitle(path: string): string {
  if (path === "/") return "Home";
  const segment = path.split("/").filter(Boolean).pop() ?? "Page";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function buildPageMetadata(
  path: string,
  title: string,
  description: string,
  keywords?: string[],
): PageMetadata {
  const config = getSiteConfig();
  const canonicalUrl = toAbsoluteUrl(path, config.siteUrl);
  const fullTitle =
    path === "/"
      ? `${config.siteName} - Starter Template for Astro with Tailwind CSS`
      : title
        ? `${title} | ${config.siteName}`
        : config.siteName;

  return {
    title: fullTitle,
    metaDescription: description || config.defaultDescription,
    keywords: keywords ?? config.defaultKeywords,
    canonicalUrl,
    openGraph: {
      url: canonicalUrl,
      type: path.startsWith("/blog/") ? "article" : "website",
      title: fullTitle,
      description: description || config.defaultDescription,
      image: config.ogImage,
      imageAlt: `${config.siteName} page screenshot`,
      siteName: config.siteName,
      twitterCreator: config.twitterHandle,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": path.startsWith("/blog/") ? "BlogPosting" : "WebPage",
      name: fullTitle,
      description: description || config.defaultDescription,
      url: canonicalUrl,
    },
  };
}

function parseBlogPosts(): BlogPost[] {
  const blogDir = join(getContentDir(), "blog");
  if (!existsSync(blogDir)) return [];

  const files = fg.sync("**/*.{md,mdx}", { cwd: blogDir, absolute: true });
  const posts: BlogPost[] = [];

  for (const filePath of files) {
    const raw = readTextFile(filePath);
    const parsed = parseMarkdownFile(raw);
    const slug = basename(filePath).replace(/\.(md|mdx)$/, "");

    const draft = Boolean(parsed.frontmatter.draft);
    if (draft) continue;

    const title = String(parsed.frontmatter.title ?? slug);
    const snippet = String(parsed.frontmatter.snippet ?? "");
    const author = String(parsed.frontmatter.author ?? "Astroship");
    const category = String(parsed.frontmatter.category ?? "General");
    const tags = Array.isArray(parsed.frontmatter.tags)
      ? (parsed.frontmatter.tags as string[])
      : [];
    const publishDate = String(
      parsed.frontmatter.publishDate ?? new Date().toISOString(),
    );

    const path = `/blog/${slug}`;
    const description = snippet || stripMarkdown(parsed.content).slice(0, 160);

    posts.push({
      slug,
      path,
      url: toAbsoluteUrl(path),
      title,
      snippet,
      description,
      author,
      category,
      tags,
      publishDate,
      content: parsed.content,
      headings: extractHeadings(parsed.content),
      metadata: buildPageMetadata(path, title, description, tags),
      draft,
    });
  }

  posts.sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );

  return posts;
}

function parseStaticPage(routePath: string, filePath: string): PageContent {
  const source = readTextFile(filePath);
  const frontmatter = extractAstroFrontmatter(source);
  const layoutTitle = extractLayoutTitle(frontmatter);
  const sectionDesc = extractSectionDescription(source);
  const visibleText = extractVisibleText(source);

  const title =
    layoutTitle || defaultPageTitle(routePath);
  const description =
    sectionDesc ||
    visibleText.slice(0, 160) ||
    getSiteConfig().defaultDescription;

  let markdownContent = `# ${title}\n\n${description}\n\n`;
  if (visibleText) {
    markdownContent += stripMarkdown(visibleText);
  }

  // Enrich home page with hero content
  if (routePath === "/") {
    markdownContent =
      "# Marketing website done with Astro\n\n" +
      "Astroship is a starter template for startups, marketing websites & landing pages. " +
      "Built with Astro.build and TailwindCSS.\n\n" +
      markdownContent;
  }

  return {
    path: routePath,
    url: toAbsoluteUrl(routePath),
    title,
    description,
    markdownContent,
    headings: extractHeadings(markdownContent),
    metadata: buildPageMetadata(routePath, title, description),
    sourceFile: filePath,
    type: "page",
  };
}

function parsePricingFromPage(): PricingPlan[] {
  const pricingPage = join(getProjectRoot(), "src/pages/pricing.astro");
  if (!existsSync(pricingPage)) return [];

  const source = readTextFile(pricingPage);
  const frontmatter = extractAstroFrontmatter(source);
  const pricing = extractConstArray<PricingPlan>(frontmatter, "pricing");
  return pricing ?? [];
}

function buildSearchDocuments(index: Omit<ContentIndex, "searchDocuments">): SearchDocument[] {
  const docs: SearchDocument[] = [];

  for (const page of index.pages) {
    docs.push({
      id: `page:${page.path}`,
      title: page.title,
      url: page.url,
      path: page.path,
      summary: page.description,
      body: stripMarkdown(page.markdownContent),
      type: "page",
    });
  }

  for (const post of index.blogPosts) {
    docs.push({
      id: `blog:${post.slug}`,
      title: post.title,
      url: post.url,
      path: post.path,
      summary: post.snippet || post.description,
      body: stripMarkdown(post.content),
      type: "blog",
    });
  }

  for (const service of index.services) {
    docs.push({
      id: `service:${service.id}`,
      title: service.name,
      url: toAbsoluteUrl("/services"),
      path: "/services",
      summary: service.description,
      body: service.description,
      type: "service",
    });
  }

  for (const faq of index.faqs) {
    docs.push({
      id: `faq:${faq.id}`,
      title: faq.question,
      url: toAbsoluteUrl("/faq"),
      path: "/faq",
      summary: faq.answer,
      body: `${faq.question} ${faq.answer}`,
      type: "faq",
    });
  }

  return docs;
}

function parseServicesFromFeatures(): Service[] {
  const featuresPage = join(getProjectRoot(), "src/components/features.astro");
  if (!existsSync(featuresPage)) return [];

  const source = readTextFile(featuresPage);
  const frontmatter = extractAstroFrontmatter(source);
  const features = extractConstArray<{
    title: string;
    description: string;
    icon?: string;
  }>(frontmatter, "features");

  if (!features) return [];

  return features.map((f) => ({
    id: f.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-"),
    name: f.title,
    description: f.description,
    icon: f.icon,
  }));
}

function loadServices(): Service[] {
  const fromFeatures = parseServicesFromFeatures();
  if (fromFeatures.length > 0) return fromFeatures;

  return loadJsonFile<{ services: Service[] }>(
    join(getMcpDataDir(), "services.json"),
    { services: [] },
  ).services;
}

function buildContentIndex(): ContentIndex {
  logger.info("Building content index...");
  const root = getProjectRoot();
  const mcpDataDir = getMcpDataDir();

  const routes = discoverRoutes();
  const pages: PageContent[] = [];

  for (const route of routes) {
    if (!route.isPublic) continue;
    pages.push(parseStaticPage(route.path, route.filePath));
  }

  const blogPosts = parseBlogPosts();

  // Add virtual pages for blog listing and services/FAQ if not in routes
  const existingPaths = new Set(pages.map((p) => p.path));

  if (!existingPaths.has("/services")) {
    const servicesList = loadServices();
    pages.push({
      path: "/services",
      url: toAbsoluteUrl("/services"),
      title: "Services",
      description: "Services and capabilities offered by Astroship.",
      markdownContent:
        "# Services\n\n" +
        servicesList
          .map((s) => `## ${s.name}\n\n${s.description}`)
          .join("\n\n"),
      headings: servicesList.map((s) => ({
        level: 2,
        text: s.name,
        id: s.id,
      })),
      metadata: buildPageMetadata(
        "/services",
        "Services",
        "Services and capabilities offered by Astroship.",
      ),
      type: "virtual",
    });
  }

  if (!existingPaths.has("/faq")) {
    const faqsData = loadJsonFile<{ faqs: FaqItem[] }>(
      join(mcpDataDir, "faqs.json"),
      { faqs: [] },
    );
    pages.push({
      path: "/faq",
      url: toAbsoluteUrl("/faq"),
      title: "FAQ",
      description: "Frequently asked questions about Astroship.",
      markdownContent:
        "# FAQ\n\n" +
        faqsData.faqs
          .map((f) => `## ${f.question}\n\n${f.answer}`)
          .join("\n\n"),
      headings: faqsData.faqs.map((f) => ({
        level: 2,
        text: f.question,
        id: f.id,
      })),
      metadata: buildPageMetadata(
        "/faq",
        "FAQ",
        "Frequently asked questions about Astroship.",
      ),
      type: "virtual",
    });
  }

  const teamDir = join(getContentDir(), "team");
  const teamMembers: ContentIndex["teamMembers"] = [];
  if (existsSync(teamDir)) {
    const teamFiles = fg.sync("**/*.md", { cwd: teamDir, absolute: true });
    for (const filePath of teamFiles) {
      const parsed = parseMarkdownFile(readTextFile(filePath));
      if (parsed.frontmatter.draft) continue;
      teamMembers.push({
        slug: basename(filePath).replace(/\.md$/, ""),
        name: String(parsed.frontmatter.name ?? ""),
        title: String(parsed.frontmatter.title ?? ""),
        publishDate: String(parsed.frontmatter.publishDate ?? ""),
      });
    }
  }

  const pricing = parsePricingFromPage();
  const services = loadServices();
  const faqs = loadJsonFile<{ faqs: FaqItem[] }>(
    join(mcpDataDir, "faqs.json"),
    { faqs: [] },
  ).faqs;
  const contact = loadJsonFile<ContactInfo>(
    join(mcpDataDir, "contact.json"),
    {
      email: "",
      phone: "",
      address: { formatted: "" },
      social: {},
      businessHours: {},
    },
  );
  const company = loadJsonFile<CompanyInfo>(
    join(mcpDataDir, "company.json"),
    {
      name: "Astroship",
      description: "",
      tagline: "",
      mission: "",
      values: [],
      siteUrl: getSiteConfig().siteUrl,
    },
  );

  const robotsPath = join(getPublicDir(), "robots.txt");
  const robotsTxt = existsSync(robotsPath)
    ? readTextFile(robotsPath)
    : "User-agent: *\nAllow: /";

  // Sitemap is generated at build time; try dist or provide index reference
  let sitemapXml: string | null = null;
  const distSitemap = join(root, "dist", "sitemap-index.xml");
  const distSitemap0 = join(root, "dist", "sitemap-0.xml");
  if (existsSync(distSitemap)) {
    sitemapXml = readTextFile(distSitemap);
  } else if (existsSync(distSitemap0)) {
    sitemapXml = readTextFile(distSitemap0);
  }

  const partial = {
    pages,
    blogPosts,
    teamMembers,
    pricing,
    services,
    faqs,
    contact,
    company,
    robotsTxt,
    sitemapXml,
  };

  return {
    ...partial,
    searchDocuments: buildSearchDocuments(partial),
  };
}

/** Get the full content index, with caching that invalidates on file changes. */
export function getContentIndex(): ContentIndex {
  if (process.env.VERCEL || process.env.USE_MCP_SNAPSHOT === "true") {
    const fromFile = loadContentSnapshot();
    if (fromFile) return fromFile;
    logger.info("Using bundled MCP content snapshot");
    return getBundledSnapshot();
  }

  return getCached(CACHE_KEY, buildContentIndex, {
    watchPatterns: getContentWatchPatterns(),
    cwd: getProjectRoot(),
  });
}

export function getPageSummaries(): PageSummary[] {
  const index = getContentIndex();
  const summaries: PageSummary[] = index.pages.map((p) => ({
    path: p.path,
    url: p.url,
    title: p.title,
    description: p.description,
  }));

  for (const post of index.blogPosts) {
    summaries.push({
      path: post.path,
      url: post.url,
      title: post.title,
      description: post.description,
    });
  }

  summaries.sort((a, b) => a.path.localeCompare(b.path));
  return summaries;
}

export function getPageByPath(path: string): PageContent | BlogPost | undefined {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const index = getContentIndex();

  const page = index.pages.find((p) => p.path === normalized);
  if (page) return page;

  const blogMatch = normalized.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return index.blogPosts.find((p) => p.slug === blogMatch[1]);
  }

  return undefined;
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getContentIndex().blogPosts.find((p) => p.slug === slug);
}

export function getCaseStudies(): BlogPost[] {
  return getContentIndex().blogPosts.filter(
    (p) =>
      p.category.toLowerCase().includes("case stud") ||
      p.tags.some((t) => t.toLowerCase().includes("case-study")),
  );
}
