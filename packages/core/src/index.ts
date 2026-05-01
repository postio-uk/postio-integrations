import type { components } from "@postio/api-types";

export type Address = components["schemas"]["Address"];
export type AddressSearchResult = components["schemas"]["AddressSearchResult"];
export type EmailResult = components["schemas"]["EmailResult"];
export type PhoneResult = components["schemas"]["PhoneResult"];
export type Performance = components["schemas"]["Performance"];
export type Meta = components["schemas"]["Meta"];
export type MetaConnect = components["schemas"]["MetaConnect"];
export type ConnectSuccess = components["schemas"]["ConnectSuccess"];
export type AddressSearchEnvelope = components["schemas"]["AddressSearchEnvelope"];
export type AddressPostcodeEnvelope = components["schemas"]["AddressPostcodeEnvelope"];
export type AddressUdprnEnvelope = components["schemas"]["AddressUdprnEnvelope"];
export type EmailEnvelope = components["schemas"]["EmailEnvelope"];
export type PhoneEnvelope = components["schemas"]["PhoneEnvelope"];
export type ErrorEnvelope = components["schemas"]["ErrorEnvelope"];

export interface PostioOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  /** Extra headers merged into every request. `x-api-key` / `accept` cannot be overridden. */
  headers?: Record<string, string>;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface SearchOptions extends RequestOptions {
  maxResults?: number;
}

export interface PostcodeOptions extends RequestOptions {
  maxResults?: number;
}

export interface PostioErrorInit {
  status: number;
  code?: string | undefined;
  details?: string | null | undefined;
  requestId?: string | null | undefined;
  envelope?: ErrorEnvelope | null | undefined;
  cause?: unknown;
}

/**
 * Thrown for any non-2xx response, network failure, abort, or parse error.
 * `envelope` is the raw API error body when the server returned one.
 */
export class PostioError extends Error {
  override readonly name = "PostioError";
  readonly status: number;
  readonly code: string | null;
  readonly details: string | null;
  readonly requestId: string | null;
  readonly envelope: ErrorEnvelope | null;

  constructor(message: string, init: PostioErrorInit) {
    super(message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.status = init.status;
    this.code = init.code ?? null;
    this.details = init.details ?? null;
    this.requestId = init.requestId ?? null;
    this.envelope = init.envelope ?? null;
  }
}

const DEFAULT_BASE_URL = "https://api.postio.co.uk/v1";
const DEFAULT_TIMEOUT_MS = 10_000;
const VERSION = "0.1.0";
const CLIENT_ID = `postio-core/${VERSION}`;

export class Postio {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  readonly #extraHeaders: Record<string, string>;

  readonly address: {
    search: (q: string, opts?: SearchOptions) => Promise<AddressSearchEnvelope>;
    postcode: (postcode: string, opts?: PostcodeOptions) => Promise<AddressPostcodeEnvelope>;
    udprn: (udprn: number | string, opts?: RequestOptions) => Promise<AddressUdprnEnvelope>;
  };

  readonly email: {
    validate: (address: string, opts?: RequestOptions) => Promise<EmailEnvelope>;
  };

  readonly phone: {
    validate: (number: string, opts?: RequestOptions) => Promise<PhoneEnvelope>;
  };

  constructor(options: PostioOptions) {
    if (!options || typeof options.apiKey !== "string" || options.apiKey.length === 0) {
      throw new TypeError("Postio: `apiKey` is required.");
    }
    const fallbackFetch = (globalThis as { fetch?: typeof fetch }).fetch;
    if (!options.fetch && typeof fallbackFetch !== "function") {
      throw new TypeError("Postio: no global `fetch` available — pass one via `options.fetch`.");
    }

    this.#apiKey = options.apiKey;
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.#fetch = (options.fetch ?? fallbackFetch!).bind(globalThis);
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.#extraHeaders = { ...(options.headers ?? {}) };

    this.address = {
      search: (q, opts) =>
        this.#request<AddressSearchEnvelope>("/address/search", {
          query: { q, max_results: opts?.maxResults },
          signal: opts?.signal,
        }),
      postcode: (postcode, opts) =>
        this.#request<AddressPostcodeEnvelope>(
          `/address/postcode/${encodeURIComponent(postcode)}`,
          { query: { max_results: opts?.maxResults }, signal: opts?.signal },
        ),
      udprn: (udprn, opts) =>
        this.#request<AddressUdprnEnvelope>(
          `/address/udprn/${encodeURIComponent(String(udprn))}`,
          { signal: opts?.signal },
        ),
    };

    this.email = {
      validate: (address, opts) =>
        this.#request<EmailEnvelope>(`/email/${encodeURIComponent(address)}`, {
          signal: opts?.signal,
        }),
    };

    this.phone = {
      validate: (number, opts) =>
        this.#request<PhoneEnvelope>(`/phone/${encodeURIComponent(number)}`, {
          signal: opts?.signal,
        }),
    };
  }

  /** Health probe. Free. Designed for input-focus warm-ups in autocomplete UIs. */
  connect(opts?: RequestOptions): Promise<ConnectSuccess> {
    return this.#request<ConnectSuccess>("/connect", { signal: opts?.signal });
  }

  async #request<T>(
    path: string,
    init: { query?: Record<string, unknown>; signal?: AbortSignal | undefined } = {},
  ): Promise<T> {
    const url = new URL(this.#baseUrl + path);
    if (init.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      ...this.#extraHeaders,
      "x-api-key": this.#apiKey,
      "accept": "application/json",
      "x-postio-client": CLIENT_ID,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error("timeout")), this.#timeoutMs);
    const onUserAbort = () => controller.abort(init.signal?.reason);
    if (init.signal) {
      if (init.signal.aborted) controller.abort(init.signal.reason);
      else init.signal.addEventListener("abort", onUserAbort, { once: true });
    }

    let response: Response;
    try {
      response = await this.#fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) {
        const userAborted = init.signal?.aborted === true;
        throw new PostioError(userAborted ? "Request aborted." : "Request timed out.", {
          status: 0,
          code: userAborted ? "request_aborted" : "request_timeout",
          cause: err,
        });
      }
      throw new PostioError(err instanceof Error ? err.message : "Network error", {
        status: 0,
        code: "network_error",
        cause: err,
      });
    } finally {
      clearTimeout(timeoutId);
      init.signal?.removeEventListener("abort", onUserAbort);
    }

    const contentType = response.headers.get("content-type") ?? "";
    let body: unknown;
    if (contentType.includes("application/json")) {
      try {
        body = await response.json();
      } catch (err) {
        throw new PostioError("Failed to parse response body as JSON.", {
          status: response.status,
          code: "parse_error",
          cause: err,
        });
      }
    } else {
      // Non-JSON response — surface the text so callers can debug.
      const text = await response.text().catch(() => "");
      throw new PostioError(
        `Unexpected response content-type "${contentType || "(none)"}".`,
        { status: response.status, code: "unexpected_content_type", details: text || null },
      );
    }

    if (!response.ok) {
      const envelope = isErrorEnvelope(body) ? body : null;
      throw new PostioError(
        envelope?.error ?? `HTTP ${response.status}`,
        {
          status: response.status,
          code: envelope?.error,
          details: envelope?.details ?? null,
          requestId: envelope?.meta?.requestId ?? null,
          envelope,
        },
      );
    }

    return body as T;
  }
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { success?: unknown }).success === false &&
    typeof (value as { error?: unknown }).error === "string"
  );
}

export default Postio;
