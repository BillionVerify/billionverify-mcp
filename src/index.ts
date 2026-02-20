#!/usr/bin/env node
/**
 * BillionVerify MCP Server - TypeScript implementation
 * Uses the official @modelcontextprotocol/sdk
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const VERSION = "1.0.0";
const DEFAULT_BASE_URL = "https://api.billionverify.com";

// ─── API Client ───────────────────────────────────────────────────────────────

class BillionVerifyClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = DEFAULT_BASE_URL
  ) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "BV-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async verifySingleEmail(email: string, checkSmtp = false, forceRefresh = false) {
    return this.request("POST", "/v1/verify/single", { email, check_smtp: checkSmtp, force_refresh: forceRefresh });
  }

  async verifyBatchEmails(emails: string[], checkSmtp = false) {
    return this.request("POST", "/v1/verify/bulk", { emails, check_smtp: checkSmtp });
  }

  async getAccountBalance() {
    return this.request("GET", "/v1/credits");
  }

  async getTaskStatus(taskId: string) {
    return this.request("GET", `/v1/verify/file/${taskId}`);
  }

  async getDownloadUrl(jobId: string, filters: Record<string, boolean>) {
    const params = Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k]) => `${k}=true`)
      .join("&");
    const query = params ? `?${params}` : "";
    return this.request("GET", `/v1/verify/file/${jobId}/results${query}`);
  }

  async createWebhook(url: string, events: string[]) {
    return this.request("POST", "/v1/webhooks", { url, events });
  }

  async listWebhooks() {
    return this.request("GET", "/v1/webhooks");
  }

  async deleteWebhook(webhookId: string) {
    return this.request("DELETE", `/v1/webhooks/${webhookId}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toText(data: unknown): { content: [{ type: "text"; text: string }] } {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function getClient(apiKeyParam?: string): BillionVerifyClient {
  const apiKey = apiKeyParam || process.env.BILLIONVERIFY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No API key provided. Set BILLIONVERIFY_API_KEY env var or pass api_key parameter."
    );
  }
  const baseUrl = process.env.BILLIONVERIFY_API_URL || DEFAULT_BASE_URL;
  return new BillionVerifyClient(apiKey, baseUrl);
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "billionverify-mcp",
  version: VERSION,
});

// health_check
server.tool(
  "health_check",
  "Check the BillionVerify MCP server health status",
  {},
  async () => toText({
    status: "healthy",
    version: VERSION,
    service: "billionverify-mcp",
    timestamp: new Date().toISOString(),
  })
);

// verify_single_email
server.tool(
  "verify_single_email",
  "Verify a single email address",
  {
    email: z.string().email().describe("The email address to verify"),
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
    check_smtp: z.boolean().optional().default(false).describe("Perform SMTP verification"),
    force_refresh: z.boolean().optional().default(false).describe("Bypass cache and force fresh verification"),
  },
  async ({ email, api_key, check_smtp = false, force_refresh = false }) => {
    const client = getClient(api_key);
    const result = await client.verifySingleEmail(email, check_smtp, force_refresh);
    return toText(result);
  }
);

// verify_batch_emails
server.tool(
  "verify_batch_emails",
  "Verify multiple email addresses (up to 50)",
  {
    emails: z.array(z.string().email()).min(1).max(50).describe("List of email addresses to verify (max 50)"),
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
    check_smtp: z.boolean().optional().default(false).describe("Perform SMTP verification"),
  },
  async ({ emails, api_key, check_smtp = false }) => {
    const client = getClient(api_key);
    const result = await client.verifyBatchEmails(emails, check_smtp);
    return toText(result);
  }
);

// get_account_balance
server.tool(
  "get_account_balance",
  "Get the current credit balance for your BillionVerify account",
  {
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
  },
  async ({ api_key }) => {
    const client = getClient(api_key);
    const result = await client.getAccountBalance();
    return toText(result);
  }
);

// get_task_status
server.tool(
  "get_task_status",
  "Get the status and progress of an async file verification job",
  {
    task_id: z.string().describe("The job/task ID returned from a file upload"),
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
  },
  async ({ task_id, api_key }) => {
    const client = getClient(api_key);
    const result = await client.getTaskStatus(task_id);
    return toText(result);
  }
);

// get_download_url
server.tool(
  "get_download_url",
  "Get the download URL for file verification results with optional status filters",
  {
    job_id: z.string().describe("The job ID of the completed file verification"),
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
    valid: z.boolean().optional().default(false).describe("Include valid emails"),
    invalid: z.boolean().optional().default(false).describe("Include invalid emails"),
    catchall: z.boolean().optional().default(false).describe("Include catch-all emails"),
    role: z.boolean().optional().default(false).describe("Include role-based emails"),
    disposable: z.boolean().optional().default(false).describe("Include disposable emails"),
    unknown: z.boolean().optional().default(false).describe("Include unknown emails"),
  },
  async ({ job_id, api_key, valid = false, invalid = false, catchall = false, role = false, disposable = false, unknown = false }) => {
    const client = getClient(api_key);
    const result = await client.getDownloadUrl(job_id, { valid, invalid, catchall, role, disposable, unknown });
    return toText(result);
  }
);

// create_webhook
server.tool(
  "create_webhook",
  "Create a webhook to receive file verification completion notifications",
  {
    url: z.string().url().describe("HTTPS URL to receive webhook events"),
    events: z.array(z.enum(["file.completed", "file.failed"])).min(1).describe("Events to subscribe to"),
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
  },
  async ({ url, events, api_key }) => {
    const client = getClient(api_key);
    const result = await client.createWebhook(url, events);
    return toText(result);
  }
);

// list_webhooks
server.tool(
  "list_webhooks",
  "List all webhooks for your BillionVerify account",
  {
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
  },
  async ({ api_key }) => {
    const client = getClient(api_key);
    const result = await client.listWebhooks();
    return toText(result);
  }
);

// delete_webhook
server.tool(
  "delete_webhook",
  "Delete a webhook by ID",
  {
    webhook_id: z.string().describe("The webhook ID to delete"),
    api_key: z.string().optional().describe("BillionVerify API key (optional if BILLIONVERIFY_API_KEY env is set)"),
  },
  async ({ webhook_id, api_key }) => {
    const client = getClient(api_key);
    const result = await client.deleteWebhook(webhook_id);
    return toText(result);
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`BillionVerify MCP Server v${VERSION} started (stdio)\n`);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
