/**
 * Postio CDN Worker — fronts an R2 bucket at cdn.postio.co.uk and serves
 * the drop-in JS bundles (@postio/address-finder-bundled and friends).
 *
 * Versioning rules (per postio-integrations/SPEC.md §4.3):
 *   /v{MAJOR}/<file>           → tracks the latest x.y.z under that major.
 *                                Cache: 5min browser, 1h edge, SWR 24h.
 *   /v{MAJOR}.{MINOR}.{PATCH}/<file>
 *                              → exact pin. Cache: 1y immutable.
 *   /latest/<file>             → discouraged-but-supported. Same cache as /vN/.
 *
 * Anything else 404s. Always returns CORS `*` (these are public bundles).
 *
 * R2 binding: env.BUNDLES (configured in wrangler.toml). If the binding
 * is missing — e.g. before the bucket has been provisioned — we serve a
 * "coming soon" placeholder so DNS / route binding can be verified
 * independently of bucket setup.
 */

const IMMUTABLE_PATH = /^\/v(\d+)\.(\d+)\.(\d+)\//;
const MAJOR_PATH = /^\/v(\d+)\//;
const LATEST_PATH = /^\/latest\//;

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

function cacheHeadersFor(pathname) {
  if (IMMUTABLE_PATH.test(pathname)) {
    return { "cache-control": "public, max-age=31536000, immutable" };
  }
  return {
    "cache-control":
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  };
}

function pickContentType(name) {
  if (name.endsWith(".js") || name.endsWith(".mjs"))
    return "application/javascript; charset=utf-8";
  if (name.endsWith(".css")) return "text/css; charset=utf-8";
  if (name.endsWith(".map") || name.endsWith(".json"))
    return "application/json; charset=utf-8";
  if (name.endsWith(".html")) return "text/html; charset=utf-8";
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

function comingSoonPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Postio CDN</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <style>
    body { font: 16px/1.5 -apple-system, system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem; color: #1a1a1a; }
    code { background: #f4f4f5; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.9em; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Postio CDN</h1>
  <p>This host serves Postio's drop-in JavaScript bundles — the
     <code>address-finder</code> autocomplete and friends — at versioned,
     immutable URLs for production use.</p>
  <p>Bundles aren't published yet. When they are, you'll be able to use:</p>
  <pre><code>&lt;script src="https://cdn.postio.co.uk/v1/address-finder.js"&gt;&lt;/script&gt;</code></pre>
  <p>For the API contract today, see
     <a href="https://postio.co.uk/openapi.json">postio.co.uk/openapi.json</a>
     or <a href="https://postio.co.uk/docs">the docs</a>.</p>
</body>
</html>`;
}

function rootResponse() {
  return new Response(comingSoonPage(), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
      ...corsHeaders(),
    },
  });
}

function notFound(reason) {
  return new Response(reason || "Not Found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=60",
      ...corsHeaders(),
    },
  });
}

function methodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      "allow": "GET, HEAD, OPTIONS",
      ...corsHeaders(),
    },
  });
}

function isVersionedPath(pathname) {
  return (
    IMMUTABLE_PATH.test(pathname) ||
    MAJOR_PATH.test(pathname) ||
    LATEST_PATH.test(pathname)
  );
}

function r2KeyFromPath(pathname) {
  // Strip the leading slash; the rest is the R2 key.
  // /v1/foo.js → v1/foo.js
  // /v1.2.3/foo.js → v1.2.3/foo.js
  // /latest/foo.js → latest/foo.js
  return pathname.slice(1);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed();
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === "/" || pathname === "") {
      return rootResponse();
    }

    if (!isVersionedPath(pathname)) {
      return notFound(
        "Only /vN/, /vN.M.P/, and /latest/ paths are served by this CDN.",
      );
    }

    if (!env.BUNDLES) {
      // R2 binding not yet configured — return a hint so dev/early-deploy
      // requests fail with a useful message rather than a generic 404.
      return new Response(
        "CDN is being provisioned — R2 bucket binding not yet configured.\n",
        {
          status: 503,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "retry-after": "3600",
            ...corsHeaders(),
          },
        },
      );
    }

    const key = r2KeyFromPath(pathname);
    const obj = await env.BUNDLES.get(key);
    if (!obj) {
      return notFound();
    }

    const headers = new Headers({
      ...corsHeaders(),
      ...cacheHeadersFor(pathname),
      "content-type": pickContentType(pathname),
    });
    if (obj.httpEtag) headers.set("etag", obj.httpEtag);
    if (obj.uploaded) headers.set("last-modified", obj.uploaded.toUTCString());

    if (request.method === "HEAD") {
      return new Response(null, { headers });
    }
    return new Response(obj.body, { headers });
  },
};
