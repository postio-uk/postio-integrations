#!/usr/bin/env node
import { Postio, PostioError } from "@postio/node";
import type {
  AddressSearchEnvelope,
  AddressSearchResult,
  AddressPostcodeEnvelope,
  AddressUdprnEnvelope,
  EmailEnvelope,
  EmailResult,
  PhoneEnvelope,
  PhoneResult,
  ConnectSuccess,
  Address,
  Performance,
} from "@postio/node";
import { createInterface } from "node:readline";

const VERSION = "0.1.0";

// Exit codes follow sysexits.h conventions where applicable.
const EXIT_OK = 0;
const EXIT_API_ERROR = 1; // business / validation error from API
const EXIT_TRANSPORT = 2; // network, timeout, auth, missing key
const EXIT_USAGE = 64; // bad CLI args

// ── ANSI colour helpers ──────────────────────────────────────────────
// Respect NO_COLOR (https://no-color.org) and non-TTY stdout.
const colorEnabled =
  process.stdout.isTTY === true && process.env["NO_COLOR"] === undefined;

function paint(code: string, s: string): string {
  return colorEnabled ? `\x1b[${code}m${s}\x1b[0m` : s;
}
const dim = (s: string) => paint("2", s);
const bold = (s: string) => paint("1", s);
const green = (s: string) => paint("32", s);
const red = (s: string) => paint("31", s);
const yellow = (s: string) => paint("33", s);
const cyan = (s: string) => paint("36", s);

