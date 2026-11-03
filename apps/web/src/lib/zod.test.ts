import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z as zod } from "zod";

import { z } from "./zod.js";

const SRC = fileURLToPath(new URL("..", import.meta.url));
const SELF = join(SRC, "lib", "zod.ts");

/** Every app source under `src/`: TS, JS and Svelte modules (tests excluded). */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sources(path);
    return /\.(m?[jt]s|svelte)$/.test(e.name) && !/\.test\.m?[jt]s$/.test(e.name) ? [path] : [];
  });
}

/** `from "zod"`, a bare `import "zod"`, `import("zod")` or `require("zod")`, any subpath. */
const IMPORTS_ZOD = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']zod(?:\/[^"']*)?["']/;

describe("#lib/zod", () => {
  it("turns zod's JIT off, so no schema probes for eval under the server's CSP", () => {
    expect(z).toBe(zod);
    expect(z.config().jitless).toBe(true);
  });

  it("is the only module that imports zod directly", () => {
    const direct = sources(SRC)
      .filter((file) => file !== SELF)
      .filter((file) => IMPORTS_ZOD.test(readFileSync(file, "utf8")));
    expect(direct).toEqual([]);
  });

  it("recognises every way of importing zod", () => {
    for (const line of [
      'import { z } from "zod";',
      "import { z } from 'zod/v4';",
      'import * as z from "zod/mini";',
      'import "zod";',
      'const { z } = await import("zod");',
      'const { z } = require("zod");',
    ]) {
      expect(IMPORTS_ZOD.test(line), line).toBe(true);
    }
    expect(IMPORTS_ZOD.test('import { z } from "#lib/zod.js";')).toBe(false);
  });
});
