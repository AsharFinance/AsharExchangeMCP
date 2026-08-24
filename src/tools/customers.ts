import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

const CustomerType = z.enum(["individual", "business"]);
const KycType = z.string();

export function registerCustomerTools(server: McpServer, client: ExchangeClient): void {
  // GET /customers — list
  server.registerTool(
    "ashar_list_customers",
    {
      title: "List Customers",
      description: `List customers (KYC/KYB) on the tenant's instance.

Args (all optional): limit, offset, starting_after, ending_before, full_name,
customer_name, status, customer_id, country.

Returns an array of customers.`,
      inputSchema: z
        .object({
          limit: z.number().int().min(1).optional().describe("Max results"),
          offset: z.number().int().min(0).optional().describe("Pagination offset"),
          starting_after: z.string().optional().describe("Cursor: return records after this id"),
          ending_before: z.string().optional().describe("Cursor: return records before this id"),
          full_name: z.string().optional().describe("Filter by full name"),
          customer_name: z.string().optional().describe("Filter by customer name"),
          status: z.string().optional().describe("Filter by status"),
          customer_id: z.string().optional().describe("Filter by customer id"),
          country: z.string().optional().describe("Filter by country"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) qs.set(k, String(v));
      }
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const data = await client.request(`/customers${suffix}`, "GET");
      return buildResult(data);
    }
  );

  // POST /customers — create
  server.registerTool(
    "ashar_create_customer",
    {
      title: "Create Customer",
      description: `Create a customer (individual or business) for KYC/KYB.

Args:
  - type (string): 'individual' or 'business'
  - kyc_type (string): KYC tier (e.g. 'light')
  - email (string): customer email
  - country (string): two-letter country code (e.g. 'BR')
  - tax_id (string, optional): taxpayer id (e.g. CPF/CNPJ)
  - first_name, last_name (string, optional): for individuals
  - additional fields (object, optional): pass-through payload

Returns the created customer.`,
      inputSchema: z
        .object({
          type: CustomerType.describe("Customer type"),
          kyc_type: KycType.describe("KYC tier"),
          email: z.string().email().describe("Customer email"),
          country: z.string().describe("Two-letter country code"),
          tax_id: z.string().optional().describe("Taxpayer id (CPF/CNPJ)"),
          first_name: z.string().optional().describe("First name (individual)"),
          last_name: z.string().optional().describe("Last name (individual)"),
          extra: z.record(z.string(), z.unknown()).optional().describe("Additional pass-through fields"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const { extra, ...rest } = params;
      const data = await client.request("/customers", "POST", { ...rest, ...(extra || {}) });
      return buildResult(data);
    }
  );

  // GET /customers/:id
  server.registerTool(
    "ashar_get_customer",
    {
      title: "Get Customer",
      description: `Get a customer by id.

Args:
  - customer_id (string): the customer id

Returns the customer details.`,
      inputSchema: z.object({ customer_id: z.string().describe("Customer id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(`/customers/${encodeURIComponent(params.customer_id)}`, "GET");
      return buildResult(data);
    }
  );

  // PUT /customers/:id
  server.registerTool(
    "ashar_update_customer",
    {
      title: "Update Customer",
      description: `Update a customer by id.

Args:
  - customer_id (string): the customer id
  - body (object): the fields to update

Returns the updated customer.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          body: z.record(z.string(), z.unknown()).describe("Fields to update"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}`,
        "PUT",
        params.body
      );
      return buildResult(data);
    }
  );

  // DELETE /customers/:id
  server.registerTool(
    "ashar_delete_customer",
    {
      title: "Delete Customer",
      description: `Delete a customer by id.

Args:
  - customer_id (string): the customer id

Returns 204 No Content on success.`,
      inputSchema: z.object({ customer_id: z.string().describe("Customer id") }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      await client.request(`/customers/${encodeURIComponent(params.customer_id)}`, "DELETE");
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, deleted: params.customer_id }) }], structuredContent: { ok: true, deleted: params.customer_id } };
    }
  );

  // ---- Customer bank accounts ----
  server.registerTool(
    "ashar_list_customer_bank_accounts",
    {
      title: "List Customer Bank Accounts",
      description: `List a customer's bank accounts.

Args:
  - customer_id (string): the customer id

Returns an array of bank_accounts.`,
      inputSchema: z.object({ customer_id: z.string().describe("Customer id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/bank-accounts`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_create_customer_bank_account",
    {
      title: "Create Customer Bank Account",
      description: `Add a bank account to a customer.

Args:
  - customer_id (string): the customer id
  - body (object): the bank account payload

Returns the created bank account.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          body: z.record(z.string(), z.unknown()).describe("Bank account payload"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/bank-accounts`,
        "POST",
        params.body
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_delete_customer_bank_account",
    {
      title: "Delete Customer Bank Account",
      description: `Remove a customer's bank account.

Args:
  - customer_id (string): the customer id
  - bank_account_id (string): the bank account id

Returns 204 No Content on success.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          bank_account_id: z.string().describe("Bank account id"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/bank-accounts/${encodeURIComponent(params.bank_account_id)}`,
        "DELETE"
      );
      return { content: [{ type: "text", text: JSON.stringify({ ok: true }) }], structuredContent: { ok: true } };
    }
  );

  // ---- Customer blockchain wallets ----
  server.registerTool(
    "ashar_list_customer_wallets",
    {
      title: "List Customer Blockchain Wallets",
      description: `List a customer's blockchain wallets.

Args:
  - customer_id (string): the customer id

Returns an array of blockchain_wallets.`,
      inputSchema: z.object({ customer_id: z.string().describe("Customer id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/blockchain-wallets`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_create_customer_wallet",
    {
      title: "Create Customer Blockchain Wallet",
      description: `Add a blockchain wallet to a customer.

Args:
  - customer_id (string): the customer id
  - body (object): the blockchain wallet payload

Returns the created wallet.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          body: z.record(z.string(), z.unknown()).describe("Blockchain wallet payload"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/blockchain-wallets`,
        "POST",
        params.body
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_delete_customer_wallet",
    {
      title: "Delete Customer Blockchain Wallet",
      description: `Remove a customer's blockchain wallet.

Args:
  - customer_id (string): the customer id
  - wallet_id (string): the blockchain wallet id

Returns 204 No Content on success.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          wallet_id: z.string().describe("Blockchain wallet id"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/blockchain-wallets/${encodeURIComponent(params.wallet_id)}`,
        "DELETE"
      );
      return { content: [{ type: "text", text: JSON.stringify({ ok: true }) }], structuredContent: { ok: true } };
    }
  );

  // ---- Customer virtual accounts ----
  server.registerTool(
    "ashar_list_customer_virtual_accounts",
    {
      title: "List Customer Virtual Accounts",
      description: `List a customer's virtual accounts.

Args:
  - customer_id (string): the customer id

Returns an array of virtual_accounts.`,
      inputSchema: z.object({ customer_id: z.string().describe("Customer id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/virtual-accounts`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_create_customer_virtual_account",
    {
      title: "Create Customer Virtual Account",
      description: `Create a virtual account for a customer.

Args:
  - customer_id (string): the customer id
  - body (object): the virtual account payload

Returns the created virtual account.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          body: z.record(z.string(), z.unknown()).describe("Virtual account payload"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/virtual-accounts`,
        "POST",
        params.body
      );
      return buildResult(data);
    }
  );

  // ---- Customer custodial wallets (wallets linked to a customer) ----
  server.registerTool(
    "ashar_list_customer_custodial_wallets",
    {
      title: "List Customer Custodial Wallets",
      description: `List a customer's custodial (wallet) wallets.

Args:
  - customer_id (string): the customer id

Returns an array of curated wallets.`,
      inputSchema: z.object({ customer_id: z.string().describe("Customer id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/wallets`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_get_customer_custodial_wallet",
    {
      title: "Get Customer Custodial Wallet",
      description: `Get a single custodial wallet by customer id and wallet id.

Args:
  - customer_id (string): the customer id
  - wallet_id (string): the custodial wallet id

Returns the curated wallet.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          wallet_id: z.string().describe("Custodial wallet id"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/wallets/${encodeURIComponent(params.wallet_id)}`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_get_customer_custodial_wallet_balance",
    {
      title: "Get Customer Custodial Wallet Balance",
      description: `Get the balance of a customer's custodial wallet.

Args:
  - customer_id (string): the customer id
  - wallet_id (string): the custodial wallet id

Returns the sanitized balance (available/total/pending/token).`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          wallet_id: z.string().describe("Custodial wallet id"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/wallets/${encodeURIComponent(params.wallet_id)}/balance`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_create_customer_custodial_wallet",
    {
      title: "Create Customer Custodial Wallet",
      description: `Create a custodial (wallet) for a customer.

Args:
  - customer_id (string): the customer id
  - network (string): the wallet network
  - name (string): a display name for the wallet
  - external_id (string, optional): your external reference for this wallet

Returns the created wallet.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          network: z.string().describe("Wallet network"),
          name: z.string().describe("Wallet display name"),
          external_id: z.string().optional().describe("External reference id"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const { customer_id, ...payload } = params;
      const data = await client.request(
        `/customers/${encodeURIComponent(customer_id)}/wallets`,
        "POST",
        payload
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_delete_customer_custodial_wallet",
    {
      title: "Delete Customer Custodial Wallet",
      description: `Remove a customer's custodial wallet.

Args:
  - customer_id (string): the customer id
  - wallet_id (string): the custodial wallet id

Returns 204 No Content on success.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          wallet_id: z.string().describe("Custodial wallet id"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/wallets/${encodeURIComponent(params.wallet_id)}`,
        "DELETE"
      );
      return { content: [{ type: "text", text: JSON.stringify({ ok: true }) }], structuredContent: { ok: true } };
    }
  );

  // ---- Customer blockchain wallet — sign message ----
  server.registerTool(
    "ashar_sign_customer_blockchain_wallet_message",
    {
      title: "Sign Customer Blockchain Wallet Message",
      description: `Sign a message with a customer's blockchain wallet.

Args:
  - customer_id (string): the customer id
  - wallet_id (string): the blockchain wallet id
  - message (string): the message to sign

Returns the signed result.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          wallet_id: z.string().describe("Blockchain wallet id"),
          message: z.string().describe("Message to sign"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/blockchain-wallets/${encodeURIComponent(params.wallet_id)}/sign-message`,
        "POST",
        { message: params.message }
      );
      return buildResult(data);
    }
  );

  // ---- Customer bank account — offramp wallets ----
  server.registerTool(
    "ashar_list_customer_offramp_wallets",
    {
      title: "List Customer Offramp Wallets",
      description: `List a customer's offramp wallets (crypto settlement wallets for a bank account).

Args:
  - customer_id (string): the customer id
  - bank_account_id (string): the bank account id

Returns an array of offramp_wallets.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          bank_account_id: z.string().describe("Bank account id"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/bank-accounts/${encodeURIComponent(params.bank_account_id)}/offramp-wallets`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_get_customer_offramp_wallet",
    {
      title: "Get Customer Offramp Wallet",
      description: `Get a single offramp wallet by id.

Args:
  - customer_id (string): the customer id
  - bank_account_id (string): the bank account id
  - offramp_wallet_id (string): the offramp wallet id

Returns the curated offramp wallet.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          bank_account_id: z.string().describe("Bank account id"),
          offramp_wallet_id: z.string().describe("Offramp wallet id"),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/customers/${encodeURIComponent(params.customer_id)}/bank-accounts/${encodeURIComponent(params.bank_account_id)}/offramp-wallets/${encodeURIComponent(params.offramp_wallet_id)}`,
        "GET"
      );
      return buildResult(data);
    }
  );

  server.registerTool(
    "ashar_create_customer_offramp_wallet",
    {
      title: "Create Customer Offramp Wallet",
      description: `Create an offramp wallet for a customer's bank account.

Args:
  - customer_id (string): the customer id
  - bank_account_id (string): the bank account id
  - network (string): the settlement network
  - external_id (string, optional): your external reference

Returns the created offramp wallet.`,
      inputSchema: z
        .object({
          customer_id: z.string().describe("Customer id"),
          bank_account_id: z.string().describe("Bank account id"),
          network: z.string().describe("Settlement network"),
          external_id: z.string().optional().describe("External reference id"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const { customer_id, bank_account_id, ...payload } = params;
      const data = await client.request(
        `/customers/${encodeURIComponent(customer_id)}/bank-accounts/${encodeURIComponent(bank_account_id)}/offramp-wallets`,
        "POST",
        payload
      );
      return buildResult(data);
    }
  );
}
