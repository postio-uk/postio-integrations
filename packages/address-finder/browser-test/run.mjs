import { createRequire } from "node:module";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const require = createRequire("/usr/lib/node_modules/");
const { chromium } = require("playwright");
const dir = process.argv[2]; const KEY = process.env.KEY;
const srv = http.createServer((q, r) => { const f = path.join(dir, q.url.split("?")[0]); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : "text/html" }); r.end(fs.readFileSync(f)); }).listen(8888, "127.0.0.1");
const browser = await chromium.launch();
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
async function page(file) {
  const p = await browser.newPage(); const reqs = []; const logs = [];
  p.on("request", (r) => { if (r.url().includes("stage-api")) reqs.push({ url: r.url(), h: r.headers() }); });
  p.on("console", (m) => logs.push(m.type() + ": " + m.text())); p.on("pageerror", (e) => logs.push("pageerror: " + e.message));
  await p.addInitScript((k) => { window.KEY = k; }, KEY);
  await p.goto("http://localhost:8888/" + file); return { p, reqs, logs };
}
const searches = (reqs) => reqs.filter((r) => r.url.includes("/address/search")).length;
async function pick(p, sel, text) {
  await p.click(sel); await p.keyboard.type(text, { delay: 30 });
  await p.waitForSelector(".postio-af__listbox[data-open=true] .postio-af__option", { timeout: 8000 });
  await p.keyboard.press("ArrowDown"); await p.keyboard.press("Enter");
}
// 1. plain HTML, search box = line 1, clientId header
{ const { p, reqs, logs } = await page("plain.html");
  await pick(p, "#search", "57 wimpole street");
  await p.waitForFunction(() => document.querySelector("#pc").value !== "", null, { timeout: 8000 });
  const n = searches(reqs); await p.waitForTimeout(800);
  const v = await p.evaluate(() => ({ s: search.value, t: town.value, pc: pc.value, lat: lat.value, open: document.querySelector(".postio-af__listbox").dataset.open }));
  ok(v.t && v.pc && v.lat && v.s && !v.s.includes(v.pc), "plain: fields filled, search box holds line 1 (" + JSON.stringify(v) + ")");
  ok(searches(reqs) === n, "plain: no search fired after pick");
  ok(v.open === "false", "plain: dropdown closed after pick");
  ok(reqs.every((r) => r.h["x-postio-client"] === "plain-test/1" || r.url.includes("s2")), "plain: clientId sent as x-postio-client (" + [...new Set(reqs.map((r) => r.h["x-postio-client"]))] + ")");
  ok(logs.some((l) => l.includes("no `output` map")), "plain: missing output warns, no crash");
  ok(!logs.some((l) => l.startsWith("pageerror")), "plain: no page errors");
  // default header on second finder
  await pick(p, "#s2", "10 downing street"); await p.waitForTimeout(500);
  const s2 = reqs.filter((r) => r.url.includes("udprn")).pop();
  ok(s2 && /^postio-core\//.test(s2.h["x-postio-client"]), "plain: default x-postio-client " + (s2 && s2.h["x-postio-client"]));
  const s2v = await p.evaluate(() => s2.value); ok(s2v.includes(","), "plain: unmapped search box gets summary " + s2v);
  await p.close(); }
// 2. CDN bundle on a React-controlled form
{ const { p, reqs, logs } = await page("cdnreact.html");
  await pick(p, "#c-line1", "57 wimpole street");
  await p.waitForFunction(() => JSON.parse(document.querySelector("#c-state").textContent).postcode !== "", null, { timeout: 8000 }).catch(() => {});
  const n = searches(reqs); await p.waitForTimeout(800);
  const st = JSON.parse(await p.textContent("#c-state"));
  ok(st.line1 && st.town && st.postcode && !st.line1.includes(st.postcode), "cdn+react: React state got the values " + JSON.stringify(st));
  ok(searches(reqs) === n, "cdn+react: no search fired after pick");
  // re-render survives: type in town field triggers rerender, line1 must persist
  await p.click("#c-town"); await p.keyboard.type("x");
  const st2 = JSON.parse(await p.textContent("#c-state")); ok(st2.line1 === st.line1, "cdn+react: values survive re-render");
  ok(!logs.some((l) => l.startsWith("pageerror")), "cdn+react: no page errors " + logs.filter(l=>l.startsWith("pageerror")));
  await p.close(); }
// 3. @postio/react package
{ const { p, reqs, logs } = await page("rpkg.html");
  await pick(p, "#rpkg-search", "57 wimpole street");
  await p.waitForFunction(() => JSON.parse(document.querySelector("#r-state").textContent).picked, null, { timeout: 8000 }).catch(() => {});
  const n = searches(reqs); await p.waitForTimeout(800);
  const st = JSON.parse(await p.textContent("#r-state"));
  ok(st.picked && st.line1 && st.town && st.postcode, "react pkg: onSelect + output into React state " + JSON.stringify(st));
  ok(searches(reqs) === n, "react pkg: no search fired after pick");
  ok(reqs.length && reqs.every((r) => r.h["x-postio-client"] === "react-test/1"), "react pkg: clientId + stage baseUrl used");
  ok(!logs.some((l) => l.startsWith("pageerror")), "react pkg: no page errors");
  await p.close(); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : "ALL PASS"); process.exit(fails ? 1 : 0);
