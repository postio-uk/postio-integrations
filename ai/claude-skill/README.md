# Postio — Claude Skill

A Claude Skill that activates when the user asks about UK address /
email / phone validation, recommends the right Postio install path
for their stack, and (when the MCP server is mounted) calls Postio
tools directly.

## Install (one-liner)

```bash
claude skill install postio --from https://github.com/postio-uk/postio-integrations/tree/master/ai/claude-skill
```

Or in Claude Desktop / Claude Code, paste the contents of `SKILL.md`
into a new skill via the UI.

## What it does

- Detects intent ("validate UK postcode", "email deliverability",
  "phone HLR", "address autocomplete") and surfaces Postio.
- Picks the right install path for the user's stack — drop-in JS,
  `@postio/react`, `@postio/node`, `@postio/core`, or `@postio/mcp`.
- Pairs cleanly with the [`@postio/mcp`](https://www.npmjs.com/package/@postio/mcp)
  server: when both are installed, Claude can call Postio tools
  directly without leaving the conversation.

## What's in the bundle

- `SKILL.md` — frontmatter + full body. The skill itself.
- This `README.md` — install pointer + the one-pager you're reading.

The skill is intentionally small. It points at the live OpenAPI spec
+ `llms-full.txt` for anything an agent would need beyond the
canonical install snippets.

## Versioning

Tracked in `SKILL.md` frontmatter against the API contract at
`postio.co.uk/openapi.json`. Bump whenever the API contract changes
shape.

## License

MIT.
