// The built service worker, read from `dist/`. `pnpm build` runs before
// `pnpm test` in the gate and in CI, so a missing worker is a failure: a
// skipped check would pass without proving anything.
import { existsSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { distPath, readDist } from "./build-output";

const ORIGIN = "https://cxp.test";

describe("the built service worker", () => {
  it("exists (run `pnpm build` first)", () => {
    expect(existsSync(distPath("sw.js")), distPath("sw.js")).toBe(true);
  });

  it("answers only the console's routes with the console's app shell", () => {
    const source = readDist("sw.js");
    // The minifier quotes strings with backticks or double quotes.
    expect(source).toMatch(/[`"]\/console\/index\.html[`"]/);
    expect(source).toContain("allowlist");
    expect(source).toContain("^\\/console");
  });

  it("never answers the server's paths with the app shell", () => {
    const source = readDist("sw.js");
    expect(source).toContain("denylist");
    for (const prefix of ["auth", "api", "mcp", "\\.well-known", "platform"]) {
      expect(source, prefix).toContain(`^\\/${prefix}`);
    }
  });
});

// The worker itself, run in a sandbox that stands in for the browser's
// service worker scope at /console/sw.js, then sent navigations.

type Listener = (event: unknown) => void;

/** Runs `dist/sw.js` and returns a function that dispatches a navigation to it. */
function startWorker() {
  const location = new URL(`${ORIGIN}/console/sw.js`);
  /** A worker's `Request`, which resolves a relative URL against the worker's location, as a browser's does. */
  class WorkerRequest extends Request {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(typeof input === "string" ? new URL(input, location).href : input, init);
    }
  }
  /** The browser's fetch event, as far as Workbox reads it. */
  class FetchEvent {
    readonly type = "fetch";
    answer: Promise<Response> | null = null;
    constructor(readonly request: Request) {}
    respondWith(response: Promise<Response> | Response) {
      this.answer = Promise.resolve(response);
    }
    waitUntil() {}
  }
  const listeners: Record<string, Listener[]> = {};
  /** The cache keys the worker read from its precache. */
  const cacheReads: string[] = [];
  const scope: Record<string, unknown> = {
    console,
    FetchEvent,
    URL,
    Request: WorkerRequest,
    Response,
    Headers,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    location,
    registration: { scope: `${ORIGIN}/console/` },
    addEventListener: (type: string, fn: Listener) => {
      (listeners[type] ??= []).push(fn);
    },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
    caches: {
      match: async (request: Request | string) => {
        cacheReads.push(typeof request === "string" ? request : request.url);
        return new Response("<app shell>", { headers: { "content-type": "text/html" } });
      },
      open: async () => ({
        match: async () => undefined,
        put: async () => {},
        keys: async () => [],
        delete: async () => true,
      }),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async (input: Request | string) => {
      throw new Error(`the test worker went to the network for ${String(input)}`);
    },
    importScripts: (...urls: string[]) => {
      for (const url of urls) {
        const file = new URL(url, `${ORIGIN}/console/sw.js`).pathname.slice("/console/".length);
        vm.runInContext(readDist(file), context, { filename: file });
      }
    },
  };
  scope.self = scope;
  const context = vm.createContext(scope);
  vm.runInContext(readDist("sw.js"), context, { filename: "sw.js" });

  /** Navigates to `path`; resolves to the response the worker answered with, or null when it left it to the network. */
  return {
    cacheReads,
    async navigate(path: string): Promise<Response | null> {
      const request = new Request(`${ORIGIN}${path}`);
      // `mode` is read-only on a constructed Request, and "navigate" cannot be passed in.
      Object.defineProperty(request, "mode", { value: "navigate" });
      const event = new FetchEvent(request);
      for (const fn of listeners.fetch ?? []) fn(event);
      return event.answer;
    },
  };
}

// Workbox tests both lists against `pathname + search`.
const SERVER_PATHS = [
  "/auth/login?next=%2Fconsole%2Ftickets",
  "/auth/callback?code=x&state=y",
  "/auth/session",
  "/auth",
  "/api/v1/customers",
  "/mcp",
  "/.well-known/oauth-protected-resource",
  "/platform/webhooks",
];
// The server's, not the console's: `/` is the connector install page.
const NOT_CONSOLE = ["/", "/dashboard", "/tickets/1", "/consoles", "/nope"];
const CONSOLE_ROUTES = [
  "/console",
  "/console/",
  "/console/dashboard",
  "/console/tickets/1",
  "/console/customers/x?tab=y",
  "/console/catalog/pages?tab=x",
];

describe("the running service worker", () => {
  it("answers the console's navigations from its precached app shell", async () => {
    const worker = startWorker();
    for (const path of CONSOLE_ROUTES) {
      const answer = await worker.navigate(path);
      expect(answer, path).not.toBeNull();
      expect(await answer!.text(), path).toBe("<app shell>");
    }
    // Every answer came from the precached index.html, at its revision.
    expect(worker.cacheReads.length).toBeGreaterThan(0);
    for (const key of worker.cacheReads) {
      expect(key).toMatch(new RegExp(`^${ORIGIN}/console/index\\.html\\?__WB_REVISION__=[0-9a-f]+$`));
    }
  });

  it("leaves the server's own paths, and every path outside /console/, to the network", async () => {
    const worker = startWorker();
    for (const path of [...SERVER_PATHS, ...NOT_CONSOLE]) {
      expect(await worker.navigate(path), path).toBeNull();
    }
    expect(worker.cacheReads).toEqual([]);
  });
});
