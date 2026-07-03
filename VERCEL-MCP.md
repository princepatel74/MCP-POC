# MCP on the Same Site (Vercel)

Your MCP server runs **on the same domain** as your Astro website — no separate Render deployment needed.

## URLs (after Vercel deploy)

| URL | Purpose |
|-----|---------|
| `https://YOUR-SITE.vercel.app/` | Website |
| `https://YOUR-SITE.vercel.app/mcp` | MCP endpoint (AI tools) |
| `https://YOUR-SITE.vercel.app/.well-known/mcp.json` | AI discovery manifest |
| `https://YOUR-SITE.vercel.app/api/health` | Health check |

## Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `MCP_PUBLIC` | `true` | Yes — open access for Claude web & all AI platforms |
| `MCP_DEMO_EMAIL_TO` | `sales@satvasolutions.com` | Recommended |
| `MCP_SMTP_*` | Gmail/SendGrid SMTP | Optional — email demo requests |

**Do not set `MCP_API_KEY`** if you want open access (Claude web compatible).

## Connect Cursor

```json
{
  "mcpServers": {
    "satva-site": {
      "url": "https://YOUR-SITE.vercel.app/mcp"
    }
  }
}
```

No API key needed when `MCP_PUBLIC=true`.

## Connect Claude web

1. **Settings → Connectors → Add custom connector**
2. URL: `https://YOUR-SITE.vercel.app/mcp`
3. Leave **Client ID / Secret empty** (open auth)
4. Click Add

Then ask: *"Book a demo for QuickBooks integration"*

## How AI platforms discover MCP

1. **`/.well-known/mcp.json`** — standard discovery file
2. **`robots.txt`** — references MCP endpoints
3. **Same origin** — MCP lives on your website domain

## You can shut down Render

If MCP is on Vercel, you no longer need `satva-mcp.onrender.com`. One deployment, one domain.

## Redeploy

```bash
git push
```

Vercel rebuilds site + MCP together automatically.
