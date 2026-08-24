import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { randomUUID } from "node:crypto";
import { ExchangeClient } from "./client.js";
import { DEFAULT_API_BASE_URL } from "./constants.js";
import { registerAllTools } from "./tools/index.js";
import { version } from "./version.js";

const SERVER_NAME = "ashar-exchange-mcp-server";

/**
 * Pick the transport from the environment. `stdio` is the default; set
 * `TRANSPORT=http` (or `ASHAR_EXCHANGE_TRANSPORT=http`) for a streamable HTTP
 * server. When using HTTP you can also set `PORT` to choose the port.
 */
function start(): void {
  const client = new ExchangeClient({
    baseUrl: process.env.ASHAR_EXCHANGE_BASE_URL || DEFAULT_API_BASE_URL,
    tenantKey: process.env.ASHAR_EXCHANGE_TENANT_KEY,
  });

  function createServer(): McpServer {
    const server = new McpServer(
      { name: SERVER_NAME, version },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );
    registerAllTools(server, client);
    return server;
  }

  const transport = (process.env.ASHAR_EXCHANGE_TRANSPORT || process.env.TRANSPORT || "stdio").toLowerCase();

  if (transport === "http" || transport === "sse") {
    const port = Number(process.env.PORT || 3001);
    const app = express();
    app.use(express.json({ limit: "10mb" }));

    // Each MCP client session gets its own server + transport, keyed by session id.
    const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>();

    app.post("/mcp", async (req, res) => {
      const sessionId = (req.headers["mcp-session-id"] as string | undefined) || randomUUID();
      try {
        let session = sessions.get(sessionId);
        if (!session) {
          const server = createServer();
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => sessionId,
          });
          await server.connect(transport);
          session = { server, transport };
          sessions.set(sessionId, session);
          transport.onclose = () => {
            sessions.delete(sessionId);
          };
        }
        // express has already parsed the JSON body; pass it to the transport.
        await session.transport.handleRequest(req, res, req.body);
      } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
      }
    });

    app.get("/mcp", async (req, res) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      const session = sessionId ? sessions.get(sessionId) : undefined;
      if (!session) {
        res.status(405).json({ error: "No active MCP session. POST /mcp with mcp-session-id to create/resume." });
        return;
      }
      try {
        await session.transport.handleRequest(req, res);
      } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
      }
    });

    app.delete("/mcp", async (req, res) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      const session = sessionId ? sessions.get(sessionId) : undefined;
      if (!session || !sessionId) {
        res.status(405).json({ error: "No active MCP session." });
        return;
      }
      await session.transport.handleRequest(req, res);
      sessions.delete(sessionId);
    });

    app.get("/health", (_req, res) => {
      res.json({ status: "ok", server: SERVER_NAME, version });
    });

    app.listen(port, () => {
      console.log(`${SERVER_NAME} ${version} listening on http://localhost:${port}/mcp`);
    });
    return;
  }

  // Default: stdio transport for CLI / MCP clients.
  const server = createServer();
  const stdioTransport = new StdioServerTransport();
  void server.connect(stdioTransport);
}

start();
