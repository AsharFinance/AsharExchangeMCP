import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

const Token = z.enum(["USDC", "USDT"]);
const Network = z.enum(["polygon", "ethereum", "base", "arbitrum", "solana", "stellar", "tron"]);

export function registerTransferTools(server: McpServer, client: ExchangeClient): void {
  // POST /transfers — execute crypto -> crypto transfer
  server.registerTool(
    "ashar_execute_transfer",
    {
      title: "Execute Transfer (Crypto -> Crypto)",
      description: `Transfer stablecoins from a BlindPay wallet to an external address (creates a quote and executes in one call).

Args:
  - wallet_id (string): source BlindPay wallet
  - request_amount (number, cents): amount
  - sender_token (string): 'USDC' or 'USDT'
  - destination_address (string): external destination address
  - destination_token (string): 'USDC' or 'USDT'
  - destination_network (string): one of polygon, ethereum, base, arbitrum, solana, stellar, tron
  - idempotency_key (string, optional)

Returns the transfer_id, status, tx_hash, and amounts.`,
      inputSchema: z
        .object({
          wallet_id: z.string().describe("Source BlindPay wallet id"),
          request_amount: z.number().int().min(1).describe("Amount in cents"),
          sender_token: Token.describe("Stablecoin being sent"),
          destination_address: z.string().describe("External destination address"),
          destination_token: Token.describe("Stablecoin received"),
          destination_network: Network.describe("Destination network"),
          idempotency_key: z.string().optional().describe("Optional idempotency key"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/transfers", "POST", params);
      return buildResult(data);
    }
  );

  // GET /transfers — list
  server.registerTool(
    "ashar_list_transfers",
    {
      title: "List Transfers",
      description: `List crypto transfers for the tenant, newest first.

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
      const data = await client.request(`/transfers${suffix}`, "GET");
      return buildResult(data);
    }
  );

  // GET /transfers/:id
  server.registerTool(
    "ashar_get_transfer",
    {
      title: "Get Transfer",
      description: `Get details of a single crypto transfer by its transfer_id.

Args:
  - transfer_id (string): the transfer id

Returns live status plus on-chain tx_hash when available.`,
      inputSchema: z.object({ transfer_id: z.string().describe("Transfer id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(`/transfers/${encodeURIComponent(params.transfer_id)}`, "GET");
      return buildResult(data);
    }
  );
}
