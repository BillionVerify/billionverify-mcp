# BillionVerify MCP Server — TypeScript

Connect any AI assistant to [BillionVerify](https://billionverify.com) email verification via the [Model Context Protocol](https://modelcontextprotocol.io). Built with the [official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

---

## Option 1 — Hosted Server (No Installation)

Use BillionVerify's hosted MCP server. There is nothing to install and no API key to paste: you sign in with your BillionVerify account over OAuth, and the connection is tied to that account.

| | |
|---|---|
| Server URL | `https://mcp.billionverify.com/mcp` |
| Transport | Streamable HTTP |
| Authentication | OAuth 2.1 (sign in with your BillionVerify account) |

> The hosted server does **not** accept API keys (`?api_key=`, `BV-API-KEY` or `Authorization: Bearer <api key>` are all rejected). If you want to use an API key, use Option 2.

Detailed step-by-step guide: [docs/connect-chatgpt-claude.md](docs/connect-chatgpt-claude.md).

### ChatGPT (web)

1. Settings → **Apps & Connectors** → **Advanced settings** → turn on **Developer mode**.
2. Settings → **Apps & Connectors** → **Create**.
3. Name `BillionVerify`, MCP server URL `https://mcp.billionverify.com/mcp`, authentication **OAuth** → create.
4. Sign in to BillionVerify in the window that opens and approve access.
5. In a new chat, click **+** → **Developer mode** → enable **BillionVerify**.

### Claude (claude.ai / Claude Desktop)

1. **Customize → Connectors** → **+** → **Add custom connector**.
2. Name `BillionVerify`, URL `https://mcp.billionverify.com/mcp` → **Add** (leave Advanced settings empty).
3. Click **Connect**, sign in to BillionVerify and approve access.
4. In a chat, click **+** → **Connectors** and make sure **BillionVerify** is on.

Team / Enterprise: an Owner adds the connector under **Organization settings → Connectors**, then each member clicks **Connect**.

### Claude Code

```bash
claude mcp add --transport http billionverify https://mcp.billionverify.com/mcp
```

Then run `/mcp` inside Claude Code, select `billionverify` and finish the sign-in in your browser.

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project), then click **Connect** next to the server in **Settings → MCP**:

```json
{
  "mcpServers": {
    "billionverify": {
      "url": "https://mcp.billionverify.com/mcp"
    }
  }
}
```

---

## Option 2 — Self-Hosted (TypeScript / Node.js)

Run your own MCP server using this TypeScript implementation.

### Prerequisites

- Node.js 18+

### Run via npx (no install)

```bash
BILLIONVERIFY_API_KEY=your_api_key npx billionverify-mcp
```

### Claude Desktop config (self-hosted)

```json
{
  "mcpServers": {
    "billionverify": {
      "command": "npx",
      "args": ["-y", "billionverify-mcp"],
      "env": {
        "BILLIONVERIFY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Install globally

```bash
npm install -g billionverify-mcp
billionverify-mcp
```

### Install from source

```bash
git clone https://github.com/BillionVerify/billionverify-mcp.git
cd billionverify-mcp
npm install
npm run build
npm start
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `BILLIONVERIFY_API_KEY` | Your BillionVerify API key | — |
| `BILLIONVERIFY_API_URL` | API base URL override | `https://api.billionverify.com` |

---

## Available Tools

| Tool | Description |
|---|---|
| `verify_single_email` | Verify a single email address in real-time |
| `verify_batch_emails` | Verify up to 50 emails in one request |
| `get_account_balance` | Check your credit balance |
| `get_verification_history` | List verification history (paginated) |
| `get_verification_stats` | Aggregated statistics for 7d / 30d / 90d / 1y |
| `get_task_status` | Poll the status of an async file verification job |
| `get_download_url` | Get download URL for results with status filters |
| `create_webhook` | Subscribe to file completion events |
| `list_webhooks` | List all configured webhooks |
| `delete_webhook` | Remove a webhook |
| `health_check` | Check server health |

---

## License

MIT
