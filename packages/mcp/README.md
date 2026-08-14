# @postio/mcp

[Model Context Protocol](https://modelcontextprotocol.io) server for
[Postio](https://postio.co.uk) — the UK validation API for addresses,
emails and phone numbers, exposed as tools for any MCP-aware AI host.

> **First time?** [Sign up free](https://postio.co.uk) — first 100 lookups on us, no card needed.

Works with Claude Desktop, Claude Code, Cursor, Windsurf, Zed,
Continue, and anything else that speaks MCP over stdio.

Node 20+.

## Install

You don't, really. Use `npx` from your host's MCP config.

### Claude Code

```bash
claude mcp add postio --env POSTIO_API_KEY=pk_… -- npx -y @postio/mcp
```

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "postio": {
      "command": "npx",
      "args": ["-y", "@postio/mcp"],
      "env": { "POSTIO_API_KEY": "pk_…" }
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json` (or `<project>/.cursor/mcp.json` for project-scoped):

```json
{
  "mcpServers": {
    "postio": {
      "command": "npx",
      "args": ["-y", "@postio/mcp"],
      "env": { "POSTIO_API_KEY": "pk_…" }
    }
  }
}
```

### Windsurf / Zed / Continue

Same JSON as Cursor — they all consume the standard MCP server
config shape.

## Tools

| Tool | What it does | Billable |
|---|---|---|
| `postio_address_search` | Free-form UK address search → suggestions + UDPRNs | No |
| `postio_postcode_lookup` | All PAF delivery points at a postcode | Yes (on hit) |
| `postio_udprn_lookup` | Full record for a single UDPRN | Yes (on hit) |
| `postio_email_validate` | Syntax + typo + MX + SMTP + classification | Yes |
| `postio_phone_validate` | Parse + live HLR lookup (carrier, ported, reachable) | Yes |
| `postio_connect` | Free health probe | No |

The tools are intentionally primitive and 1:1 with the API. The
agent decides when to chain them — a typical address-finder flow
is `postio_address_search` → pick a UDPRN → `postio_udprn_lookup`
for the full record.

Each tool returns the raw API envelope as JSON text, including
`meta.requestId` for support correlation.

## Example prompts

> "Look up the address with udprn 25742215."
> → `postio_udprn_lookup` with `udprn=25742215`

> "Find addresses on Wimpole Street W1G."
> → `postio_address_search` with `query="Wimpole Street W1G"`

> "Is alice@gnail.com a real email address?"
> → `postio_email_validate` with `email="alice@gnail.com"` →
>   the response includes `didYouMean: "gmail.com"`.

> "Verify these UK phone numbers and tell me which are mobile."
> → `postio_phone_validate` per number.

## Configuration

| Env var | Purpose |
|---|---|
| `POSTIO_API_KEY` | **Required.** Your Postio API key. |
| `POSTIO_BASE_URL` | Optional override of the API base URL (default `https://api.postio.co.uk/v1`). |

A missing `POSTIO_API_KEY` is not fatal — the server still starts and
advertises its tools, so a host can list them before you've configured
credentials. Individual calls then fail with a message telling you to
set the key.

## Official MCP Registry

Listed at [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io)
as **`uk.co.postio/postcode-address-validation`**, published under a
domain-verified namespace (not a personal GitHub one).

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers/uk.co.postio%2Fpostcode-address-validation/versions/latest"
```

The listing is generated from [`server.json`](./server.json) in this
directory; the version there tracks this package's version. CI
(`publish-mcp-registry.yml`) republishes on change.

## License

MIT.
