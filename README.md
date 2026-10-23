#  4px-mcp

Ask Claude where your **4PX** parcel is.

> **You:** Where is my parcel 4PX3003261441657CN?
>
> **Claude:** It's on its way from China to the UAE. The flight landed on Oct 20 at 21:05, and it's been in transit for 7 days…

4px-mcp is a small [MCP](https://modelcontextprotocol.io) connector that gets live tracking data from
[track.4px.com](https://track.4px.com). It runs **free and always on** with Cloudflare Workers, so there
are no servers to pay for and no computer to leave on.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Owlsnet/4px-mcp)

## Set up (about 5 minutes, free)

1. Click **Deploy to Cloudflare** above. Sign in or create a free Cloudflare account (no credit card
   needed), then click **Deploy**.
2. When it finishes, copy your Worker's URL. It looks like
   `https://4px-mcp.<your-name>.workers.dev`.
3. On [claude.ai](https://claude.ai), open **Settings → Connectors → Add custom connector** and paste
   that URL with **`/mcp`** on the end:

   ```
   https://4px-mcp.<your-name>.workers.dev/mcp
   ```

That's it. The connector then works in Claude on the web, desktop and mobile.

Cloudflare's free plan covers 100,000 requests a day, and each parcel lookup is one request.

## What Claude gets

One tool, `track_4px_parcel`:

| Input | Description |
|---|---|
| `tracking_numbers` | 1–100 tracking numbers, e.g. `["4PX3003261441657CN"]` |
| `max_events` *(optional)* | Only return the N most recent events per parcel |

For each parcel it returns the route, days in transit, the latest event, the full event history and,
once 4PX hands the parcel to a local carrier, that carrier's tracking number.

## Run locally instead (optional)

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/Owlsnet/4px-mcp.git
cd 4px-mcp
npm install
npm run build
```

**Claude Code**

```bash
claude mcp add 4px-mcp -- node /absolute/path/to/4px-mcp/dist/index.js
```

**Claude Desktop**: add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "4px-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/4px-mcp/dist/index.js"]
    }
  }
}
```

## Development

| Command | What it does |
|---|---|
| `npm run dev` | Run the Worker locally at `http://localhost:8787/mcp` |
| `npm run deploy` | Deploy to your Cloudflare account (`npx wrangler login` first) |
| `npm run typecheck` | Type-check the project |

```
src/
├── fourpx.ts   4PX tracking client and output formatting
├── server.ts   MCP server and the track_4px_parcel tool
├── worker.ts   Cloudflare Workers entry point (HTTP)
└── index.ts    Local entry point (stdio)
```

## Notes

4PX doesn't offer a public tracking API, so this uses the same endpoint as their tracking website. It
needs no API key, but 4PX could change it without notice.

## License

[MIT](LICENSE)
