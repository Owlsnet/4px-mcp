#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { createServer } from "./server.js";

async function runHttp(port: number) {
  const app = express();
  app.use(express.json());

  // Stateless: a fresh server + transport per request.
  app.post("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
  app.all("/mcp", (_req, res) => {
    res.status(405).set("Allow", "POST").json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  });
  app.get("/", (_req, res) => {
    res.send("claude-track MCP server. Endpoint: /mcp");
  });

  app.listen(port, () => console.error(`claude-track listening on http://localhost:${port}/mcp`));
}

if (process.argv.includes("--http")) {
  await runHttp(Number(process.env.PORT ?? 3000));
} else {
  await createServer().connect(new StdioServerTransport());
}
