import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

const Token = z.enum(["USDC", "USDT"]);
const Network = z.enum([
  "polygon",
  "ethereum",
  "base",
  "arbitrum",
  "solana",
  "stellar",
  "tron",
  "polygon_amoy",
]);

export function registerQuoteTools(server: McpServer, client: ExchangeClient): void {
  // =========================================================
  // POST /payin-quotes — PIX → USDC/USDT (deposit quote)
  // =========================================================
  server.registerTool(
    "ashar_create_payin_quote",
    {
      title: "Create Payin Quote",
      description: `Create a deposit (PIX -> USDC/USDT) quote for the tenant, including the Ashar platform fee markup.

Args:
  - payment_method (string): 'pix' or 'ted'
  - token (string): 'USDC' or 'USDT' (what the client receives)
  - request_amount (number, cents, >= 500 i.e. R\$ 5.00): amount in BRL cents
  - wallet_id (string, optional): destination BlindPay wallet id
  - blockchain_wallet_id (string, optional): destination blockchain wallet id
  - idempotency_key (string, optional): to safely retry

Returns:
  The marked-up quote: quote_id, request_amount, estimated_receive, fx_rate,
  expires_at, and the platform_fee breakdown.

Use before ashar_execute_payin.`,
      inputSchema: z
        .object({
          payment_method: z.enum(["pix", "ted"]).describe("PIX or TED payment method"),
          token: Token.describe("Stablecoin received by the client (USDC or USDT)"),
          request_amount: z.number().int().min(500).describe("Amount in BRL cents (e.g. 10000 = R$ 100.00)"),
          wallet_id: z.string().optional().describe("Destination BlindPay wallet id"),
          blockchain_wallet_id: z.string().optional().describe("Destination blockchain wallet id"),
          idempotency_key: z.string().optional().describe("Optional idempotency key"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/payin-quotes", "POST", params);
      return buildResult(data);
    }
  );

  // =========================================================
  // POST /payout-quotes — USDC/USDT → PIX (withdrawal quote)
  // =========================================================
  server.registerTool(
    "ashar_create_payout_quote",
    {
      title: "Create Payout Quote",
      description: `Create a withdrawal (USDC/USDT -> PIX) quote for the tenant, including the Ashar platform fee markup.

Args:
  - request_amount (number, cents, >= 500): amount in stablecoin cents
  - bank_account_id (string): destination PIX bank account id
  - token (string): stablecoin being sent ('USDC' or 'USDT')
  - network (string, optional, default 'polygon'): sending network
  - idempotency_key (string, optional)

Returns the marked-up quote: quote_id, request_amount, estimated_receive_brl,
fx_rate, expires_at, and platform_fee.

Use before ashar_execute_payout.`,
      inputSchema: z
        .object({
          request_amount: z.number().int().min(500).describe("Amount in stablecoin cents (e.g. 1000 = 10.00)"),
          bank_account_id: z.string().describe("Destination PIX bank account id"),
          token: Token.describe("Stablecoin being sent (USDC or USDT)"),
          network: Network.optional().describe("Sending network (default: polygon)"),
          idempotency_key: z.string().optional().describe("Optional idempotency key"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/payout-quotes", "POST", params);
      return buildResult(data);
    }
  );

  // =========================================================
  // POST /fx-rate — quick FX rate quote
  // =========================================================
  server.registerTool(
    "ashar_get_fx_rate",
    {
      title: "Get FX Rate",
      description: `Consult a quick FX rate (with platform markup) without creating a quote.

Args:
  - from (string): source currency ('BRL', 'USDC', or 'USDT')
  - to (string): target currency ('BRL', 'USDC', or 'USDT')
  - request_amount (number): amount in minor units
  - direction (string, optional): 'payin' (BRL -> crypto) or 'payout' (crypto -> BRL)
  - currency_type (string, optional): 'sender' or 'receiver'

Returns base_rate (BlindPay) and client_rate (after markup) plus platform_fee.`,
      inputSchema: z
        .object({
          from: z.enum(["BRL", "USDC", "USDT"]).describe("Source currency"),
          to: z.enum(["BRL", "USDC", "USDT"]).describe("Target currency"),
          request_amount: z.number().positive().describe("Amount in minor units"),
          direction: z.enum(["payin", "payout"]).optional().describe("Operation direction"),
          currency_type: z.enum(["sender", "receiver"]).optional().describe("Who the rate applies to"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/fx-rate", "POST", params);
      return buildResult(data);
    }
  );

  // =========================================================
  // POST /transfer-quotes — Crypto → Crypto
  // =========================================================
  server.registerTool(
    "ashar_create_transfer_quote",
    {
      title: "Create Transfer Quote",
      description: `Create a crypto -> crypto (cross-chain) transfer quote for the tenant.

Args:
  - wallet_id (string): source BlindPay wallet
  - request_amount (number): amount in cents
  - sender_token (string): 'USDC' or 'USDT'
  - receiver_wallet_address (string): destination address
  - receiver_token (string): 'USDC' or 'USDT'
  - receiver_network (string): destination network
  - amount_reference (string, optional): 'sender' or 'receiver'
  - cover_fees (boolean, optional, default false)

Returns quote_id, estimated_receive, fx_rate, expires_at, and platform_fee.`,
      inputSchema: z
        .object({
          wallet_id: z.string().describe("Source BlindPay wallet id"),
          request_amount: z.number().int().min(1).describe("Amount in cents"),
          sender_token: Token.describe("Stablecoin being sent"),
          receiver_wallet_address: z.string().describe("Destination wallet address"),
          receiver_token: Token.describe("Stablecoin received"),
          receiver_network: Network.describe("Destination network"),
          amount_reference: z.enum(["sender", "receiver"]).optional().describe("Reference amount type"),
          cover_fees: z.boolean().optional().describe("Whether sender covers fees (default false)"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/transfer-quotes", "POST", params);
      return buildResult(data);
    }
  );
}
