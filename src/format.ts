/**
 * Shared helpers for building tool responses.
 *
 * Keeps response formatting consistent across tools (JSON text + structured
 * content) and centralizes truncation to avoid overwhelming the agent context.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CHARACTER_LIMIT } from "./constants.js";

/**
 * Build an MCP tool result with both a JSON text representation and
 * structured content, truncating oversized payloads.
 */
export function buildResult(data: unknown): CallToolResult {
  const json = JSON.stringify(data, null, 2);
  const truncated = json.length > CHARACTER_LIMIT;
  const text = truncated ? JSON.stringify(data, replacer, 2) : json;

  const structuredContent =
    data !== null && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : { value: data };

  return {
    content: [{ type: "text", text }],
    structuredContent,
  };
}

// Truncate long strings/arrays when the payload would exceed the limit.
function replacer(key: string, value: unknown): unknown {
  if (typeof value === "string" && value.length > 5000) {
    return `${value.slice(0, 5000)}…[truncated]`;
  }
  return value;
}

/** Build a result for a tool whose operation has no meaningful body. */
export function ok(message: string): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify({ ok: true, message }) }], structuredContent: { ok: true, message } };
}
