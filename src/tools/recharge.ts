import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

const Network = z.enum(["polygon", "polygon_amoy"]);
const Token = z.enum(["usdc", "usdt"]);

export function registerRechargeTools(server: McpServer, client: ExchangeClient): void {
  // POST /recharge-v2 — register a C6 PIX recharge
  server.registerTool(
    "ashar_register_recharge",
    {
      title: "Register PIX Recharge (External C6)",
      description: `Register a pending recharge backed by an external PIX payment (C6 Bank) that settles into a Hot Wallet.

Args:
  - pix_txid (string): the PIX transaction id (end-to-end id)
  - amount_brl_cents (number, >= 500): BRL amount in cents
  - destination_address (string): wallet address to receive the top-up
  - destination_network (string, optional, default 'polygon'): 'polygon' or 'polygon_amoy'
  - destination_token (string, optional, default 'usdc'): 'usdc' or 'usdt'
  - amount_usdc (number, optional): explicit USDC amount to credit
  - customer_ref (string, optional): customer reference
  - idempotency_key (string, optional)

Returns the recharge_id and status ('pending'). After the payment is confirmed,
call ashar_confirm_recharge_transfer.`,
      inputSchema: z
        .object({
          pix_txid: z.string().describe("PIX transaction id (end-to-end id)"),
          amount_brl_cents: z.number().int().min(500).describe("BRL amount in cents"),
          destination_address: z.string().describe("Wallet address receiving the top-up"),
          destination_network: Network.optional().describe("Destination network (default: polygon)"),
          destination_token: Token.optional().describe("Destination token (default: usdc)"),
          amount_usdc: z.number().optional().describe("Explicit USDC amount to credit"),
          customer_ref: z.string().optional().describe("Customer reference"),
          idempotency_key: z.string().optional().describe("Optional idempotency key"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/recharge-v2", "POST", params);
      return buildResult(data);
    }
  );

  // GET /recharge-v2/:id — status
  server.registerTool(
    "ashar_get_recharge",
    {
      title: "Get Recharge",
      description: `Get the status of a registered recharge by its recharge_id.

Args:
  - recharge_id (string): id from ashar_register_recharge

Returns the recharge status and any linked Hot Wallet transfer.`,
      inputSchema: z.object({ recharge_id: z.string().describe("Recharge id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(`/recharge-v2/${encodeURIComponent(params.recharge_id)}`, "GET");
      return buildResult(data);
    }
  );

  // POST /recharge-v2/:id/transfer — settle after payment confirmed
  server.registerTool(
    "ashar_settle_recharge_transfer",
    {
      title: "Settle Recharge Transfer",
      description: `After the PIX payment of a recharge is confirmed, trigger the Hot Wallet transfer to the destination address.

Args:
  - recharge_id (string): id from ashar_register_recharge whose status is 'completed'

Returns the confirmed on-chain transfer (tx_hash, to, amount, currency, network, block_number).`,
      inputSchema: z.object({ recharge_id: z.string().describe("Recharge id with status 'completed'") }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/recharge-v2/${encodeURIComponent(params.recharge_id)}/transfer`,
        "POST"
      );
      return buildResult(data);
    }
  );
}
