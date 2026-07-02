# Deploy Hosted MCP Server

This guide deploys the **MCP HTTP server** to the cloud so anyone can connect Claude (or Cursor) to your Satva Solutions site **without cloning the repo locally**.

> **Two deployments:** Your **website** (Astro static site) and **MCP server** (Node.js API) are separate services. The website goes to Vercel/Netlify; the MCP server goes to Railway/Render/Fly.io.

---

## What you get

| URL | Purpose |
|-----|---------|
| `https://your-mcp.example.com/health` | Health check (public) |
| `https://your-mcp.example.com/mcp` | MCP Streamable HTTP endpoint (API key required) |

Tools available: `book_demo`, `search_site`, `read_page`, `contact_information`, and all others.

---

## Step 1 — Generate API key

```bash
openssl rand -hex 32
```

Save this as `MCP_API_KEY` (minimum 16 characters).

---

## Step 2 — Deploy to Render (recommended)

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect repo — Render reads `render.yaml`
4. Set environment variables in dashboard:
   - `MCP_API_KEY` — your secret key
   - `MCP_ALLOWED_HOSTS` — `your-app.onrender.com` (your Render hostname)
   - `MCP_SMTP_*` — optional, for `book_demo` emails
5. Deploy

**Or manual setup:**

- **Build command:** `npm install`
- **Start command:** `npx tsx mcp/server-http.ts`
- **Health check path:** `/health`

Your MCP URL will be: `https://satva-mcp.onrender.com/mcp`

---

## Step 3 — Deploy with Docker (Railway / Fly.io / any VPS)

```bash
docker build -f Dockerfile.mcp -t satva-mcp .
docker run -p 8080:8080 \
  -e MCP_API_KEY=your-secret-key-here \
  -e MCP_ALLOWED_HOSTS=mcp.satvasolutions.com \
  satva-mcp
```

---

## Step 4 — Connect Claude (after deploy)

### Option A: Claude Custom Connector (best for end users)

Claude connects from **Anthropic's cloud** to your **public HTTPS** URL.

1. Open **Claude** → **Settings** → **Connectors** (or [claude.ai/customize/connectors](https://claude.ai/customize/connectors))
2. Click **Add custom connector**
3. Enter URL: `https://your-mcp.onrender.com/mcp`
4. Add API key authentication:
   - Header: `Authorization`
   - Value: `Bearer YOUR_MCP_API_KEY`
   
   (Or use Advanced settings if your plan supports custom auth headers)

5. Save and enable the connector

**Then ask Claude:**

```
Book a demo for me using book_demo.
Name: John Doe
Email: john@company.com
Requirements: QuickBooks and Shopify integration
```

### Option B: Claude Desktop via mcp-remote bridge

If Custom Connectors aren't available, use `mcp-remote` in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "satva-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-mcp.onrender.com/mcp",
        "--header",
        "Authorization: Bearer YOUR_MCP_API_KEY"
      ]
    }
  }
}
```

Restart Claude Desktop.

---

## Step 5 — Connect Cursor (remote URL)

Update `.cursor/mcp.json` or Cursor Settings → MCP:

```json
{
  "mcpServers": {
    "satva-remote": {
      "url": "https://your-mcp.onrender.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}
```

---

## Test locally before deploy

```bash
# Terminal 1
set MCP_API_KEY=local-test-key-min-16chars
npm run mcp:http

# Terminal 2
curl http://localhost:8080/health
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_API_KEY` | **Yes** | Secret key for `/mcp` (min 16 chars) |
| `MCP_HTTP_PORT` / `PORT` | No | Port (default 8080; Render sets `PORT`) |
| `MCP_HTTP_HOST` | No | Bind address (default `0.0.0.0`) |
| `MCP_ALLOWED_HOSTS` | Recommended | Comma-separated allowed Host headers |
| `MCP_SMTP_*` | No | Email notifications for `book_demo` |
| `MCP_DEMO_EMAIL_TO` | No | Sales inbox for demo requests |

---

## Demo requests on hosted server

`book_demo` writes to `mcp/data/demo-requests/requests.jsonl` inside the container.

For production, **enable SMTP** so demo requests email your sales team — container filesystem is ephemeral.

---

## Architecture

```
┌─────────────────┐     HTTPS + API Key      ┌──────────────────────┐
│  Claude / Cursor │ ──────────────────────► │  Hosted MCP Server    │
│  (any user)      │     POST /mcp           │  (Render / Railway)   │
└─────────────────┘                          └──────────┬───────────┘
                                                        │
                                                        ▼
                                             Reads src/ content baked
                                             into Docker image at deploy

┌─────────────────┐
│  Website        │  Separate deploy (Vercel/Netlify)
│  satvasolutions │  Static Astro site — contact form for browsers
└─────────────────┘
```

---

## Updating content after deploy

When you change website content, **redeploy the MCP server** so it picks up new `src/` files:

```bash
git push   # triggers Render/Railway auto-deploy
```

Or rebuild Docker image and redeploy.

---

## Security checklist

- [ ] `MCP_API_KEY` is long and random (32+ hex chars)
- [ ] `MCP_ALLOWED_HOSTS` set to your domain only
- [ ] HTTPS enabled (Render/Railway provide this automatically)
- [ ] SMTP configured for demo request delivery
- [ ] Never commit `.env` or API keys to git
