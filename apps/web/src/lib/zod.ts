// The console's one way in to zod: every module imports `z` from here, never
// from "zod", so the configuration below runs before any schema is built.
//
// The server sends the console with `script-src 'self'` (no `'unsafe-eval'`),
// so zod's JIT can never run here, and each object schema would probe for it
// with `Function("")` when it is built: caught, but reported as a CSP
// violation on every page. Jitless skips the probe and parses the same way.
import { z } from "zod";

z.config({ jitless: true });

export { z };
