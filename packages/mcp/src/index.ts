#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Postio, PostioError } from "@postio/core";
import { z } from "zod";

const VERSION = "0.1.0";

function readApiKey(): string {
  const key = process.env["POSTIO_API_KEY"];
  if (!key || key.length === 0) {
    process.stderr.write(
      "@postio/mcp: POSTIO_API_KEY environment variable is required.\n" +
        "Get a key at https://postio.co.uk/dashboard.\n",
    );
    process.exit(1);
  }
  return key;
}

const apiKey = readApiKey();
const baseUrl = process.env["POSTIO_BASE_URL"];
const client = new Postio({
  apiKey,
  ...(baseUrl ? { baseUrl } : {}),
});

const server = new McpServer({ name: "postio", version: VERSION });

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown): ToolResult {
  if (err instanceof PostioError) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: err.code ?? "postio_error",
              status: err.status,
              details: err.details,
              requestId: err.requestId,
              message: err.message,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            error: "internal_error",
            message: err instanceof Error ? err.message : String(err),
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

server.tool(
  "postio_address_search",
  "Search UK addresses by free-form text — building, street, postcode, organisation, or any combination. Returns a list of suggestions, each with a UDPRN (Royal Mail's per-address ID). Pass a chosen UDPRN to `postio_udprn_lookup` to fetch the full record. Free / non-billable.",
  {
    query: z
      .string()
      .min(1)
      .describe("Search string. Free-form: building, street, postcode, organisation."),
    max_results: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results to return. Default 10, max 50."),
  },
  async ({ query, max_results }) => {
    try {
      const env = await client.address.search(query, {
        ...(max_results !== undefined ? { maxResults: max_results } : {}),
      });
      return ok(env);
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "postio_postcode_lookup",
  "Return every PAF delivery point at a UK postcode, ordered by building number. Whitespace and case are normalised. Billable on a hit; valid postcodes with no delivery points return an empty list and are not charged.",
  {
    postcode: z.string().min(2).describe("UK postcode, e.g. 'W1G 8YW'."),
    max_results: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max results. Default 100."),
  },
  async ({ postcode, max_results }) => {
    try {
      const env = await client.address.postcode(postcode, {
        ...(max_results !== undefined ? { maxResults: max_results } : {}),
      });
      return ok(env);
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "postio_udprn_lookup",
  "Look up a single UK delivery point by its UDPRN (Royal Mail's stable per-address ID). Use this after `postio_address_search` to fetch the full record for a chosen suggestion. Billable on a hit; misses (404) are not charged.",
  {
    udprn: z
      .union([z.number().int(), z.string()])
      .describe("Unique Delivery Point Reference Number."),
  },
  async ({ udprn }) => {
    try {
      const env = await client.address.udprn(udprn);
      return ok(env);
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "postio_email_validate",
  "Validate an email address: syntax (RFC 5322), typo correction (gnail→gmail), classification (disposable, role, free provider), MX lookup, and live SMTP mailbox probe. Returns an aggregated `deliverability` verdict (deliverable / undeliverable / risky / unknown / invalid) plus every signal independently.",
  {
    email: z.string().min(3).describe("Email address to validate."),
  },
  async ({ email }) => {
    try {
      const env = await client.email.validate(email);
      return ok(env);
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "postio_phone_validate",
  "Parse a phone number with libphonenumber and run a live HLR (Home Location Register) lookup. Returns current carrier (post-porting), original carrier, ported flag, reachability, MCC/MNC. Pass numbers in E.164 (`+447700900123`) for unambiguous results.",
  {
    number: z.string().min(4).describe("Phone number — E.164, international, or national format."),
  },
  async ({ number }) => {
    try {
      const env = await client.phone.validate(number);
      return ok(env);
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "postio_connect",
  "Free key/health probe. Returns 200 if the API key is active and the upstream search service is reachable. Useful as a smoke test or to warm the worker.",
  {},
  async () => {
    try {
      const env = await client.connect();
      return ok(env);
    } catch (err) {
      return fail(err);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
