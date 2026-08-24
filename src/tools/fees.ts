import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

/**
 * Ashar Exchange — rails & fees group.
 *
 * Mirrors the BlindPay "rails / billing-fees / partner-fees" surface but stays
 * 100% white-label: every call goes through the Ashar Exchange API
 * (`X-Ashar-Tenant-Key`), and only sanitized fields are returned.
 */
export function registerFeeTools(server: McpServer, client: ExchangeClient): void {
  // GET /rails — available rails / payment methods
  server.registerTool(
    "ashar_get_available_rails",
    {
      title: "Get Available Rails",
      description: `List the payment rails (methods/channels) available to the tenant's instance.

No arguments. Returns an array of rails (e.g. pix, ted).`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/rails", "GET");
      return buildResult(data);
    }
  );

  // GET /fees/billing — billing fees
  server.registerTool(
    "ashar_get_billing_fees",
    {
      title: "Get Billing Fees",
      description: `Get the instance billing fees (flat fees per rail, e.g. pix_fee, ted_fee).

No arguments. Returns a sanitized list of billing_fees.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/fees/billing", "GET");
      return buildResult(data);
    }
  );

  // GET /fees/partner-fees — list partner fees
  server.registerTool(
    "ashar_list_partner_fees",
    {
      title: "List Partner Fees",
      description: `List the tenant's partner fee schedules (spread/fixed fees applied on payins and payouts).

No arguments. Returns a sanitized list of partner_fees.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/fees/partner-fees", "GET");
      return buildResult(data);
    }
  );

  // GET /fees/partner-fees/:id — get one partner fee
  server.registerTool(
    "ashar_get_partner_fee",
    {
      title: "Get Partner Fee",
      description: `Get a single partner fee schedule by id.

Args:
  - fee_id (string): the partner fee id

Returns the sanitized fee schedule.`,
      inputSchema: z.object({ fee_id: z.string().describe("Partner fee id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(`/fees/partner-fees/${encodeURIComponent(params.fee_id)}`, "GET");
      return buildResult(data);
    }
  );

  // POST /fees/partner-fees — create partner fee
  server.registerTool(
    "ashar_create_partner_fee",
    {
      title: "Create Partner Fee",
      description: `Create a partner fee schedule for the tenant.

Args:
  - name (string): fee schedule name
  - payout_percentage_fee (number, optional): percentage fee on payouts (e.g. 0.5 for 0.5%)
  - payout_flat_fee (number, optional): fixed fee on payouts
  - payin_percentage_fee (number, optional): percentage fee on payins
  - payin_flat_fee (number, optional): fixed fee on payins
  - virtual_account_set (string, optional): virtual account set this fee applies to

Returns the created partner fee.`,
      inputSchema: z
        .object({
          name: z.string().describe("Fee schedule name"),
          payout_percentage_fee: z.number().optional().describe("Percentage fee on payouts"),
          payout_flat_fee: z.number().optional().describe("Fixed fee on payouts"),
          payin_percentage_fee: z.number().optional().describe("Percentage fee on payins"),
          payin_flat_fee: z.number().optional().describe("Fixed fee on payins"),
          virtual_account_set: z.string().optional().describe("Virtual account set id"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/fees/partner-fees", "POST", params);
      return buildResult(data);
    }
  );

  // DELETE /fees/partner-fees/:id — delete partner fee
  server.registerTool(
    "ashar_delete_partner_fee",
    {
      title: "Delete Partner Fee",
      description: `Remove a partner fee schedule by id.

Args:
  - fee_id (string): the partner fee id

Returns 204 No Content on success.`,
      inputSchema: z.object({ fee_id: z.string().describe("Partner fee id") }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      await client.request(`/fees/partner-fees/${encodeURIComponent(params.fee_id)}`, "DELETE");
      return { content: [{ type: "text", text: JSON.stringify({ ok: true }) }], structuredContent: { ok: true } };
    }
  );
}
