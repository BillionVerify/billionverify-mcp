# Connect BillionVerify MCP Server to ChatGPT and Claude

This guide walks through connecting the hosted BillionVerify MCP server to ChatGPT (web), Claude (claude.ai / Claude Desktop) and Claude Code. Each step lists the expected result and how to troubleshoot it. You are done when every "Verify" section passes.

## 0. Basics

| Item | Value |
|---|---|
| MCP server URL | `https://mcp.billionverify.com/mcp` |
| Transport | Streamable HTTP |
| Authentication | OAuth 2.1 (sign in with your BillionVerify account), with Dynamic Client Registration (DCR) and PKCE S256 |
| Authorization server | `https://billionverify.com` |
| Scopes | `openid` `profile` `offline_access` `billionverify.read` `billionverify.verify` `billionverify.webhooks` |

The hosted server **does not accept API keys**. `?api_key=` in the URL, a `BV-API-KEY` header, or an API key sent as `Authorization: Bearer` are all rejected (`missing_token` / `invalid_token`). The first tool call returns 401 with a `WWW-Authenticate` header, the client opens the BillionVerify sign-in page, and after you sign in and approve access the tools work.

If you need an API key instead (local agents, CI), use the self-hosted npm package `billionverify-mcp`, see [README Option 2](../README.md#option-2--self-hosted-typescript--nodejs).

### Prerequisites

1. A BillionVerify account with credits. `invalid` and `unknown` results are free; every other status costs 1 credit.
2. You can sign in at `https://billionverify.com` in your browser. Authorization redirects to that domain, so allow pop-ups from it if your browser blocks them.

### Tools (11)

| Tool | What it does | Required scope | Type |
|---|---|---|---|
| `health_check` | Check server status | none | read-only |
| `verify_single_email` | Verify one email in real time | `billionverify.verify` | uses credits |
| `verify_batch_emails` | Verify up to 50 emails in one call | `billionverify.verify` | uses credits |
| `get_account_balance` | Get credit balance | `billionverify.read` | read-only |
| `get_verification_history` | Paginated verification history | `billionverify.read` | read-only |
| `get_verification_stats` | Statistics for 7d / 30d / 90d / 1y | `billionverify.read` | read-only |
| `get_task_status` | Progress of a file verification job | `billionverify.read` | read-only |
| `get_download_url` | Download URL for file results, with status filters | `billionverify.read` | read-only |
| `create_webhook` | Create a webhook | `billionverify.webhooks` | write |
| `list_webhooks` | List webhooks | `billionverify.webhooks` | read-only |
| `delete_webhook` | Delete a webhook | `billionverify.webhooks` | write (destructive) |

## 1. ChatGPT (web)

### 1.1 Requirements

- Custom MCP connectors can only be set up and used on **chatgpt.com in the browser**. The mobile apps do not support them.
- A paid plan is required (Plus / Pro / Business / Enterprise / Edu). **OpenAI's documentation is inconsistent about write access on personal plans**: the developer docs say Plus / Pro get full read/write, while the Help Center says personal plans only get read-only tools and full read/write is limited to Business / Enterprise / Edu. `verify_single_email` and `verify_batch_emails` consume credits, so they are not marked read-only. If your plan only allows read-only tools, these two may be unavailable. Check this in step 1.5.
- Business / Enterprise / Edu workspaces: an admin must allow Developer mode in workspace settings first.

### 1.2 Turn on Developer mode

1. Open https://chatgpt.com , click your avatar (bottom left) → **Settings**.
2. Go to **Apps & Connectors** (called **Apps** in some versions).
3. Scroll to **Advanced settings** and turn on **Developer mode**.

Expected: the toggle is on and a **Create** button appears.

### 1.3 Create the connector

1. On **Apps & Connectors**, click **Create**.
2. Fill in:

| Field | Value |
|---|---|
| Name | `BillionVerify` |
| Description | `Verify email addresses with BillionVerify` (optional) |
| MCP Server URL | `https://mcp.billionverify.com/mcp` |
| Authentication | `OAuth` |

3. If Client ID / Client Secret fields appear, **leave them empty**. The server supports dynamic client registration and ChatGPT registers itself.
4. Tick the "I trust this application" confirmation and click **Create**.

### 1.4 OAuth sign-in

1. After Create, ChatGPT opens the BillionVerify sign-in page (`https://billionverify.com/auth/sign-in?...`).
2. Sign in with your BillionVerify account. If you are already signed in you go straight to the consent page.
3. Approve access on the consent page.
4. You are sent back to `chatgpt.com`; the connector shows as connected and lists 11 tools.

### 1.5 Use it in a chat and verify

1. Start a new chat, click **+** next to the input → **Developer mode** (or **More → Developer mode**), and enable **BillionVerify**.
2. Send the prompts below one by one. For each, make sure ChatGPT actually called the tool (a tool-call card appears in the reply) instead of answering from memory:

| # | Prompt | Expected tool | Pass criteria |
|---|---|---|---|
| 1 | `Use BillionVerify to check my credit balance` | `get_account_balance` | `credits_balance` matches the website dashboard |
| 2 | `Use BillionVerify to verify support@billionverify.com` | `verify_single_email` | Returns `status`, `score` and other fields; a confirmation prompt for write actions may appear, approve it |
| 3 | `Use BillionVerify to verify a@gmail.com, test@mailinator.com` | `verify_batch_emails` | Two results, the second is `disposable` |
| 4 | `Show my verification stats for the last 30 days` | `get_verification_stats` | Returns `total_verified` and other stats |
| 5 | `List my last 5 verification records` | `get_verification_history` | Returns records, including the emails from steps 2 and 3 |
| 6 | `List my webhooks` | `list_webhooks` | Returns the webhook list (may be empty) |

If prompts 2 and 3 are refused, or ChatGPT says the connector only supports read-only actions, that is the plan restriction from 1.1, not a server problem.

### 1.6 Troubleshooting

| Symptom | Cause and fix |
|---|---|
| No Developer mode in settings | Not available on the Free plan; on Business / Enterprise / Edu an admin must enable it |
| Cannot connect / OAuth fails after Create | Make sure the URL is exactly `https://mcp.billionverify.com/mcp` (the trailing `/mcp` is required) and authentication is OAuth |
| Not redirected back to ChatGPT after sign-in | The browser blocked the pop-up or redirect; allow pop-ups from `billionverify.com` and click **Connect** on the connector page again |
| Tool call returns `insufficient_scope` | Not all scopes were granted; disconnect BillionVerify in Apps & Connectors and connect again |
| Tool call reports insufficient credits | The account has 0 credits; top up and retry |

## 2. Claude (claude.ai / Claude Desktop)

claude.ai and Claude Desktop share the same connector settings. Add it once and it works in both.

### 2.1 Requirements

- Free plan: at most 1 custom connector. Pro / Max: unlimited.
- Team / Enterprise: an Owner adds the connector and each member connects with their own account (see 2.4).

### 2.2 Add the connector (Free / Pro / Max)

1. Open https://claude.ai (or Claude Desktop) and go to **Customize → Connectors** (**Settings → Connectors** in older versions).
2. Click **+** → **Add custom connector**.
3. Fill in:

| Field | Value |
|---|---|
| Name | `BillionVerify` |
| Remote MCP server URL | `https://mcp.billionverify.com/mcp` |
| Advanced settings (OAuth Client ID / Secret) | **Leave empty**, the server supports dynamic client registration |

4. Click **Add**.

### 2.3 OAuth sign-in

1. Find BillionVerify in the connector list and click **Connect**.
2. The browser opens the BillionVerify sign-in page; sign in and approve access.
3. You are sent back to Claude and the connector shows as connected. Open it to see the 11 tools; each can be set to Always allow / Ask every time / Disabled.

### 2.4 Team / Enterprise

1. Owner: **Organization settings → Connectors** → **Add** → **Custom → Web** → URL `https://mcp.billionverify.com/mcp` → **Add**.
2. Members: **Customize → Connectors** → BillionVerify → **Connect** → sign in and approve. Each member authorizes with their own BillionVerify account and uses their own credits.

### 2.5 Use it in a chat and verify

1. Start a new chat, click **+** at the bottom left of the input → **Connectors**, and make sure **BillionVerify** is on.
2. Run the 6 prompts from 1.5 with the same pass criteria. Claude asks for permission the first time each tool is used; approve it (or choose Always allow).

### 2.6 Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Error after clicking Add | Make sure the URL ends with `/mcp` and Advanced settings is empty |
| Still shows not connected after Connect | Remove the connector and add it again; check that the browser did not block the redirect |
| The model does not call the tools | Make sure BillionVerify is on under **+ → Connectors**; mention "use BillionVerify" in the prompt |

## 3. Claude Code

### 3.1 Add

```bash
# Current project only, only you (default local scope)
claude mcp add --transport http billionverify https://mcp.billionverify.com/mcp

# All projects
claude mcp add --transport http --scope user billionverify https://mcp.billionverify.com/mcp
```

### 3.2 Sign in

1. Start `claude` and run `/mcp`.
2. Select `billionverify` → **Authenticate**. The browser opens the BillionVerify sign-in page; sign in and approve.
3. If the browser does not open, copy the URL printed in the terminal into your browser.
4. Back in `/mcp`, `billionverify` shows `connected` with 11 tools.

You can also run `claude mcp login billionverify` from the shell; sign out with `claude mcp logout billionverify`.

### 3.3 Verify

Run the prompts from 1.5 in Claude Code. `claude mcp list` should show `billionverify: https://mcp.billionverify.com/mcp (HTTP) - ✓ Connected`.

## 4. Check the server manually (optional, for troubleshooting)

These commands need no sign-in and confirm the server and the OAuth discovery chain are healthy:

```bash
# Server health
curl -s https://mcp.billionverify.com/health
# Expected: {"mode":"api-proxy","service":"billionverify-mcp","status":"healthy",...}

# Protected resource metadata (clients use it to find the authorization server)
curl -s https://mcp.billionverify.com/.well-known/oauth-protected-resource
# Expected: authorization_servers is ["https://billionverify.com"]

# Authorization server metadata
curl -s https://billionverify.com/.well-known/oauth-authorization-server
# Expected: registration_endpoint is https://billionverify.com/api/auth/oauth2/register

# Unauthenticated tool call: expect 401 with WWW-Authenticate: Bearer ... resource_metadata="..."
curl -s -i https://mcp.billionverify.com/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_account_balance","arguments":{}}}'
```

## 5. Disconnect and revoke

- ChatGPT: Settings → Apps & Connectors → BillionVerify → Disconnect / Delete.
- Claude: Customize → Connectors → BillionVerify → Disconnect / Remove.
- Claude Code: `claude mcp logout billionverify`; remove with `claude mcp remove billionverify`.
