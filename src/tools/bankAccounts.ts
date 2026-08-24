import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

export function registerBankAccountTools(server: McpServer, client: ExchangeClient): void {
  // GET /bank-accounts — list
  server.registerTool(
    "ashar_list_bank_accounts",
    {
      title: "List Bank Accounts",
      description: `List the tenant's PIX/TED bank accounts.

No arguments. Returns an array of bank_accounts (id, bank_name, pix_key, status).`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/bank-accounts", "GET");
      return buildResult(data);
    }
  );

  // POST /bank-accounts — register
  server.registerTool(
    "ashar_create_bank_account",
    {
      title: "Create Bank Account",
      description: `Register a PIX/TED bank account for the tenant.

Args:
  - body (object): the bank account payload (e.g. pix_key, bank_name, holder name/document, account details) accepted by the Exchange API

Returns the created bank account.`,
      inputSchema: z
        .object({
          body: z.record(z.string(), z.unknown()).describe("Bank account payload for PIX/TED"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/bank-accounts", "POST", params.body);
      return buildResult(data);
    }
  );

  // DELETE /bank-accounts/:id
  server.registerTool(
    "ashar_delete_bank_account",
    {
      title: "Delete Bank Account",
      description: `Remove a PIX/TED bank account.

Args:
  - bank_account_id (string): the account id

Returns { deleted: true }.`,
      inputSchema: z.object({ bank_account_id: z.string().describe("Bank account id") }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/bank-accounts/${encodeURIComponent(params.bank_account_id)}`,
        "DELETE"
      );
      return buildResult(data);
    }
  );
}
