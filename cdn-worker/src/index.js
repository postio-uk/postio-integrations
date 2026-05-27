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
 * Plus one POST-only endpoint:
 *   POST /_wp                  → WordPress plugin telemetry sink. Writes
 *                                to env.WP_TELEMETRY (Analytics Engine
 *                                dataset). One data point per active
 *                                builder per ping.
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
  // No `vary: origin` — we always return `*`, so a single cached response is
  // valid for every origin. Setting `vary: origin` would fragment the edge
  // cache by the request's Origin header for no benefit.
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-max-age": "86400",
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

// ---------------------------------------------------------------------
// WordPress plugin telemetry sink (POST /_wp)
//
// postio-uk/postio-wordpress pings weekly with:
//   { plugin_version, wp_version, php_version, site_lang, active_builders[] }
//
// The plugin's settings disclosure promises no URLs, post titles, form
// contents, API keys, or IP-derived data are sent. This handler only
// reads the listed fields and writes them to Analytics Engine — no
// other body fields are persisted.
// ---------------------------------------------------------------------

const WP_TELEMETRY_MAX_BODY = 4096;
const WP_TELEMETRY_MAX_FIELD = 64;
const WP_TELEMETRY_MAX_BUILDERS = 50;
const WP_TELEMETRY_VERSION_RX = /^[A-Za-z0-9._\-+]+$/;

function trimField(v) {
  if (typeof v !== "string") return "";
  // Strip control chars and cap length.
  return v.replace(/[\x00-\x1f\x7f]/g, "").slice(0, WP_TELEMETRY_MAX_FIELD).trim();
}

function safeBuilderSlug(v) {
  const s = trimField(v);
  // Whitelist-style: lowercase a-z, 0-9, dash. Anything else is dropped
  // — the WP plugin only ever sends slugs that match.
  if (s.length === 0 || s.length > 40) return "";
  if (!/^[a-z0-9-]+$/.test(s)) return "";
  return s;
}

async function handleWpTelemetry(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { allow: "POST", "access-control-allow-origin": "*" },
    });
  }
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST", "access-control-allow-origin": "*" },
    });
  }

  const cl = request.headers.get("content-length");
  if (cl && Number(cl) > WP_TELEMETRY_MAX_BODY) {
    return new Response(null, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return new Response(null, { status: 400 });
  }

  const pluginVersion = trimField(body.plugin_version);
  const wpVersion = trimField(body.wp_version);
  const phpVersion = trimField(body.php_version);
  const siteLang = trimField(body.site_lang);
  const builders = Array.isArray(body.active_builders)
    ? body.active_builders
        .map(safeBuilderSlug)
        .filter(Boolean)
        .slice(0, WP_TELEMETRY_MAX_BUILDERS)
    : [];

  if (!pluginVersion || !WP_TELEMETRY_VERSION_RX.test(pluginVersion)) {
    return new Response(null, { status: 400 });
  }

  if (!env.WP_TELEMETRY) {
    // Binding missing — accept silently so the plugin doesn't retry.
    return new Response(null, { status: 204 });
  }

  const baseBlobs = [pluginVersion, wpVersion, phpVersion, siteLang];

  if (builders.length === 0) {
    env.WP_TELEMETRY.writeDataPoint({
      blobs: [...baseBlobs, "_none"],
      indexes: ["_none"],
    });
  } else {
    const dedup = Array.from(new Set(builders));
    for (const builder of dedup) {
      env.WP_TELEMETRY.writeDataPoint({
        blobs: [...baseBlobs, builder],
        indexes: [builder],
      });
    }
  }

  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // /_wp is POST-only — handle before the GET/HEAD gate below.
    if (pathname === "/_wp") {
      return handleWpTelemetry(request, env);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed();
    }

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

    // Workers bypass the default CF edge cache, so we explicitly check
    // caches.default before each R2 round-trip. Cache key is GET-normalised
    // so HEAD requests share entries with GETs.
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) {
      return request.method === "HEAD"
        ? new Response(null, { status: cached.status, headers: cached.headers })
        : cached;
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

    const response = new Response(obj.body, { headers });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    if (request.method === "HEAD") {
      return new Response(null, { headers });
    }
    return response;
  },
};
