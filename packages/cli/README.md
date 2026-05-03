# @postio/cli

Postio command-line interface — UK address, email, and phone validation
from your terminal.

```bash
npx -y @postio/cli address postcode SW1A1AA
```

## Install

```bash
# zero-install (recommended for occasional use)
npx -y @postio/cli <command>

# global
npm i -g @postio/cli
postio <command>
```

Requires Node 20+.

## Auth

Set your Postio API key in the environment:

```bash
export POSTIO_API_KEY=pk_live_…
```

Or pass `--api-key pk_live_…` on each invocation.

Get a key at https://postio.co.uk/dashboard/api-keys.

## Usage

```
postio address search <query>        Free-text address autocomplete
postio address postcode <postcode>   Look up addresses for a postcode
postio address udprn <udprn>         Look up a single address by UDPRN
postio email <address>               Validate an email address
postio phone <number>                Validate a phone number
postio connect                       Smoke-test your API key
```

### Examples

```bash
postio connect
postio address postcode SW1A1AA
postio address search "10 downing"
postio address udprn 26280578
postio email someone@example.com
postio phone +447700900123
```

### Flags

- `--api-key <key>` — Postio API key. Defaults to `$POSTIO_API_KEY`.
- `--base-url <url>` — API base URL. Defaults to `$POSTIO_BASE_URL` or `https://api.postio.co.uk/v1`.
- `--max <n>` — Max results (search / postcode).
- `--json` — Print the raw API envelope (jq-friendly).
- `--quiet` — Print only the headline result.
- `--no-color` — Disable ANSI colour output (also auto-detected for non-TTY stdout and `NO_COLOR`).

### Stdin streaming

Pass `-` as the positional argument to stream queries from stdin, one
per line:

```bash
cat postcodes.txt | postio address postcode -
echo "alice@example.com\nbob@example.com" | postio email -
```

### Exit codes

- `0` — success
- `1` — API returned a business / validation error (e.g. `address_not_found`)
- `2` — network error, timeout, auth failure, missing API key
- `64` — bad CLI usage

Useful for shell scripting:

```bash
if postio connect --quiet; then
  echo "key works"
fi
```

## Source

https://github.com/postio-uk/postio-integrations/tree/master/packages/cli

## Licence

MIT.
