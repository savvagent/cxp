// Reads the built console in `dist/`. `pnpm build` runs before `pnpm test` in
// the gate and in CI, so a missing file is a failure: a skipped check would
// pass without proving anything.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The built console, as the server serves it under /console/. */
export const DIST = fileURLToPath(new URL("../dist/", import.meta.url));

export const distPath = (file: string) => `${DIST}${file}`;

export const readDist = (file: string) => readFileSync(distPath(file), "utf8");

export const md5 = (text: string) => createHash("md5").update(text).digest("hex");

/** One entry of the service worker's precache manifest. */
export interface PrecacheEntry {
  url: string;
  revision: string | null;
}

/** The precache manifest Workbox wrote into `sw.js`. */
export function precacheManifest(sw: string): PrecacheEntry[] {
  const entries: PrecacheEntry[] = [];
  const entry = /\{url:([`"])(.*?)\1,revision:(?:([`"])([0-9a-f]+)\3|null)\}/g;
  for (const m of sw.matchAll(entry)) {
    entries.push({ url: m[2], revision: m[4] ?? null });
  }
  return entries;
}
