import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

export function registerPayinTools(server: McpServer, client: ExchangeClient): void {
  // POST /payins — execute deposit
  server.registerTool(
    "ashar_execute_payin",
    {
      title: "Execute Payin (Deposit)",
      description: `Execute a PIX deposit using a previously created payin quote.

Args:
  - payin_quote_id (string): id from ashar_create_payin_quote
  - idempotency_key (string, optional): safely retry without double-charging

Returns the payin_id, status, and the PIX payload (pix_copiacola, pix_qrcode_base64, expires_at).

The client pays the generated PIX to complete the deposit.`,
      inputSchema: z
        .object({
          payin_quote_id: z.string().describe("Quote id from ashar_create_payin_quote"),
          idempotency_key: z.string().optional().describe("Optional idempotency key"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/payins", "POST", params);
      return buildResult(data);
    }
  );

  // GET /payins — list
  server.registerTool(
    "ashar_list_payins",
    {
      title: "List Payins",
      description: `List deposit transactions for the tenant, newest first.

Args:
  - status (string, optional): filter by status (e.g. 'processing', 'completed', 'pending', 'failed')
  - limit (number, optional, default 50, max 1000)
  - offset (number, optional, default 0)

Returns a paginated list with total count.`,
      inputSchema: z
        .object({
          status: z.string().optional().describe("Filter by status"),
          limit: z.number().int().min(1).max(1000).optional().describe("Max results (default 50)"),
          offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const qs = new URLSearchParams();
      if (params.status) qs.set("status", params.status);
      if (params.limit !== undefined) qs.set("limit", String(params.limit));
      if (params.offset !== undefined) qs.set("offset", String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const data = await client.request(`/payins${suffix}`, "GET");
      return buildResult(data);
    }
  );

  // GET /payins/:id
  server.registerTool(
    "ashar_get_payin",
    {
      title: "Get Payin",
      description: `Get details of a single deposit by its payin_id.

Args:
  - payin_id (string): the deposit id

Returns live status (queries BlindPay when possible) plus the fee record.`,
      inputSchema: z
        .object({ payin_id: z.string().describe("Deposit id") })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(`/payins/${encodeURIComponent(params.payin_id)}`, "GET");
      return buildResult(data);
    }
  );
}
