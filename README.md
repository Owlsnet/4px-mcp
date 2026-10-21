# claude-track

An MCP connector that lets Claude track **4PX** parcels (the same data as
<https://track.4px.com>).

## Tool

`track_4px_parcel`

| arg | type | |
|---|---|---|
| `tracking_numbers` | string[] (1–100) | e.g. `["4PX3003261441657CN"]` |
| `max_events` | number, optional | only return the N most recent events per parcel |

Returns origin → destination, days in transit, the last-mile tracking number (when 4PX has
handed off to a local carrier), the latest event and the full history.

Example prompt: *"Where is my parcel 4PX3003261441657CN?"*

## Build

```bash
npm install
npm run build
```

## Use it

### Claude Desktop (local, stdio)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-track": {
      "command": "node",
      "args": ["/absolute/path/to/Claude-track/dist/index.js"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add claude-track -- node /absolute/path/to/Claude-track/dist/index.js
```

### claude.ai custom connector (remote, HTTP)

```bash
PORT=3000 npm run start:http    # serves MCP at http://localhost:3000/mcp
```

Deploy it somewhere with a public HTTPS URL (Render, Fly.io, Railway, a VPS…), then in
claude.ai go to **Settings → Connectors → Add custom connector** and enter
`https://<your-host>/mcp`.

## Notes

This uses the unofficial JSON endpoint behind 4PX's public tracking page
(`track.4px.com/track/v2/front/listTrackV3`). It needs no API key but may change without notice.
