# useqr-mcp

Generate a static QR code from any AI agent. No account. No API key.

## Connect

Use the hosted server. There is nothing to install.

```json
{
  "mcpServers": {
    "useqr": {
      "url": "https://useqr.co/api/mcp"
    }
  }
}
```

Run this package over stdio when you want the server from npm.

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

If npm cannot install the published package, run the same stdio server from GitHub.

```json
{
  "mcpServers": {
    "useqr": {
      "command": "npx",
      "args": ["-y", "github:aaronte/useqr-mcp"]
    }
  }
}
```

Some clients only spawn a command. They can still reach the hosted server.

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

This repository is the agent-facing QR generator for [useqr.co](https://useqr.co). It writes PNG or SVG locally. Styled dots, logos, and dynamic `/r/{code}` short links stay on the product site.

## CLI

```bash
npx -y useqr-mcp generate --data https://example.com --out qr.png
npx -y useqr-mcp generate --data https://example.com --format svg --out qr.svg
npx -y useqr-mcp help
```

`npx -y useqr-mcp` with no arguments starts the MCP stdio server. So does `npx -y useqr-mcp mcp`.

## Install and discovery

- npm: [`useqr-mcp`](https://www.npmjs.com/package/useqr-mcp)
- Official MCP registry name: `io.github.aaronte/useqr-mcp`
- Hosted remote: `https://useqr.co/api/mcp`
- Search: `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=useqr"`

## Tools

| Tool | What it returns |
| --- | --- |
| `generate_qr_code` | PNG image or SVG markup for any URL or text |
| `get_qr_designer_link` | Link to the free designer at useqr.co, optionally prefilled |
| `create_dynamic_qr_code` | Instructions only. Does not mint a tracked short link |

## What this is not

This is not the UseQR product app. Accounts, billing, public pages, and destination edits live at [useqr.co](https://useqr.co). See [useqr.co/mcp](https://useqr.co/mcp) for the hosted server card and product brief.

The live product card uses namespace `co.useqr/mcp`. This OSS listing uses the GitHub namespace `io.github.aaronte/useqr-mcp` and points at the same hosted remote.

## License

MIT
