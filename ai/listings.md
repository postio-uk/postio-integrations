# AI / MCP directory submissions — checklist

Postio is buildable + installable today. These are the public
directories worth submitting to so devs find us when browsing.

Each row is a one-time PR or form submission. Track status here.

| Directory | Type | Status | Submission method |
|---|---|---|---|
| [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | Curated GitHub list (86k★) | ◐ PR open: [#5689](https://github.com/punkpeye/awesome-mcp-servers/pull/5689) | Filed 2026-05-01 under Location Services with 🤖🤖🤖 fast-track marker |
| [mcp.so](https://mcp.so) | Hosted directory | □ pending | Submit form on site |
| [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | Hosted directory | □ pending | Submit form on site |
| [Cursor MCP "Add to Cursor"](https://cursor.com/learn/mcp) | One-click install button | □ pending | Generate + share https://cursor.com/install-mcp URL |
| [Anthropic Skills marketplace](https://docs.claude.com/en/docs/claude-skills) | Anthropic-hosted | □ pending | Submission flow per Anthropic docs |
| [OpenAI Plugin Store](https://platform.openai.com/docs/plugins) | Largely deprecated | ⚠ defer | Manifest already at `postio.co.uk/.well-known/ai-plugin.json` if any host crawls |
| [Smithery](https://smithery.ai) | MCP registry | □ pending | Submit via web UI |

## Canonical submission text — paste into each form

**Name**: Postio

**Tagline**: UK address, email, and phone validation — direct Royal Mail PAF.

**One-line description**: Postio is a UK validation API. Search
addresses, look up postcodes, validate emails (with deliverability),
validate phones (with live HLR carrier lookup). All endpoints are
GET, all return the same JSON envelope.

**Tools / endpoints**:

- `postio_address_search` — UK address typeahead search
- `postio_postcode_lookup` — every PAF delivery point at a postcode
- `postio_udprn_lookup` — full record by Royal Mail UDPRN
- `postio_email_validate` — syntax + typo + MX + SMTP + classification
- `postio_phone_validate` — parse + live HLR (carrier, ported, reachable)
- `postio_connect` — health probe / warm-up

**Install**:

```bash
claude mcp add postio --env POSTIO_API_KEY=pk_… -- npx -y @postio/mcp
```

**Configuration JSON** (Claude Desktop / Cursor / Windsurf / Zed):

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

**Repository**: https://github.com/postio-uk/postio-integrations/tree/master/packages/mcp

**npm**: https://www.npmjs.com/package/@postio/mcp

**Homepage**: https://postio.co.uk

**License**: MIT

**Tags**: validation, uk, address, postcode, email, phone, paf, royal-mail, hlr, deliverability

**Logo / icon**: https://postio.co.uk/assets/logo-mark.svg

**Author / contact**: admin@postio.co.uk

## After submission

When each one lands, flip the status here from `□ pending` to `■
listed (<date>) — <listing URL>` so we can audit periodically.
