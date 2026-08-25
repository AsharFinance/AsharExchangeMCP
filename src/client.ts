import axios, { AxiosError, type AxiosInstance, type Method } from "axios";
import { DEFAULT_API_BASE_URL, DEFAULT_TIMEOUT_MS, TENANT_KEY_HEADER } from "./constants.js";

/**
 * Thin HTTP client for the Ashar Exchange API.
 *
 * Requests are authenticated with the tenant API key via the
 * `X-Ashar-Tenant-Key` header. The admin/provisioning endpoints are public and
 * work without a key, so the key is optional at construction time and only
 * required lazily when an operation actually needs it.
 */
export class ExchangeClient {
  private readonly http: AxiosInstance;

  constructor(opts: { baseUrl?: string; tenantKey?: string; timeoutMs?: number } = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (opts.tenantKey) {
      headers[TENANT_KEY_HEADER] = opts.tenantKey;
    }
    this.http = axios.create({
      baseURL: opts.baseUrl || DEFAULT_API_BASE_URL,
      timeout: opts.timeoutMs || DEFAULT_TIMEOUT_MS,
      headers,
    });
  }

  /**
   * Attach the tenant key to a single request. The MCP passes the key in per
   * call (from the env var) so protected endpoints are always authenticated.
   */
  buildRequest(path: string, method: Method, body: unknown, tenantKey?: string): () => Promise<unknown> {
    return async () => {
      const headers: Record<string, string> = {};
      const key = tenantKey || process.env.ASHAR_EXCHANGE_TENANT_KEY;
      if (key) {
        headers[TENANT_KEY_HEADER] = key;
      }
      try {
        const response = await this.http.request({ url: path, method, data: body, headers });
        return response.data;
      } catch (error) {
        throw ExchangeClient.describeError(error, path);
      }
    };
  }

  /**
   * Convenience wrapper around {@link buildRequest} for tools that don't need
   * to defer the request (most of them). Runs the request immediately.
   */
  async request<T = unknown>(path: string, method: Method = "GET", body?: unknown, tenantKey?: string): Promise<T> {
    const fn = this.buildRequest(path, method, body, tenantKey);
    return (await fn()) as T;
  }

  /**
   * Send a raw (non-JSON) body request, used for file uploads where the payload
   * must be passed through verbatim as binary instead of JSON.stringify'd. Uses
   * octet-stream so the proxy's raw-body upload handler captures it without the
   * global JSON parser interfering.
   */
  async requestRaw<T = unknown>(path: string, method: Method, body: Buffer, tenantKey?: string): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      Accept: "application/json",
    };
    const key = tenantKey || process.env.ASHAR_EXCHANGE_TENANT_KEY;
    if (key) {
      headers[TENANT_KEY_HEADER] = key;
    }
    try {
      const response = await this.http.request({ url: path, method, data: body, headers });
      return response.data as T;
    } catch (error) {
      throw ExchangeClient.describeError(error, path);
    }
  }

  /** Convert a raw request error into a readable, actionable message. */
  static describeError(error: unknown, path: string): Error {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      if (error.response) {
        const data = error.response.data as { error?: string; message?: string } | undefined;
        const detail = data?.message || data?.error || JSON.stringify(error.response.data);
        const hints: Record<string, string> = {
          400: "Check the request body/parameters.",
          401: "Missing or invalid X-Ashar-Tenant-Key. Check ASHAR_EXCHANGE_TENANT_KEY.",
          403: "The tenant is inactive or forbidden from this operation.",
          404: `Resource not found at '${path}'. Check the ID/path.`,
          409: "Conflict — an operation with this idempotency key is already in progress.",
          429: "Rate limited. Wait before retrying.",
          503: "Feature unavailable on this environment (e.g. wallet custody disabled).",
        };
        const hint = status ? hints[String(status)] || "" : "";
        return new Error(
          `Exchange API error (${status ?? "?"}) on method ${String(error.config?.method ?? "unknown").toUpperCase()} ${path}: ${detail}. ${hint}`
            .trim()
        );
      }
      if (error.code === "ECONNABORTED") {
        return new Error(`Exchange API request timed out on ${path}.`);
      }
      if (error.code === "ECONNREFUSED") {
        return new Error(`Exchange API not reachable at ${error.config?.baseURL}. Is the service up?`);
      }
    }
    return new Error(`Unexpected error calling Exchange API: ${error instanceof Error ? error.message : String(error)}`);
  }
}
