import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  SearchSiteInputSchema,
  ReadPageInputSchema,
  GetBlogPostInputSchema,
  BookDemoInputSchema,
} from "../schemas/index.js";
import { bookDemo } from "../utils/demo-booking.js";
import {
  getContentIndex,
  getPageByPath,
  getPageSummaries,
  getBlogPost,
} from "../utils/content-index.js";
import { searchSite } from "../utils/search.js";
import { logger } from "../utils/logger.js";

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(message: string) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

/** Register all MCP tools on the server instance. */
export function registerTools(server: McpServer): void {
  server.registerTool(
    "search_site",
    {
      title: "Search Site",
      description:
        "Search all markdown files, Astro content collections, blog posts, documentation, and service pages. Returns title, URL, summary, and relevant snippet.",
      inputSchema: {
        query: SearchSiteInputSchema.shape.query,
        limit: SearchSiteInputSchema.shape.limit,
      },
    },
    async ({ query, limit }) => {
      logger.info(`Tool: search_site(query="${query}")`);
      try {
        const index = getContentIndex();
        const results = searchSite(
          index.searchDocuments,
          query,
          limit ?? 20,
        );
        return jsonResult({ query, count: results.length, results });
      } catch (error) {
        logger.error("search_site failed:", error);
        return errorResult(
          `Search failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "read_page",
    {
      title: "Read Page",
      description:
        "Read a public page by path. Returns title, description, markdown content, headings, and metadata.",
      inputSchema: {
        path: ReadPageInputSchema.shape.path,
      },
    },
    async ({ path }) => {
      logger.info(`Tool: read_page(path="${path}")`);
      try {
        const content = getPageByPath(path);
        if (!content) {
          return errorResult(`Page not found: ${path}`);
        }

        const isBlog = "slug" in content;
        const result = isBlog
          ? {
              path: content.path,
              url: content.url,
              title: content.title,
              description: content.description,
              markdown: content.content,
              headings: content.headings,
              metadata: content.metadata,
              author: content.author,
              tags: content.tags,
              publishDate: content.publishDate,
            }
          : {
              path: content.path,
              url: content.url,
              title: content.title,
              description: content.description,
              markdown: content.markdownContent,
              headings: content.headings,
              metadata: content.metadata,
            };

        return jsonResult(result);
      } catch (error) {
        logger.error("read_page failed:", error);
        return errorResult(
          `Read page failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "list_pages",
    {
      title: "List Pages",
      description:
        "List all public pages including home, about, pricing, services, blog, FAQ, and contact with URL, title, and description.",
      inputSchema: {},
    },
    async () => {
      logger.info("Tool: list_pages()");
      try {
        const pages = getPageSummaries();
        return jsonResult({ count: pages.length, pages });
      } catch (error) {
        logger.error("list_pages failed:", error);
        return errorResult(
          `List pages failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "get_faqs",
    {
      title: "Get FAQs",
      description: "Return structured FAQ data for the website.",
      inputSchema: {},
    },
    async () => {
      logger.info("Tool: get_faqs()");
      try {
        const { faqs } = getContentIndex();
        return jsonResult({ count: faqs.length, faqs });
      } catch (error) {
        logger.error("get_faqs failed:", error);
        return errorResult(
          `Get FAQs failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "contact_information",
    {
      title: "Contact Information",
      description:
        "Return contact email, phone, address, social links, and business hours.",
      inputSchema: {},
    },
    async () => {
      logger.info("Tool: contact_information()");
      try {
        const { contact } = getContentIndex();
        return jsonResult(contact);
      } catch (error) {
        logger.error("contact_information failed:", error);
        return errorResult(
          `Contact information failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "get_blog_post",
    {
      title: "Get Blog Post",
      description:
        "Get a single blog post by slug with title, author, tags, published date, and markdown content.",
      inputSchema: {
        slug: GetBlogPostInputSchema.shape.slug,
      },
    },
    async ({ slug }) => {
      logger.info(`Tool: get_blog_post(slug="${slug}")`);
      try {
        const post = getBlogPost(slug);
        if (!post) {
          return errorResult(`Blog post not found: ${slug}`);
        }
        return jsonResult(post);
      } catch (error) {
        logger.error("get_blog_post failed:", error);
        return errorResult(
          `Get blog post failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "list_blog_posts",
    {
      title: "List Blog Posts",
      description: "List all published blog posts with metadata.",
      inputSchema: {},
    },
    async () => {
      logger.info("Tool: list_blog_posts()");
      try {
        const { blogPosts } = getContentIndex();
        const posts = blogPosts.map((p) => ({
          slug: p.slug,
          title: p.title,
          url: p.url,
          snippet: p.snippet,
          author: p.author,
          category: p.category,
          tags: p.tags,
          publishDate: p.publishDate,
        }));
        return jsonResult({ count: posts.length, posts });
      } catch (error) {
        logger.error("list_blog_posts failed:", error);
        return errorResult(
          `List blog posts failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "get_services",
    {
      title: "Get Services",
      description: "Return structured services and capabilities data.",
      inputSchema: {},
    },
    async () => {
      logger.info("Tool: get_services()");
      try {
        const { services } = getContentIndex();
        return jsonResult({ count: services.length, services });
      } catch (error) {
        logger.error("get_services failed:", error);
        return errorResult(
          `Get services failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "get_pricing",
    {
      title: "Get Pricing",
      description: "Return structured pricing plans from the pricing page.",
      inputSchema: {},
    },
    async () => {
      logger.info("Tool: get_pricing()");
      try {
        const { pricing } = getContentIndex();
        return jsonResult({ count: pricing.length, plans: pricing });
      } catch (error) {
        logger.error("get_pricing failed:", error);
        return errorResult(
          `Get pricing failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  server.registerTool(
    "book_demo",
    {
      title: "Book a Demo",
      description:
        "Submit a demo consultation request with name, email, and requirements. Logs the request and emails the sales team when SMTP is configured.",
      inputSchema: {
        name: BookDemoInputSchema.shape.name,
        email: BookDemoInputSchema.shape.email,
        phone: BookDemoInputSchema.shape.phone,
        company: BookDemoInputSchema.shape.company,
        requirements: BookDemoInputSchema.shape.requirements,
        preferredDate: BookDemoInputSchema.shape.preferredDate,
      },
      annotations: {
        title: "Book a Demo",
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      logger.info(`Tool: book_demo(name="${input.name}", email="${input.email}")`);
      try {
        const result = await bookDemo(input);
        return jsonResult(result);
      } catch (error) {
        logger.error("book_demo failed:", error);
        if (error instanceof Error && error.name === "ZodError") {
          return errorResult(`Invalid demo request: ${error.message}`);
        }
        return errorResult(
          `Book demo failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );
}
