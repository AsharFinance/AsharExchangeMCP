import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

export function registerAdminTools(server: McpServer, client: ExchangeClient): void {
  // POST /admin/provision-test-tenant
  server.registerTool(
    "ashar_provision_test_tenant",
    {
      title: "Provision Test Tenant",
      description: `Create a sandbox tenant with a fresh X-Ashar-Tenant-Key. This is an ADMIN operation (public endpoint on the API).

Args:
  - display_name (string): company or tester name
  - email (string): primary contact email
  - cc_email (string, optional): CC email
  - kyc_type (string, optional, default 'light')
  - country (string, optional, default 'BR')
  - customer_type (string, optional, default 'individual')
  - limit_daily_brl (number, optional): daily BRL volume limit in cents (default 1000000)
  - limit_monthly_brl (number, optional): monthly BRL volume limit in cents (default 30000000)
  - blindpay_instance_id / blindpay_api_key / blindpay_receiver_id / blindpay_base_url (optional): an isolated upstream credential for the tenant (the API key is encrypted at rest)

Returns the provisioned tenant, its minted api_key, and base_url.`,
      inputSchema: z
        .object({
          display_name: z.string().describe("Company or tester name"),
          email: z.string().email().describe("Primary contact email"),
          cc_email: z.string().optional().describe("CC email"),
          kyc_type: z.string().optional().describe("KYC tier (default 'light')"),
          country: z.string().optional().describe("Country code (default 'BR')"),
          customer_type: z.string().optional().describe("individual or business"),
          limit_daily_brl: z.number().int().optional().describe("Daily BRL limit in cents"),
          limit_monthly_brl: z.number().int().optional().describe("Monthly BRL limit in cents"),
          blindpay_instance_id: z.string().optional().describe("Isolated upstream instance id"),
          blindpay_api_key: z.string().optional().describe("Isolated upstream API key (encrypted at rest)"),
          blindpay_receiver_id: z.string().optional().describe("Isolated upstream receiver id"),
          blindpay_base_url: z.string().optional().describe("Isolated upstream base url"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request("/admin/provision-test-tenant", "POST", params);
      return buildResult(data);
    }
  );

  // GET /admin/test-tenants
  server.registerTool(
    "ashar_list_test_tenants",
    {
      title: "List Test Tenants",
      description: `List all provisioned sandbox tenants. ADMIN operation.

No arguments. Returns the list of sandbox_tenants with their API key prefixes.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = await client.request("/admin/test-tenants", "GET");
      return buildResult(data);
    }
  );

  // GET /admin/tenants/:id/credentials
  server.registerTool(
    "ashar_get_tenant_credentials",
    {
      title: "List Tenant Credentials",
      description: `List the (masked) upstream credentials metadata of a tenant. ADMIN operation. The upstream API key is never exposed.

Args:
  - tenant_id (string): the tenant id

Returns credential metadata (instance_id, api_key_prefix, receiver_id, is_active).`,
      inputSchema: z.object({ tenant_id: z.string().describe("Tenant id") }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/admin/tenants/${encodeURIComponent(params.tenant_id)}/credentials`,
        "GET"
      );
      return buildResult(data);
    }
  );

  // PUT /admin/tenants/:id/credentials
  server.registerTool(
    "ashar_rotate_tenant_credentials",
    {
      title: "Create/Rotate Tenant Credentials",
      description: `Create or rotate the upstream credential of a tenant. ADMIN operation.

Args:
  - tenant_id (string): the tenant id
  - blindpay_api_key (string, optional): new upstream API key (encrypted at rest). If omitted, only metadata is updated where possible.
  - blindpay_instance_id, blindpay_receiver_id, blindpay_base_url (string, optional): upstream metadata
  - label (string, optional, default 'production')

Returns the rotated credential metadata.`,
      inputSchema: z
        .object({
          tenant_id: z.string().describe("Tenant id"),
          label: z.string().optional().describe("Credential label (default 'production')"),
          blindpay_instance_id: z.string().optional().describe("Upstream instance id"),
          blindpay_api_key: z.string().optional().describe("New upstream API key"),
          blindpay_receiver_id: z.string().optional().describe("Upstream receiver id"),
          blindpay_base_url: z.string().optional().describe("Upstream base url"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      const { tenant_id, ...body } = params;
      const data = await client.request(
        `/admin/tenants/${encodeURIComponent(tenant_id)}/credentials`,
        "PUT",
        body
      );
      return buildResult(data);
    }
  );

  // DELETE /admin/tenants/:id/credentials
  server.registerTool(
    "ashar_delete_tenant_credentials",
    {
      title: "Delete Tenant Credentials",
      description: `Remove the upstream credentials of a tenant (falls back to the global credential). ADMIN operation.

Args:
  - tenant_id (string): the tenant id

Returns { status: 'deleted', count }.`,
      inputSchema: z.object({ tenant_id: z.string().describe("Tenant id") }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await client.request(
        `/admin/tenants/${encodeURIComponent(params.tenant_id)}/credentials`,
        "DELETE"
      );
      return buildResult(data);
    }
  );
}
