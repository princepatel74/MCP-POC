# Quick Deploy — princepatel7401@gmail.com

Deploy **website** (Vercel) + **MCP server** (Render) via GitHub.

---

## Step 1 — Create GitHub repository

1. Log in to [github.com](https://github.com) as **princepatel7401**
2. Click **New repository**
3. Name: `satva-solutions` (or any name)
4. **Private** or Public — your choice
5. Do **not** add README (project already has files)
6. Click **Create repository**
7. Copy the repo URL, e.g. `https://github.com/princepatel7401/satva-solutions.git`

---

## Step 2 — Push code from your PC

In terminal at `D:\Temp\MCP`:

```powershell
# Point git to YOUR repo (replace with your actual URL)
git remote set-url origin https://github.com/princepatel7401/satva-solutions.git

# Stage and commit
git add .
git commit -m "Satva Solutions site + hosted MCP server"

# Push (GitHub will prompt login — use princepatel7401@gmail.com)
git push -u origin main
```

If push fails, create a **Personal Access Token** at GitHub → Settings → Developer settings → Tokens, and use it as the password.

---

## Step 3 — Deploy website on Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up** with **princepatel7401@gmail.com**
2. **Add New Project** → Import `princepatel7401/satva-solutions`
3. Framework: **Astro** (auto-detected)
4. Build: `npm run build` · Output: `dist` (from `vercel.json`)
5. Click **Deploy**

Your site: `https://satva-solutions.vercel.app` (or custom domain)

---

## Step 4 — Deploy MCP server on Render

1. Go to [render.com](https://render.com) → **Sign up** with **princepatel7401@gmail.com**
2. **New** → **Blueprint** → Connect GitHub → select `satva-solutions`
3. Render reads `render.yaml` and creates **satva-mcp** service
4. In Render dashboard → **Environment**:
   - `MCP_API_KEY` → Generate random (or paste from `openssl rand -hex 32`)
   - `MCP_ALLOWED_HOSTS` → `satva-mcp.onrender.com` (your Render hostname after deploy)
   - Optional SMTP vars for `book_demo` emails (see `.env.example`)
5. **Deploy**

Your MCP URL: `https://satva-mcp.onrender.com/mcp`

---

## Step 5 — Connect Claude

1. Claude → **Settings** → **Connectors** → **Add custom connector**
2. URL: `https://satva-mcp.onrender.com/mcp`
3. Header: `Authorization: Bearer YOUR_MCP_API_KEY`
4. Ask Claude: *"Book a demo using book_demo for QuickBooks integration"*

---

## Step 6 — Update site URL (optional)

After Vercel deploy, update `astro.config.mjs`:

```js
site: "https://your-vercel-url.vercel.app",
```

Commit and push — both Vercel and Render auto-redeploy.

---

## Checklist

| Step | Service | URL |
|------|---------|-----|
| ☐ | GitHub | `github.com/princepatel7401/satva-solutions` |
| ☐ | Vercel (website) | `https://….vercel.app` |
| ☐ | Render (MCP) | `https://satva-mcp.onrender.com/mcp` |
| ☐ | Claude connector | MCP URL + API key |

---

## Re-deploy after changes

```powershell
git add .
git commit -m "Update content"
git push
```

Vercel and Render redeploy automatically on push.
