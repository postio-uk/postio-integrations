import { Postio as CorePostio, PostioError } from "@postio/core";
import type { PostioOptions } from "@postio/core";

export { PostioError } from "@postio/core";
export type {
  Address,
  AddressSearchResult,
  EmailResult,
  PhoneResult,
  Performance,
  Meta,
  MetaConnect,
  ConnectSuccess,
  AddressSearchEnvelope,
  AddressPostcodeEnvelope,
  AddressUdprnEnvelope,
  EmailEnvelope,
  PhoneEnvelope,
  ErrorEnvelope,
  PostioOptions,
  RequestOptions,
  SearchOptions,
  PostcodeOptions,
} from "@postio/core";

export interface RetryConfig {
  /** Max retry attempts after the initial request. Default 2. Set 0 to disable. */
  maxRetries?: number;
  /** Base delay for exponential backoff (ms). Default 500. */
  baseDelayMs?: number;
  /** Cap on individual backoff delay (ms). Default 8000. */
  capDelayMs?: number;
  /** HTTP statuses to retry on. Default [408, 409, 429, 500, 502, 503, 504]. */
  retryOnStatus?: number[];
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEvent {
  level: LogLevel;
  msg: string;
  attempt?: number;
  status?: number;
  durationMs?: number;
  delayMs?: number;
  url?: string;
  error?: unknown;
}

export type Logger = (event: LogEvent) => void;

export interface PostioNodeOptions extends PostioOptions {
  /** Retry policy. Defaults: 2 retries, exp backoff w/ jitter on 408/409/429/5xx + network. */
  retry?: RetryConfig | false;
  /** Structured logger. Receives one event per attempt + retry decision. */
  logger?: Logger;
}

const DEFAULT_RETRY: Required<RetryConfig> = {
  maxRetries: 2,
  baseDelayMs: 500,
  capDelayMs: 8000,
  retryOnStatus: [408, 409, 429, 500, 502, 503, 504],
};

const DEFAULT_NODE_TIMEOUT_MS = 30_000;

export class Postio extends CorePostio {
  constructor(options: PostioNodeOptions) {
    const baseFetch =
      options.fetch ?? (globalThis as { fetch?: typeof fetch }).fetch;
    if (typeof baseFetch !== "function") {
      throw new TypeError(
        "Postio (node): no global `fetch` available — pass one via `options.fetch`.",
      );
    }
    const retry: Required<RetryConfig> | null =
      options.retry === false
        ? null
        : { ...DEFAULT_RETRY, ...(options.retry ?? {}) };
    const logger = options.logger;

    const wrappedFetch: typeof fetch = async (input, init) =>
      retryingFetch(baseFetch, input, init, retry, logger);

    super({
      ...options,
      timeoutMs: options.timeoutMs ?? DEFAULT_NODE_TIMEOUT_MS,
      fetch: wrappedFetch,
    });
  }
}

async function retryingFetch(
  baseFetch: typeof fetch,
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  retry: Required<RetryConfig> | null,
  logger: Logger | undefined,
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
  const max = retry?.maxRetries ?? 0;
  const signal = init?.signal ?? null;

  for (let attempt = 0; attempt <= max; attempt++) {
    const start = Date.now();
    try {
      const res = await baseFetch(input, init);
      const duration = Date.now() - start;

      if (res.ok) {
        logger?.({ level: "debug", msg: "postio_request_ok", attempt, status: res.status, durationMs: duration, url });
        return res;
      }
      if (!retry || attempt === max || !retry.retryOnStatus.includes(res.status)) {
        logger?.({ level: "debug", msg: "postio_request_failed", attempt, status: res.status, durationMs: duration, url });
        return res;
      }
      const delay = backoff(retry, attempt);
      logger?.({ level: "warn", msg: "postio_request_retrying", attempt, status: res.status, durationMs: duration, delayMs: delay, url });
      await sleep(delay, signal);
    } catch (err) {
      const duration = Date.now() - start;
      if (signal?.aborted) {
        logger?.({ level: "debug", msg: "postio_request_aborted", attempt, durationMs: duration, error: err, url });
        throw err;
      }
      if (!retry || attempt === max) {
        logger?.({ level: "error", msg: "postio_request_error", attempt, durationMs: duration, error: err, url });
        throw err;
      }
      const delay = backoff(retry, attempt);
      logger?.({ level: "warn", msg: "postio_request_retrying_after_error", attempt, durationMs: duration, delayMs: delay, error: err, url });
      await sleep(delay, signal);
    }
  }
  // Unreachable: the loop either returns or throws.
  throw new PostioError("Postio: retry loop exhausted unexpectedly", { status: 0, code: "internal_error" });
}

function backoff(cfg: Required<RetryConfig>, attempt: number): number {
  const exp = Math.min(cfg.capDelayMs, cfg.baseDelayMs * 2 ** attempt);
  // Full jitter: a random value in [0, exp).
  return Math.floor(Math.random() * exp);
}

function sleep(ms: number, signal: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(signal?.reason);
    };
    function cleanup() {
      signal?.removeEventListener("abort", onAbort);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export default Postio;
