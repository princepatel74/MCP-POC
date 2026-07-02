# Astroship MCP Server

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes your Astroship marketing website content to AI clients such as Claude Desktop, Cursor, and VS Code MCP extensions.

The server reads content directly from your Astro project — pages, blog posts, content collections, and structured data — and automatically refreshes when files change.

## Features

### Tools

| Tool | Description |
|------|-------------|
| `search_site` | Search all pages, blog posts, services, and FAQs |
| `read_page` | Read a page by path with markdown, headings, and metadata |
| `list_pages` | List all public pages with URL, title, and description |
| `get_faqs` | Return structured FAQ data |
| `contact_information` | Email, phone, address, social links, business hours |
| `get_blog_post` | Get a single blog post by slug |
| `list_blog_posts` | List all published blog posts |
| `get_services` | Return services and capabilities |
| `get_pricing` | Return pricing plans from the pricing page |
| `book_demo` | Submit a demo request (name, email, requirements) — logs to file and optionally emails sales |

### Resources

| URI | Description |
|-----|-------------|
| `site://company` | Company information |
| `site://pages/home` | Home page |
| `site://pages/about` | About page |
| `site://pages/pricing` | Pricing page |
| `site://pages/services` | Services page |
| `site://pages/contact` | Contact page |
| `site://pages/faq` | FAQ page |
| `site://blog` | Blog index |
| `site://blog/{slug}` | Individual blog posts |
| `site://case-studies` | Case study posts |
| `site://features` | Product features |
| `site://pricing` | Pricing plans |
| `site://faqs` | FAQ data |
| `site://contact` | Contact information |
| `site://robots.txt` | robots.txt |
| `site://sitemap.xml` | Sitemap (built or dynamically generated) |

## Installation

From the project root:

```bash
npm install
```

Dependencies include `@modelcontextprotocol/sdk`, `zod`, `gray-matter`, `fast-glob`, and `tsx`.

## Running Locally

### Development (stdio)

```bash
npm run mcp:dev
```

### Hosted HTTP server (cloud deploy)

For **remote Claude/Cursor** without a local clone:

```bash
# Set API key (min 16 chars), then start
export MCP_API_KEY=$(openssl rand -hex 32)
npm run mcp:http
```

Deploy to Render, Railway, or Docker. **Full guide: [mcp/DEPLOY.md](./DEPLOY.md)**

| Endpoint | Auth |
|----------|------|
| `GET /health` | Public |
| `POST /mcp` | `Authorization: Bearer <MCP_API_KEY>` |

### Production build

```bash
npm run mcp:build
npm run mcp:start
```

### MCP Inspector (interactive testing)

```bash
npm run mcp:inspect
```

## Connecting Claude Desktop

Edit your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add:

```json
{
  "mcpServers": {
    "astroship": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "D:\\Temp\\MCP"
    }
  }
}
```

Replace `cwd` with the absolute path to your project. Restart Claude Desktop.

## Connecting Cursor

This project includes `.cursor/mcp.json`. Cursor should auto-detect it when you open the workspace. If not, add the server manually in **Cursor Settings → MCP**.

