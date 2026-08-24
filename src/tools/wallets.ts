import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

export function registerWalletTools(server: McpServer, client: ExchangeClient): void {
  // GET /wallets — list
  server.registerTool(
    "ashar_list_wallets",
    {
      title: "List Wallets",
      description: `List the tenant's custodial wallets with their balances.

No arguments. Returns an array of wallets (id, name, network, address, token, balance).`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/wallets", "GET");
      return buildResult(data);
    }
  );

  // GET /wallets/:id/balance
  server.registerTool(
    "ashar_get_wallet_balance",
    {
      title: "Get Wallet Balance",
      description: `Get the balance of a single custodial wallet.

Args:
  - wallet_id (string): the wallet id

Returns available, total, pending, and token.`,
      inputSchema: z.object({ wallet_id: z.string().describe("Wallet id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/wallets/${encodeURIComponent(params.wallet_id)}/balance`,
        "GET"
      );
      return buildResult(data);
    }
  );

  // POST /wallets — create
  server.registerTool(
    "ashar_create_wallet",
    {
      title: "Create Wallet",
      description: `Create a new custodial wallet for the tenant.

Args:
  - network (string): blockchain network for the wallet
  - name (string): wallet label
  - external_id (string, optional): external reference

Returns the created wallet.`,
      inputSchema: z
        .object({
          network: z.string().describe("Blockchain network"),
          name: z.string().describe("Wallet label/name"),
          external_id: z.string().optional().describe("External reference"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/wallets", "POST", params);
      return buildResult(data);
    }
  );
}
