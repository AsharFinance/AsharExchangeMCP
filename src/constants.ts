/**
 * shared constants for the Ashar Exchange MCP server.
 */

/** Default public base URL of the Ashar Exchange API (Kong Gateway, strip_path). */
export const DEFAULT_API_BASE_URL = process.env.ASHAR_EXCHANGE_BASE_URL || "https://api.ashar.finance/v2";

/** Header used for tenant authentication on the Exchange API. */
export const TENANT_KEY_HEADER = "X-Ashar-Tenant-Key";

/** Default request timeout for Exchange API calls (ms). */
export const DEFAULT_TIMEOUT_MS = 30000;

/** Maximum response size in characters before truncation. */
export const CHARACTER_LIMIT = 25000;