// ── Argv parsing ──────────────────────────────────────────────────────
interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }
      const name = arg.slice(2);
      const next = argv[i + 1];
      // Booleans: --json, --quiet, --help, --version, --no-color
      if (
        name === "json" ||
        name === "quiet" ||
        name === "help" ||
        name === "version" ||
        name === "no-color"
      ) {
        flags[name] = true;
      } else if (next !== undefined && !next.startsWith("-")) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else if (arg.startsWith("-") && arg.length > 1 && arg !== "-") {
      const short = arg.slice(1);
      if (short === "h") flags["help"] = true;
      else if (short === "v") flags["version"] = true;
      else {
        // Unknown short flag — treat as positional to avoid swallowing data.
        positionals.push(arg);
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

// ── Help ──────────────────────────────────────────────────────────────
const HELP = `${bold("postio")} — UK address, email, and phone validation from your terminal

${bold("USAGE")}
  postio <command> [args] [flags]

${bold("COMMANDS")}
  address search <query>        Free-text address autocomplete
  address postcode <postcode>   Look up addresses for a postcode
  address udprn <udprn>         Look up a single address by UDPRN
  email <address>               Validate an email address
  phone <number>                Validate a phone number (UK or E.164)
  connect                       Smoke-test your API key

${bold("FLAGS")}
  --api-key <key>     Postio API key. Defaults to $POSTIO_API_KEY.
  --base-url <url>    API base URL. Defaults to $POSTIO_BASE_URL or
                      https://api.postio.co.uk/v1.
  --max <n>           Max results (search / postcode). Default 10.
  --json              Print the raw API envelope (jq-friendly).
  --quiet             Print only the headline result.
  --no-color          Disable ANSI colour output.
  -h, --help          Show this help.
  -v, --version       Print CLI version.

${bold("STDIN")}
  Pass ${cyan("-")} as the positional arg to stream queries from stdin,
  one per line. Useful for batch lookups:

    cat postcodes.txt | postio address postcode -

${bold("EXIT CODES")}
  0  success
  1  API returned a business / validation error
  2  network, timeout, auth, or missing key
  64 bad CLI usage

${bold("DOCS")}
  https://postio.co.uk/integrations/cli
`;

// ── Client setup ──────────────────────────────────────────────────────
function buildClient(flags: Record<string, string | boolean>): Postio {
  const apiKey =
    typeof flags["api-key"] === "string"
      ? flags["api-key"]
      : process.env["POSTIO_API_KEY"];
  if (!apiKey) {
    process.stderr.write(
      red("error: no API key.") +
        "\n  Set " +
        cyan("POSTIO_API_KEY") +
        " in your environment or pass " +
        cyan("--api-key") +
        ".\n  Get a key at " +
        cyan("https://postio.co.uk/dashboard/api-keys") +
        "\n",
    );
    process.exit(EXIT_TRANSPORT);
  }
  const baseUrl =
    typeof flags["base-url"] === "string"
      ? flags["base-url"]
      : process.env["POSTIO_BASE_URL"];
  return new Postio({
    apiKey,
    ...(baseUrl ? { baseUrl } : {}),
    headers: { "x-postio-client": `postio-cli/${VERSION}` },
  });
}

// ── Output ────────────────────────────────────────────────────────────
function printJson(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

function fmtPerf(perf: Performance | null | undefined): string {
  if (!perf) return "—";
  const total = (perf.workerMs ?? 0) + (perf.lookupMs ?? 0);
  return `${total} ms`;
}

function fmtAddressLine(a: Address): string {
  const parts = [
    a.address_line_1,
    a.address_line_2,
    a.address_line_3,
    a.post_town,
    a.postcode,
  ].filter((p): p is string => typeof p === "string" && p.length > 0);
  return parts.join(", ");
}

function printAddressList(addresses: Address[]): void {
  if (addresses.length === 0) {
    process.stdout.write(dim("(no results)\n"));
    return;
  }
  for (const a of addresses) {
    process.stdout.write(`  ${fmtAddressLine(a)}  ${dim(`udprn:${a.udprn}`)}\n`);
  }
}

function printAddressDetail(a: Address): void {
  const rows: Array<[string, string | number | null | undefined]> = [
    ["UDPRN", a.udprn],
    ["Line 1", a.address_line_1],
    ["Line 2", a.address_line_2],
    ["Line 3", a.address_line_3],
    ["Organisation", a.organisation_name],
    ["Department", a.department_name],
    ["Building name", a.building_name],
    ["Building no.", a.building_number],
    ["Sub-building", a.sub_building_name],
    ["PO box", a.po_box],
    ["Thoroughfare", a.thoroughfare],
    ["Dep. throughfare", a.dependent_thoroughfare],
    ["Dep. locality", a.dependent_locality],
    ["Post town", a.post_town],
    ["District", a.district],
    ["Ward", a.ward],
    ["Postcode", a.postcode],
    ["Country", a.country],
    ["Latitude", a.latitude],
    ["Longitude", a.longitude],
  ];
  for (const [label, value] of rows) {
    if (value === null || value === undefined || value === "") continue;
    process.stdout.write(`  ${dim(label.padEnd(18))} ${value}\n`);
  }
}

// ── Commands ──────────────────────────────────────────────────────────
type Format = "json" | "quiet" | "human";

function pickFormat(flags: Record<string, string | boolean>): Format {
  if (flags["json"] === true) return "json";
  if (flags["quiet"] === true) return "quiet";
  return "human";
}

async function runConnect(
  client: Postio,
  flags: Record<string, string | boolean>,
): Promise<void> {
  const fmt = pickFormat(flags);
  const res: ConnectSuccess = await client.connect();
  if (fmt === "json") {
    printJson(res);
    return;
  }
  if (fmt === "quiet") {
    process.stdout.write("ok\n");
    return;
  }
  process.stdout.write(
    green("✓ connected") + " " + dim(`(${fmtPerf(res.meta.performance)})`) + "\n",
  );
}

async function runAddressSearch(
  client: Postio,
  query: string,
  flags: Record<string, string | boolean>,
): Promise<void> {
  const fmt = pickFormat(flags);
  const max =
    typeof flags["max"] === "string" ? Number.parseInt(flags["max"], 10) : undefined;
  const res: AddressSearchEnvelope = await client.address.search(
    query,
    max !== undefined && Number.isFinite(max) ? { maxResults: max } : undefined,
  );
  if (fmt === "json") {
    printJson(res);
    return;
  }
  const results: AddressSearchResult[] = res.results;
  if (fmt === "quiet") {
    for (const r of results) process.stdout.write(r.suggestion + "\n");
    return;
  }
  process.stdout.write(
    bold(`${results.length} suggestion${results.length === 1 ? "" : "s"}`) +
      " " +
      dim(`(${fmtPerf(res.meta.performance)})`) +
      "\n",
  );
  if (results.length === 0) {
    process.stdout.write(dim("  (no results)\n"));
    return;
  }
  for (const r of results) {
    process.stdout.write(`  ${r.suggestion}  ${dim(`udprn:${r.udprn}`)}\n`);
  }
}

async function runAddressPostcode(
  client: Postio,
  postcode: string,
  flags: Record<string, string | boolean>,
): Promise<void> {
  const fmt = pickFormat(flags);
  const max =
    typeof flags["max"] === "string" ? Number.parseInt(flags["max"], 10) : undefined;
  const res: AddressPostcodeEnvelope = await client.address.postcode(
    postcode,
    max !== undefined && Number.isFinite(max) ? { maxResults: max } : undefined,
  );
  if (fmt === "json") {
    printJson(res);
    return;
  }
  const addresses: Address[] = res.results;
  if (fmt === "quiet") {
    for (const a of addresses) process.stdout.write(fmtAddressLine(a) + "\n");
    return;
  }
  process.stdout.write(
    bold(
      `${addresses.length} address${addresses.length === 1 ? "" : "es"} for ${postcode.toUpperCase()}`,
    ) +
      " " +
      dim(`(${fmtPerf(res.meta.performance)})`) +
      "\n",
  );
  printAddressList(addresses);
}

async function runAddressUdprn(
  client: Postio,
  udprn: string,
  flags: Record<string, string | boolean>,
): Promise<void> {
  const fmt = pickFormat(flags);
  const res: AddressUdprnEnvelope = await client.address.udprn(udprn);
  if (fmt === "json") {
    printJson(res);
    return;
  }
  const address = res.results[0];
  if (!address) {
    if (fmt === "quiet") return;
    process.stdout.write(dim("(no result)\n"));
    return;
  }
  if (fmt === "quiet") {
    process.stdout.write(fmtAddressLine(address) + "\n");
    return;
  }
  process.stdout.write(
    bold(`UDPRN ${udprn}`) + " " + dim(`(${fmtPerf(res.meta.performance)})`) + "\n",
  );
  printAddressDetail(address);
}

function emailVerdictColor(v: string | undefined | null): (s: string) => string {
  switch (v) {
    case "deliverable":
      return green;
    case "undeliverable":
    case "invalid":
      return red;
    case "risky":
    case "unknown":
      return yellow;
    default:
      return (s) => s;
  }
}

async function runEmail(
  client: Postio,
  address: string,
  flags: Record<string, string | boolean>,
): Promise<void> {
  const fmt = pickFormat(flags);
  const res: EmailEnvelope = await client.email.validate(address);
  if (fmt === "json") {
    printJson(res);
    return;
  }
  const e: EmailResult | undefined = res.results[0];
  if (!e) {
    if (fmt === "quiet") process.stdout.write("unknown\n");
    else process.stdout.write(dim("(no result)\n"));
    return;
  }
  if (fmt === "quiet") {
    process.stdout.write((e.deliverability ?? "unknown") + "\n");
    return;
  }
  process.stdout.write(
    bold(e.email) +
      "  " +
      emailVerdictColor(e.deliverability)(e.deliverability) +
      " " +
      dim(`(${fmtPerf(res.meta.performance)})`) +
      "\n",
  );
  const rows: Array<[string, string | boolean | null | undefined]> = [
    ["Valid syntax", e.isValidSyntax],
    ["Did you mean", e.didYouMean],
    ["MX found", e.mxFound],
    ["SMTP check", e.smtpCheck],
    ["Catch-all", e.isCatchAll],
    ["Disposable", e.isDisposable],
    ["Role address", e.isRoleAccount],
    ["Free provider", e.isFreeProvider],
  ];
  for (const [label, value] of rows) {
    if (value === null || value === undefined || value === "") continue;
    process.stdout.write(`  ${dim(label.padEnd(16))} ${value}\n`);
  }
}

async function runPhone(
  client: Postio,
  number: string,
  flags: Record<string, string | boolean>,
): Promise<void> {
  const fmt = pickFormat(flags);
  const res: PhoneEnvelope = await client.phone.validate(number);
  if (fmt === "json") {
    printJson(res);
    return;
  }
  const p: PhoneResult | undefined = res.results[0];
  if (!p) {
    if (fmt === "quiet") process.stdout.write("unknown\n");
    else process.stdout.write(dim("(no result)\n"));
    return;
  }
  if (fmt === "quiet") {
    process.stdout.write((p.isValid ? "valid" : "invalid") + "\n");
    return;
  }
  const validLabel = p.isValid ? green("valid") : red("invalid");
  process.stdout.write(
    bold(p.number) + "  " + validLabel + " " + dim(`(${fmtPerf(res.meta.performance)})`) + "\n",
  );
  const rows: Array<[string, string | boolean | null | undefined]> = [
    ["Type", p.type],
    ["Country", p.countryName],
    ["Country code", p.countryCode],
    ["E.164", p.e164Format],
    ["National", p.nationalFormat],
    ["International", p.internationalFormat],
    ["Possible", p.isPossible],
    ["Reachable", p.isReachable],
    ["Original carrier", p.originalCarrier],
    ["Current carrier", p.currentCarrier],
    ["Ported", p.isPorted],
    ["MCC", p.mcc],
    ["MNC", p.mnc],
    ["Lookup error", p.lookupError],
  ];
  for (const [label, value] of rows) {
    if (value === null || value === undefined || value === "") continue;
    process.stdout.write(`  ${dim(label.padEnd(18))} ${value}\n`);
  }
}

// ── Stdin streaming ──────────────────────────────────────────────────
async function streamFromStdin(
  handler: (line: string) => Promise<void>,
): Promise<void> {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    await handler(trimmed);
  }
}

// ── Error handling ────────────────────────────────────────────────────
function reportError(err: unknown): never {
  if (err instanceof PostioError) {
    const isApi = err.status >= 400 && err.status < 600 && err.envelope !== null;
    const headline = err.envelope?.error ?? err.message;
    const details = err.envelope?.details;
    process.stderr.write(red(`error: ${headline}`) + "\n");
    if (details) process.stderr.write(`  ${details}\n`);
    if (err.requestId) process.stderr.write(dim(`  request_id: ${err.requestId}`) + "\n");
    if (err.status) process.stderr.write(dim(`  status: ${err.status}`) + "\n");
    if (err.status === 401 || err.status === 403) process.exit(EXIT_TRANSPORT);
    if (isApi && err.status < 500) process.exit(EXIT_API_ERROR);
    process.exit(EXIT_TRANSPORT);
  }
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(red(`error: ${msg}`) + "\n");
  process.exit(EXIT_TRANSPORT);
}

// ── Main ──────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const { positionals, flags } = parseArgs(argv);

  if (flags["help"] === true) {
    process.stdout.write(HELP);
    process.exit(EXIT_OK);
  }
  if (flags["version"] === true) {
    process.stdout.write(VERSION + "\n");
    process.exit(EXIT_OK);
  }
  if (positionals.length === 0) {
    process.stdout.write(HELP);
    process.exit(EXIT_USAGE);
  }

  const command = positionals[0]!;

  // address subcommands
  if (command === "address") {
    const sub = positionals[1];
    const arg = positionals[2];
    if (!sub || !arg) {
      process.stderr.write(red("error: address requires a subcommand and argument") + "\n");
      process.stderr.write("  postio address search <query>\n");
      process.stderr.write("  postio address postcode <postcode>\n");
      process.stderr.write("  postio address udprn <udprn>\n");
      process.exit(EXIT_USAGE);
    }
    const client = buildClient(flags);
    try {
      if (sub === "search") {
        if (arg === "-") await streamFromStdin((q) => runAddressSearch(client, q, flags));
        else await runAddressSearch(client, arg, flags);
      } else if (sub === "postcode") {
        if (arg === "-") await streamFromStdin((q) => runAddressPostcode(client, q, flags));
        else await runAddressPostcode(client, arg, flags);
      } else if (sub === "udprn") {
        if (arg === "-") await streamFromStdin((q) => runAddressUdprn(client, q, flags));
        else await runAddressUdprn(client, arg, flags);
      } else {
        process.stderr.write(red(`error: unknown address subcommand: ${sub}`) + "\n");
        process.exit(EXIT_USAGE);
      }
    } catch (err) {
      reportError(err);
    }
    return;
  }

  if (command === "email") {
    const arg = positionals[1];
    if (!arg) {
      process.stderr.write(red("error: email requires an address (or - for stdin)") + "\n");
      process.exit(EXIT_USAGE);
    }
    const client = buildClient(flags);
    try {
      if (arg === "-") await streamFromStdin((q) => runEmail(client, q, flags));
      else await runEmail(client, arg, flags);
    } catch (err) {
      reportError(err);
    }
    return;
  }

  if (command === "phone") {
    const arg = positionals[1];
    if (!arg) {
      process.stderr.write(red("error: phone requires a number (or - for stdin)") + "\n");
      process.exit(EXIT_USAGE);
    }
    const client = buildClient(flags);
    try {
      if (arg === "-") await streamFromStdin((q) => runPhone(client, q, flags));
      else await runPhone(client, arg, flags);
    } catch (err) {
      reportError(err);
    }
    return;
  }

  if (command === "connect") {
    const client = buildClient(flags);
    try {
      await runConnect(client, flags);
    } catch (err) {
      reportError(err);
    }
    return;
  }

  process.stderr.write(red(`error: unknown command: ${command}`) + "\n");
  process.stderr.write("Run " + cyan("postio --help") + " for usage.\n");
  process.exit(EXIT_USAGE);
}

main().catch((err) => reportError(err));
