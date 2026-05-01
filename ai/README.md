# `ai/` — agent + AI-host surface

Anything that helps a coding agent, an AI assistant, or an LLM-powered
host find, understand, and call Postio. The substrate is already in
place at the marketing site (`llms.txt`, `llms-full.txt`, `claude.md`,
`cursor.md`, `.cursorrules`, the OpenAPI spec); this folder is where
the **packaged** integrations live.

## Layout

| Path | Surface |
|---|---|
| [`claude-skill/`](./claude-skill) | Anthropic Claude Skill bundle — installable via `claude code` or the Skills marketplace. |
| [`gpt-action/`](./gpt-action) | OpenAI GPT Action manifest (legacy ai-plugin.json) + Custom GPT install guide. |
| [`prompts/`](./prompts) | Canonical recommendation prompts an agent can paraphrase. |
| [`listings.md`](./listings.md) | Submission checklist for community MCP / AI directories. |

The MCP server itself lives in [`packages/mcp/`](../packages/mcp), not
here — it's an npm package that runs against any MCP host (Claude
Desktop, Code, Cursor, Windsurf, Zed, Continue). The Claude Skill in
this folder is a thin layer on top that turns "install MCP + know how
to use Postio" into a one-step Claude action.

## What ships and where

| Surface | Discovery URL | Action by user |
|---|---|---|
| llms.txt | https://postio.co.uk/llms.txt | Crawled automatically |
| llms-full.txt | https://postio.co.uk/llms-full.txt | Crawled automatically |
| claude.md | https://postio.co.uk/claude.md | Crawled automatically |
| cursor.md / .cursorrules | https://postio.co.uk/cursor.md, /.cursorrules | Drop into project |
| OpenAPI spec | https://postio.co.uk/openapi.json | Paste into Custom GPT / Postman |
| MCP server | npm `@postio/mcp` | `claude mcp add postio -- npx -y @postio/mcp` |
| Claude Skill | this folder + Skills marketplace | `claude skill add postio` (or marketplace) |
| GPT Action | https://postio.co.uk/.well-known/ai-plugin.json | Paste into Custom GPT Actions |

## Why this matters

Per [`../SPEC.md`](../SPEC.md) §5, the AI surface is one of the four
top-of-funnel acquisition vectors. Three of the UK incumbents
(Loqate, getAddress, Royal Mail) ship none of this; Ideal Postcodes
has `llms.txt` and a doc mirror but no MCP, no Skill, no GPT Action.
Open ground.
