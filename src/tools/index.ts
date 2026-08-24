import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExchangeClient } from "../client.js";
import { registerAdminTools } from "./admin.js";
import { registerBankAccountTools } from "./bankAccounts.js";
import { registerCustomerTools } from "./customers.js";
import { registerPayinTools } from "./payins.js";
import { registerPayoutTools } from "./payouts.js";
import { registerQuoteTools } from "./quotes.js";
import { registerStatTools } from "./stats.js";
import { registerTransferTools } from "./transfers.js";
import { registerWalletTools } from "./wallets.js";

/** Register every Ashar Exchange tool group on the given MCP server. */
export function registerAllTools(server: McpServer, client: ExchangeClient): void {
  registerQuoteTools(server, client);
  registerPayinTools(server, client);
  registerPayoutTools(server, client);
  registerTransferTools(server, client);
  registerWalletTools(server, client);
  registerBankAccountTools(server, client);
  registerStatTools(server, client);
  registerCustomerTools(server, client);
  registerAdminTools(server, client);
}
