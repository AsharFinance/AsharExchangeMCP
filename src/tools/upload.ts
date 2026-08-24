import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExchangeClient } from "../client.js";
import { buildResult } from "../format.js";

/**
 * Ashar Exchange — upload group.
 *
 * Uploads a file (e.g. a payout document) to the tenant's instance storage.
 * White-label: only the sanitized upload id/files are returned.
 */
export function registerUploadTools(server: McpServer, client: ExchangeClient): void {
  // POST /upload — upload a file (raw binary body)
  server.registerTool(
    "ashar_upload_payout",
    {
      title: "Upload Payout File",
      description: `Upload a file (e.g. payout supporting document) to the tenant's instance.

Args:
  - filename (string): the file name (e.g. "doc.pdf")
  - mime (string, optional): the MIME type (e.g. "application/pdf")
  - file_base64 (string): the file content Base64-encoded

The server stores the binary and returns the sanitized upload id/details.`,
      inputSchema: z
        .object({
          filename: z.string().describe("File name"),
          mime: z.string().optional().describe("MIME type"),
          file_base64: z.string().describe("File content Base64-encoded"),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (params) => {
      // Send the file as a raw binary body so the proxy's express.raw() handler
      // receives it directly; name/MIME travel as query params.
      const qs = new URLSearchParams({ filename: params.filename });
      if (params.mime) qs.set("mime", params.mime);
      const base64 = params.file_base64.replace(/^data:[^;]+;base64,/, "");
      const body = Buffer.from(base64, "base64");
      const path = `/upload?${qs.toString()}`;
      // Use a raw-buffer request. The lower-level client.request sends JSON by
      // default, so build the raw request manually to preserve the binary body.
      const data = await client.requestRaw(path, "POST", body);
      return buildResult(data);
    }
  );
}
