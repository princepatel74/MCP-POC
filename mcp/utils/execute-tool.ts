import { z } from "zod";
import {
  SearchSiteInputSchema,
  ReadPageInputSchema,
  GetBlogPostInputSchema,
  BookDemoInputSchema,
} from "../schemas/index.js";
import { bookDemo } from "./demo-booking.js";
import {
  getContentIndex,
  getPageByPath,
  getPageSummaries,
  getBlogPost,
} from "./content-index.js";
import { searchSite } from "./search.js";
import { logger } from "./logger.js";

export class ToolExecutionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "ToolExecutionError";
  }
}

/** Shared tool logic for MCP server and browser WebMCP bridge. */
export async function executeTool(
  name: string,
  input: Record<string, unknown> = {},
): Promise<unknown> {
  logger.info(`executeTool: ${name}`);

  try {
    return await runTool(name, input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new ToolExecutionError(`Invalid input: ${details}`, 400);
    }
    throw error;
  }
}

async function runTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "search_site": {
      const { query, limit } = SearchSiteInputSchema.parse(input);
      const index = getContentIndex();
      const results = searchSite(index.searchDocuments, query, limit ?? 20);
      return { query, count: results.length, results };
    }

    case "read_page": {
      const { path } = ReadPageInputSchema.parse(input);
      const content = getPageByPath(path);
      if (!content) {
        throw new ToolExecutionError(`Page not found: ${path}`, 404);
      }
      const isBlog = "slug" in content;
      return isBlog
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
    }

    case "list_pages": {
      const pages = getPageSummaries();
      return { count: pages.length, pages };
    }

    case "get_faqs": {
      const { faqs } = getContentIndex();
      return { count: faqs.length, faqs };
    }

    case "contact_information": {
      const { contact } = getContentIndex();
      return contact;
    }

    case "get_blog_post": {
      const { slug } = GetBlogPostInputSchema.parse(input);
      const post = getBlogPost(slug);
      if (!post) {
        throw new ToolExecutionError(`Blog post not found: ${slug}`, 404);
      }
      return post;
    }

    case "list_blog_posts": {
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
      return { count: posts.length, posts };
    }

    case "get_services": {
      const { services } = getContentIndex();
      return { count: services.length, services };
    }

    case "get_pricing": {
      const { pricing } = getContentIndex();
      return { count: pricing.length, plans: pricing };
    }

    case "book_demo": {
      return bookDemo(input);
    }

    default:
      throw new ToolExecutionError(`Unknown tool: ${name}`, 404);
  }
}

/** Tool metadata for WebMCP browser registration. */
export const WEBMCP_TOOL_DEFINITIONS = [
  {
    name: "search_site",
    description:
      "Search all pages, blog posts, and documentation on the Satva Solutions website.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: ["query"],
    },
  },
  {
    name: "read_page",
    description: "Read a public page by path (e.g. /about, /solutions).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Page path starting with /" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_pages",
    description: "List all public pages with URL, title, and description.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_faqs",
    description: "Return structured FAQ data for the website.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "contact_information",
    description: "Return contact email, phone, and office addresses.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_blog_post",
    description: "Get a single blog post by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Blog post slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_blog_posts",
    description: "List all published blog posts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_services",
    description: "Return services and integration capabilities.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_pricing",
    description: "Return pricing plans from the pricing page.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "book_demo",
    description:
      "Submit a demo consultation request for accounting/ERP integration.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        phone: { type: "string" },
        company: { type: "string" },
        requirements: { type: "string" },
        preferredDate: { type: "string" },
      },
      required: ["name", "email", "requirements"],
    },
  },
] as const;
