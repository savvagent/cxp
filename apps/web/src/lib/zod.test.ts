import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z as zod } from "zod";

import { z } from "./zod.js";

const SRC = fileURLToPath(new URL("..", import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sources(path);
    return /\.(ts|svelte)$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [path] : [];
  });
}

describe("#lib/zod", () => {
  it("turns zod's JIT off, so no schema probes for eval under the server's CSP", () => {
    expect(z).toBe(zod);
    expect(z.config().jitless).toBe(true);
  });

  it("is the only module that imports zod directly", () => {
    const direct = sources(SRC)
      .filter((file) => !file.endsWith(join("lib", "zod.ts")))
      .filter((file) => /from\s+["']zod(\/[^"']*)?["']/.test(readFileSync(file, "utf8")));
    expect(direct).toEqual([]);
  });
});
