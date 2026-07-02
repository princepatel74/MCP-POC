import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getContentIndex,
  getPageByPath,
  getCaseStudies,
} from "../utils/content-index.js";
import { getSiteConfig, toAbsoluteUrl } from "../utils/site-config.js";
import { logger } from "../utils/logger.js";

function resourceJson(uri: string, data: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function resourceText(uri: string, text: string, mimeType = "text/plain") {
  return {
    contents: [
      {
        uri,
        mimeType,
        text,
      },
    ],
  };
}

function resourceMarkdown(uri: string, markdown: string) {
  return resourceText(uri, markdown, "text/markdown");
}

/** Register all MCP resources on the server instance. */
export function registerResources(server: McpServer): void {
  const config = getSiteConfig();

  // Company information resource
  server.registerResource(
    "company",
    "site://company",
    {
      title: "Company Information",
      description: "Company overview, mission, and values",
      mimeType: "application/json",
    },
    async (uri) => {
      const { company } = getContentIndex();
      return resourceJson(uri.href, { ...company, siteUrl: config.siteUrl });
    },
  );

  // Static page resources
  const staticPages = ["/", "/about", "/pricing", "/services", "/contact", "/faq"];

  for (const path of staticPages) {
    const resourceName = path === "/" ? "home" : path.slice(1);
    const uri = `site://pages${path === "/" ? "/home" : path}`;

    server.registerResource(
      `page-${resourceName}`,
      uri,
      {
        title: `Page: ${path}`,
        description: `Website page content for ${path}`,
        mimeType: "application/json",
      },
      async (uri) => {
        const content = getPageByPath(path);
        if (!content || "slug" in content) {
          return resourceJson(uri.href, { error: `Page not found: ${path}` });
        }
        return resourceJson(uri.href, {
          path: content.path,
          url: content.url,
          title: content.title,
          description: content.description,
          markdown: content.markdownContent,
          headings: content.headings,
          metadata: content.metadata,
        });
      },
    );
  }

  // Blog listing resource
  server.registerResource(
    "blog-index",
    "site://blog",
    {
      title: "Blog",
      description: "All published blog posts",
      mimeType: "application/json",
    },
    async (uri) => {
      const { blogPosts } = getContentIndex();
      return resourceJson(uri.href, {
        count: blogPosts.length,
        posts: blogPosts.map((p) => ({
          slug: p.slug,
          title: p.title,
          url: p.url,
          author: p.author,
          publishDate: p.publishDate,
          tags: p.tags,
          snippet: p.snippet,
        })),
      });
    },
  );

  // Individual blog post resources via template
  server.registerResource(
    "blog-post",
    new ResourceTemplate("site://blog/{slug}", { list: undefined }),
    {
      title: "Blog Post",
      description: "Individual blog post with full markdown content",
      mimeType: "application/json",
    },
    async (uri, { slug }) => {
      const slugStr = Array.isArray(slug) ? slug[0] : slug;
      const { blogPosts } = getContentIndex();
      const post = blogPosts.find((p) => p.slug === slugStr);

      if (!post) {
        return resourceJson(uri.href, { error: `Blog post not found: ${slugStr}` });
      }

      return resourceJson(uri.href, {
        title: post.title,
        slug: post.slug,
        publishedDate: post.publishDate,
        author: post.author,
        tags: post.tags,
        category: post.category,
        url: post.url,
        markdown: post.content,
        metadata: post.metadata,
      });
    },
  );

  // Case studies (blog posts tagged or categorized as case studies)
  server.registerResource(
    "case-studies",
    "site://case-studies",
    {
      title: "Case Studies",
      description: "Case study blog posts and success stories",
      mimeType: "application/json",
    },
    async (uri) => {
      const caseStudies = getCaseStudies();
      return resourceJson(uri.href, {
        count: caseStudies.length,
        caseStudies: caseStudies.map((p) => ({
          slug: p.slug,
          title: p.title,
          url: p.url,
          snippet: p.snippet,
          publishDate: p.publishDate,
        })),
      });
    },
  );

  // Features / landing page highlights
  server.registerResource(
    "features",
    "site://features",
    {
      title: "Features",
      description: "Product features and capabilities",
      mimeType: "application/json",
    },
    async (uri) => {
      const { services } = getContentIndex();
      return resourceJson(uri.href, { features: services });
    },
  );

  // Pricing resource
  server.registerResource(
    "pricing",
    "site://pricing",
    {
      title: "Pricing",
      description: "Pricing plans and features",
      mimeType: "application/json",
    },
    async (uri) => {
      const { pricing } = getContentIndex();
      return resourceJson(uri.href, { plans: pricing, url: toAbsoluteUrl("/pricing") });
    },
  );

  // FAQ resource
  server.registerResource(
    "faqs",
    "site://faqs",
    {
      title: "FAQs",
      description: "Frequently asked questions",
      mimeType: "application/json",
    },
    async (uri) => {
      const { faqs } = getContentIndex();
      return resourceJson(uri.href, { faqs });
    },
  );

  // Contact resource
  server.registerResource(
    "contact",
    "site://contact",
    {
      title: "Contact",
      description: "Contact information and business hours",
      mimeType: "application/json",
    },
    async (uri) => {
      const { contact } = getContentIndex();
      return resourceJson(uri.href, contact);
    },
  );

  // robots.txt
  server.registerResource(
    "robots-txt",
    "site://robots.txt",
    {
      title: "robots.txt",
      description: "Website robots.txt file",
      mimeType: "text/plain",
    },
    async (uri) => {
      const { robotsTxt } = getContentIndex();
      return resourceText(uri.href, robotsTxt, "text/plain");
    },
  );

  // sitemap.xml
  server.registerResource(
    "sitemap-xml",
    "site://sitemap.xml",
    {
      title: "sitemap.xml",
      description:
        "Website sitemap (available after running astro build, or lists URLs dynamically)",
      mimeType: "application/xml",
    },
    async (uri) => {
      const index = getContentIndex();

      if (index.sitemapXml) {
        return resourceText(uri.href, index.sitemapXml, "application/xml");
      }

      // Generate a dynamic sitemap when dist/ is not available
      const urls = [
        ...index.pages.map((p) => p.url),
        ...index.blogPosts.map((p) => p.url),
      ];
      const uniqueUrls = [...new Set(urls)].sort();

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

      return resourceText(uri.href, xml, "application/xml");
    },
  );

  logger.info("Registered MCP resources");
}
