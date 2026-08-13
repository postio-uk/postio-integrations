/**
 * `@postio/postcode-lookup` — a named alias for `@postio/node`.
 *
 * Why this package exists: npm's search ranks heavily on name match, and
 * "postcode lookup" is one of the terms UK developers actually type. Under
 * that query the incumbent owns the first two results and we appear nowhere,
 * because our packages are named after us rather than after the job. This
 * package is named after the job.
 *
 * It is a re-export, not a fork. There is no second implementation to drift:
 * everything here comes from `@postio/node`, which sits on `@postio/core`.
 * If you already depend on either, you do not need this — and the README
 * says so plainly rather than pretending otherwise.
 *
 * @example
 * ```ts
 * import { Postio } from "@postio/postcode-lookup";
 *
 * const postio = new Postio({ apiKey: process.env.POSTIO_API_KEY! });
 * const { results } = await postio.address.postcode("W1G 8YW");
 * ```
 */
export * from "@postio/node";
