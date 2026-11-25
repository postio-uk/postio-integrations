#!/usr/bin/env bash
# Browser check of the address-finder against the stage API: plain HTML,
# the CDN bundle on a React-controlled form, and @postio/react.
# Needs Playwright (global) and a stage publishable key that accepts
# Origin http://localhost:8888 (postio-www wrangler.jsonc env.stage
# POSTIO_WWW_API_KEY):   KEY=pk_... ./run.sh
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd); pkgs="$here/../.."
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
cp "$here"/*.html "$here"/*.jsx "$work"/
(cd "$work" && npm init -y >/dev/null && npm i -s react@18 react-dom@18 @tanstack/react-query@5 esbuild@0.27 >/dev/null)
(cd "$pkgs" && pnpm -F "@postio/react..." -F "@postio/address-finder-bundled..." run build >/dev/null)
cp "$pkgs/address-finder-bundled/dist/address-finder.js" "$work/cdn.js"
eb="$work/node_modules/.bin/esbuild"; common=(--bundle --format=iife --jsx=automatic --define:process.env.NODE_ENV='"development"')
"$eb" "$work/rc.jsx" --outfile="$work/rc.js" "${common[@]}" >/dev/null 2>&1
"$eb" "$work/app.jsx" --outfile="$work/app.js" "${common[@]}" \
  --alias:@postio/react="$pkgs/react/dist/index.js" --alias:@postio/address-finder="$pkgs/address-finder/dist/index.js" \
  --alias:@postio/core="$pkgs/core/dist/index.js" --alias:react="$work/node_modules/react" \
  --alias:@tanstack/react-query="$work/node_modules/@tanstack/react-query" >/dev/null 2>&1
node "$here/run.mjs" "$work"