```json
{
  "mcpServers": {
    "astroship": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

## Connecting VS Code MCP

If using an MCP extension for VS Code, add the same server configuration to your MCP settings:

```json
{
  "mcpServers": {
    "astroship": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

## Testing Tools

### Using MCP Inspector

```bash
npm run mcp:inspect
```

Try these tool calls:

- `list_pages` — no arguments
- `search_site` with `{ "query": "pricing" }`
- `read_page` with `{ "path": "/pricing" }`
- `get_blog_post` with `{ "slug": "complete-guide-fullstack-development" }`
- `contact_information` — no arguments
- `book_demo` with:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "company": "Acme Corp",
    "requirements": "We need QuickBooks and Shopify integration for order sync and invoicing."
  }
  ```

### Book a Demo (`book_demo`)

Collects demo requests from AI clients (Claude, Cursor, etc.):

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Full name |
| `email` | Yes | Contact email |
| `requirements` | Yes | What they need help with |
| `phone` | No | Phone number |
| `company` | No | Organization name |
| `preferredDate` | No | Preferred demo date/time |

**Logging:** Every request is appended to `mcp/data/demo-requests/requests.jsonl` (gitignored).

**Email (optional):** Copy `.env.example` to `.env` and set SMTP variables:

```env
MCP_SMTP_HOST=smtp.gmail.com
MCP_SMTP_PORT=587
MCP_SMTP_USER=your-email@gmail.com
MCP_SMTP_PASS=your-app-password
MCP_DEMO_EMAIL_TO=sales@satvasolutions.com
MCP_DEMO_EMAIL_FROM=noreply@satvasolutions.com
```

Without SMTP, requests are still logged — sales can review the JSONL file.

**Example Claude prompt:**

```
Use book_demo to schedule a consultation for me.
Name: John Doe, email: john@acme.com, company: Acme Corp.
We need NetSuite and Xero integration for multi-entity reporting.
```

### Quick smoke test

```bash
npm run mcp:build
node --input-type=module -e "
import { getContentIndex } from './mcp/dist/utils/content-index.js';
const index = getContentIndex();
console.log('Pages:', index.pages.length);
console.log('Blog posts:', index.blogPosts.length);
console.log('Search docs:', index.searchDocuments.length);
"
```

## Project Structure

```
mcp/
├── server.ts              # Entry point (stdio transport)
├── tsconfig.json
├── handlers/
│   ├── register-tools.ts  # All MCP tools
│   └── register-resources.ts
├── schemas/
│   ├── content.ts         # Zod schemas and TypeScript types
│   └── index.ts
└── utils/
    ├── cache.ts           # TTL + mtime-based cache invalidation
    ├── content-index.ts   # Main content aggregator
    ├── content-parser.ts  # Astro/markdown parsing
    ├── logger.ts
    ├── markdown.ts
    ├── paths.ts
    ├── search.ts
    └── site-config.ts

src/data/mcp/              # Structured data (FAQ, contact, services, company)
├── company.json
├── contact.json
├── faqs.json
└── services.json
```

## Adding New Resources

### 1. New Astro page

Add a page under `src/pages/`. The MCP server auto-discovers routes and exposes them via `list_pages` and `read_page`.

### 2. New blog post

Add a markdown/MDX file to `src/content/blog/`. It is automatically indexed and exposed as:

- `get_blog_post` tool
- `list_blog_posts` tool
- `site://blog/{slug}` resource

### 3. New structured data

Add or edit JSON files in `src/data/mcp/`:

- `faqs.json` — FAQ entries
- `contact.json` — Contact details
- `services.json` — Services list
- `company.json` — Company overview

### 4. Custom MCP resource

Edit `mcp/handlers/register-resources.ts` and register a new resource:

```typescript
server.registerResource(
  "my-resource",
  "site://my-resource",
  {
    title: "My Resource",
    description: "Description for AI clients",
    mimeType: "application/json",
  },
  async (uri) => {
    return resourceJson(uri.href, { hello: "world" });
  },
);
```

### 5. Custom MCP tool

Edit `mcp/handlers/register-tools.ts` and register a new tool using Zod schemas from `mcp/schemas/`.

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `MCP_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |

Site URL is read from `astro.config.mjs` (`site` field) and `src/data/mcp/company.json`.

## Deploying the MCP Server

The MCP server runs as a **stdio process** spawned by the AI client. It does not need a public HTTP endpoint for Claude Desktop or Cursor.

### Local / desktop use

Install dependencies on the machine running the AI client and point `cwd` to the project directory.

### Remote / CI use

1. Clone the repo and run `npm install`
2. Optionally run `npm run build` for Astro sitemap generation
3. Configure the MCP client to spawn `npx tsx mcp/server.ts` with the correct `cwd`

For HTTP-based MCP (Streamable HTTP), you can extend `mcp/server.ts` with `@modelcontextprotocol/sdk` Streamable HTTP transport for cloud deployment.

## How Content Stays Fresh

The content index uses a cache with:

- **30-second TTL** — balances performance and freshness
- **File mtime watching** — invalidates cache when any page, content, or data file changes

No manual restart is needed for most content edits; the next tool call rebuilds the index.

## License

Same as Astroship (GPL-3.0).
