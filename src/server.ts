import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatParcel, trackParcels } from "./fourpx.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "4px-mcp", version: "0.1.0" });

  server.registerTool(
    "track_4px_parcel",
    {
      title: "Track 4PX parcel",
      description:
        "Look up the shipping status and full event history of one or more 4PX parcels " +
        "(tracking numbers like 4PX3003261441657CN, or the last-mile/partner numbers 4PX also accepts).",
      inputSchema: {
        tracking_numbers: z
          .array(z.string().min(1))
          .min(1)
          .max(100)
          .describe("Tracking numbers to look up"),
        max_events: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Limit the history to the N most recent events per parcel"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ tracking_numbers, max_events }) => {
      try {
        const parcels = await trackParcels(tracking_numbers);
        return {
          content: [
            { type: "text", text: parcels.map((p) => formatParcel(p, max_events)).join("\n\n---\n\n") },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Tracking lookup failed: ${(err as Error).message}` }],
        };
      }
    },
  );

  return server;
}
