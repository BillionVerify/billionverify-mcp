# BillionVerify MCP Server — TypeScript

Connect any AI assistant to [BillionVerify](https://billionverify.com) email verification via the [Model Context Protocol](https://modelcontextprotocol.io). Built with the [official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

---

## Option 1 — Online Server (No Installation)

Use BillionVerify's hosted MCP server at `https://mcp.billionverify.com/mcp`. No setup required — just add your API key.

Get your API key from the [BillionVerify Dashboard](https://billionverify.com/auth/sign-in?next=/home/api-keys).

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "billionverify": {
      "command": "curl",
      "args": ["--stdio", "https://mcp.billionverify.com/mcp?api_key=YOUR_API_KEY"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add billionverify -- curl --stdio "https://mcp.billionverify.com/mcp?api_key=YOUR_API_KEY"
```

### Cursor

Go to **Settings → MCP** and add the same JSON configuration as Claude Desktop above.

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
| `get_task_status` | Poll the status of an async file verification job |
| `get_download_url` | Get download URL for results with status filters |
| `create_webhook` | Subscribe to file completion events |
| `list_webhooks` | List all configured webhooks |
| `delete_webhook` | Remove a webhook |
| `health_check` | Check server health |

---

## License

MIT
