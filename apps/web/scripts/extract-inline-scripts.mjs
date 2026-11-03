// Moves every inline <script> out of the built `dist/index.html` into a file
// of its own, and brings the service worker's precache up to date with the
// result. Run by `pnpm build`, after `vite build`.
//
// Why: the server sends the console with `script-src 'self'`, which refuses
// inline scripts, and SvelteKit writes its bootstrap inline into the SPA
// fallback page. `crates/` does not change for the console, so the page does.
//
// Each inline script becomes a classic external script at the same place in
// the document, so it runs at the same moment, in the same order, with the
// same `document.currentScript` (Kit's bootstrap mounts the app into its
// script's parent) and in sloppy mode (it assigns an undeclared global). A
// module script would be deferred, strict, and have no `currentScript`.
//
// The service worker was generated before the adapter wrote `index.html`, so
// its precache gives `index.html` a revision derived from Kit's version file
// and does not know the new script. Both are fixed here: `index.html` gets
// the hash of its final content and each extracted script is precached.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const indexPath = join(dist, "index.html");
const swPath = join(dist, "sw.js");

/** Where Kit puts its own files, relative to `dist/` and to the console's base URL. */
const APP_DIR = "_app";

/** @param {string} message @returns {never} */
function fail(message) {
  console.error(`extract-inline-scripts: ${message}`);
  process.exit(1);
}

/** @param {string} text */
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
/** @param {string} text */
const md5 = (text) => createHash("md5").update(text).digest("hex");

let html = readFileSync(indexPath, "utf8");

// Kit's own URLs say where the console is served (`/console/_app/...`).
const baseMatch = html.match(/["'](\/[^"']*?)\/_app\/immutable\//);
if (!baseMatch) fail(`no ${APP_DIR}/immutable URL in ${indexPath}; cannot tell the base path`);
const base = baseMatch[1];

/** @type {string[]} */
const extracted = [];
html = html.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi, (tag, attrs = "", body) => {
  if (/\ssrc\s*=/i.test(attrs)) return tag;
  if (attrs.trim() !== "") {
    // Kit writes a bare `<script>`; anything else (a type, a nonce) would need
    // its meaning carried over, which this does not attempt.
    fail(`an inline <script${attrs}> has attributes this step does not know how to keep`);
  }
  const source = `${body.trim()}\n`;
  const file = `${APP_DIR}/boot.${sha256(source).slice(0, 12)}.js`;
  writeFileSync(join(dist, file), source);
  extracted.push(file);
  return `<script src="${base}/${file}"></script>`;
});

if (extracted.length === 0) {
  fail(`${indexPath} has no inline <script>: did Kit's output change? Check this step still applies`);
}
writeFileSync(indexPath, html);

// Workbox's generated manifest: `{url:"index.html",revision:"..."}`, quoted
// with backticks or double quotes depending on the minifier.
let sw = readFileSync(swPath, "utf8");
const indexEntry = /\{url:([`"])index\.html\1,revision:([`"])[0-9a-f]+\2\}/g;
const found = sw.match(indexEntry) ?? [];
if (found.length !== 1) {
  fail(`expected one precache entry for index.html in ${swPath}, found ${found.length}`);
}
const q = found[0][5];
const entries = [
  `{url:${q}index.html${q},revision:${q}${md5(html)}${q}}`,
  // The file name carries the content's hash, as Kit's immutable files do.
  ...extracted.map((file) => `{url:${q}${file}${q},revision:null}`),
];
sw = sw.replace(indexEntry, entries.join(","));
writeFileSync(swPath, sw);

console.log(`extract-inline-scripts: moved ${extracted.length} inline script(s) to ${extracted.join(", ")}`);
