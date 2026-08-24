import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

export function registerPayoutTools(server: McpServer, client: ExchangeClient): void {
  // POST /payouts — execute withdrawal
  server.registerTool(
    "ashar_execute_payout",
    {
      title: "Execute Payout (Withdrawal)",
      description: `Execute a USDC/USDT -> PIX withdrawal using a previously created payout quote.

Args:
  - quote_id (string): id from ashar_create_payout_quote
  - sender_wallet_id (string): the sender wallet address from which crypto is debited
  - idempotency_key (string, optional): safely retry without double-spending

Returns the payout_id and status.`,
      inputSchema: z
        .object({
          quote_id: z.string().describe("Quote id from ashar_create_payout_quote"),
          sender_wallet_id: z.string().describe("Sender wallet address debited for the payout"),
          idempotency_key: z.string().optional().describe("Optional idempotency key"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/payouts", "POST", params);
      return buildResult(data);
    }
  );

  // GET /payouts — list
  server.registerTool(
    "ashar_list_payouts",
    {
      title: "List Payouts",
      description: `List withdrawal transactions for the tenant, newest first.

Args:
  - status (string, optional): filter by status
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
      const data = await client.request(`/payouts${suffix}`, "GET");
      return buildResult(data);
    }
  );

  // GET /payouts/:id
  server.registerTool(
    "ashar_get_payout",
    {
      title: "Get Payout",
      description: `Get details of a single withdrawal by its payout_id.

Args:
  - payout_id (string): the withdrawal id

Returns live status (queries BlindPay when possible) plus the fee record.`,
      inputSchema: z.object({ payout_id: z.string().describe("Withdrawal id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(`/payouts/${encodeURIComponent(params.payout_id)}`, "GET");
      return buildResult(data);
    }
  );
}
