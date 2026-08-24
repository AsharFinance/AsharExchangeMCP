import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

export function registerStatTools(server: McpServer, client: ExchangeClient): void {
  // GET /stats/daily
  server.registerTool(
    "ashar_get_daily_stats",
    {
      title: "Get Daily Stats",
      description: `Get today's volume and platform fees for the tenant across payins and payouts.

No arguments. Returns count, volume_brl, and platform_fee_brl broken down by payin/payout plus the day total.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/stats/daily", "GET");
      return buildResult(data);
    }
  );

  // GET /stats/monthly
  server.registerTool(
    "ashar_get_monthly_stats",
    {
      title: "Get Monthly Stats",
      description: `Get the current month's volume and platform fees for the tenant across payins and payouts.

No arguments. Returns count, volume_brl, and platform_fee_brl broken down by payin/payout plus the month total.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/stats/monthly", "GET");
      return buildResult(data);
    }
  );

  // GET /stats/rates
  server.registerTool(
    "ashar_get_fee_rates",
    {
      title: "Get Fee Rates",
      description: `Get the current platform fee rates and limits applied to the tenant.

No arguments. Returns the tenant fees (payin/payout/transfer spreads and fixed fees) and daily/monthly volume limits in BRL.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/stats/rates", "GET");
      return buildResult(data);
    }
  );
}
