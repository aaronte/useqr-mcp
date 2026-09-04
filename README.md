# useqr-mcp

Generate a static QR code from any AI agent. No account. No API key.

```bash
npx -y useqr-mcp generate --data https://example.com --out qr.png
```

This repository is the agent-facing QR generator for [useqr.co](https://useqr.co). It writes PNG or SVG locally. Styled dots, logos, and dynamic `/r/{code}` short links stay on the product site.

## Install and discovery

- npm: [`useqr-mcp`](https://www.npmjs.com/package/useqr-mcp)
- Official MCP registry name: `io.github.aaronte/useqr-mcp`
- Search: `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=useqr"`

```bash
npx -y useqr-mcp
```

No arguments (or `mcp`) starts the stdio MCP server. Source install still works: `npx -y github:aaronte/useqr-mcp`.

## MCP

Stdio (works in Cursor, Claude, Copilot, and other clients that spawn a command):

```json
{
  "mcpServers": {
    "useqr": {
      "command": "npx",
      "args": ["-y", "useqr-mcp"]
    }
  }
}
```

Hosted Streamable HTTP (same tools, nothing to install):

```json
{
  "mcpServers": {
    "useqr": {
      "url": "https://useqr.co/api/mcp"
    }
  }
}
```

stdio-only clients can wrap the hosted server with [`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```json
{
  "mcpServers": {
    "useqr": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://useqr.co/api/mcp"]
    }
  }
}
```

## Tools

| Tool | What it returns |
| --- | --- |
| `generate_qr_code` | PNG image or SVG markup for any URL or text |
| `get_qr_designer_link` | Link to the free designer at useqr.co, optionally prefilled |
| `create_dynamic_qr_code` | Instructions only. Does not mint a tracked short link |

## CLI

```bash
npx -y useqr-mcp generate --data https://example.com --format svg --out qr.svg
npx -y useqr-mcp help
```

`npx -y useqr-mcp` with no arguments starts the MCP stdio server.

## What this is not

This is not the UseQR product app. Accounts, billing, public pages, and destination edits live at [useqr.co](https://useqr.co). See [useqr.co/mcp](https://useqr.co/mcp) for the hosted server card and product brief.

## License

MIT
