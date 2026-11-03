// Test support for the query modules: stubs `fetch` and records each request.
import { vi } from "vitest";

export type Recorded = { method: string; path: string; body: unknown };

/** Answer every request with `body` (status 200) and record method, path and JSON body. */
export function recordFetch(body: unknown = {}): Recorded[] {
  const calls: Recorded[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input, "http://console.test");
      calls.push({
        method: init?.method ?? "GET",
        path: url.pathname + url.search,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
  return calls;
}
