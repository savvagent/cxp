# Web console on SvelteKit 3 / Svelte 5 and Tailwind 4

**Status:** IN PROGRESS (#67)
**Epic:** savvagent/cxp#67

## Goal

Rebuild the web console (`apps/web`, React 19 + Vite + Tailwind 3) on SvelteKit 3 / Svelte 5 with
Tailwind 4. Console users see the same features at the same `/console/` URLs. New console work is
then built on the Svelte stack.

## Success criteria

1. Every current route works on the new console with the same behaviour: dashboard, customers
   (+ detail), tickets (+ detail), feedback, surveys (+ detail), catalog experiences / applications
   / pages / components, the command palette, and sign-in/sign-out.
2. The build is a static SPA (`@sveltejs/adapter-static` 4, `fallback: 'index.html'`,
   `ssr = false`, `paths.base = '/console'`) whose output is what `CXP_CONSOLE_DIR` serves. The
   image has no Node runtime, and `crates/` is unchanged.
3. The built service worker answers only `/console` navigations from cache and never `/auth`,
   `/api`, `/mcp`, `/.well-known` or `/platform`. `test/service-worker.test.ts` (or its port)
   passes against the built `sw.js`.
4. Tailwind 4 (Vite plugin, CSS-first config). No `tailwind.config.ts` or PostCSS config remains.
5. All gates pass: the pnpm gate (with `svelte-check` in the build), `podman build -t
   otto-cxp:check .`, and CI's `web` and `docker-build` jobs. No React dependency remains in the
   console package.

## Non-goals

- `packages/react` (`@cxp/react`) and `sdk/typescript` (`@cxp/sdk`): unchanged.
- Server-side rendering, `adapter-node`, or any new server process.
- Changes to the Rust server, `/auth/*`, the session cookie, or the REST API (`crates/` unchanged).
- New console features or a visual redesign.

## Design decisions

- **Side by side.** The new app is built at `apps/console` (package `@cxp/console`, AGPL-3.0-or-later)
  on the epic branch while `apps/web` keeps building. The cutover story deletes `apps/web` and moves
  `apps/console` to `apps/web` as `@cxp/web`, so gate paths, the reviewer mapping, the Dockerfile
  `COPY` and `CXP_CONSOLE_DIR` keep their shape. Nothing reaches `main` before the epic PR.
- **Versions.** `@sveltejs/kit` ^3.1, `svelte` ^5.57, `@sveltejs/vite-plugin-svelte` ^7,
  `@sveltejs/adapter-static` ^4, `vite` ^8, `typescript` ^6 (Kit 3's peer range, not 7), `vitest`
  ^5, `svelte-check` ^4, `@tailwindcss/vite` ^4, `@vite-pwa/sveltekit` ^2 (with its peers
  `rolldown` and `magicast` explicit), `bits-ui` ^2 via shadcn-svelte, `@tanstack/svelte-query` ^6,
  `@lucide/svelte`, `svelte-sonner`, `layerchart` ^2, `zod`. pnpm 9.15.9 (the lockfile's major,
  CI's and the Dockerfile's pin).
- **Forms:** Svelte 5 runes + zod in every story. No superforms. zod is imported only through
  `#lib/zod`, which sets `jitless: true` before any schema is built: the CSP has no
  `'unsafe-eval'`, and zod's JIT probe (`Function("")`) would otherwise report a violation on
  every page (#77).
- **No inline script.** The server's CSP is `script-src 'self'` and `crates/` cannot change, so a
  post-build step moves Kit's inline bootstrap out of `dist/index.html` into an external file; a
  test fails on any `<script>` without `src`. The service worker registers through
  `virtual:pwa-register`, never inline; nothing injects a head script (no `mode-watcher`).
- **Routing:** `trailingSlash: 'never'` (the default). The root is `/console/`, other routes are
  `/console/tickets` etc., matching today's URLs, the server's `/console` → `/console/` redirect,
  and its `index.html` fallback.
- **`appDir` stays `_app`.** Hashed files get the server's revalidating cache header rather than
  `immutable` (only `/console/assets/*` is immutable); the service worker precache hides the cost.
  Accepted rather than changing `crates/`.
- **Service worker:** `@vite-pwa/sveltekit` with `kit: { spa: true, adapterFallback: 'index.html',
  trailingSlash: 'never' }` and `workbox.navigateFallback` / allowlist / denylist set explicitly
  from `src/pwa.ts`'s lists, unchanged.
- **Build:** `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json && vite build && <boot
  extraction>`; `svelte-check` fails on errors and covers `test/`.
- **Library mapping:** react-router → file routes; TanStack Query → `@tanstack/svelte-query`;
  shadcn/Radix → shadcn-svelte (bits-ui), regenerated; recharts → LayerChart (shadcn-svelte
  `chart`); cmdk → shadcn-svelte `command`; lucide-react → `@lucide/svelte`; sonner →
  `svelte-sonner`; vite-plugin-pwa → `@vite-pwa/sveltekit`.
- **`#lib`, not `$lib`.** Kit 3 removed `$lib`; `package.json` `imports` maps `#lib/*` to
  `./src/lib/*`, so imports carry an extension (`#lib/query-client.js`). shadcn-svelte's
  `components.json` aliases use `#lib/...` too.
- **Framework-free code** in `src/lib` (`api/*`, `api-client`, `api-error`, `types`, `session`)
  carries over with its tests. Logic the old tests imported from `.tsx` files moves to `.ts`
  modules (`catalog-filters.ts`, `surveys.ts`).

## Stories

| Story | Batch | Depends on | Owns |
|---|---|---|---|
| #69 S1 Scaffold, toolchain, PWA, lib | 0 | none | `apps/console/**` at creation, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, root `package.json`, `Dockerfile`/`.dockerignore` if needed |
| #70 S2 UI kit and shared components | 1 | S1 | `src/lib/components/ui/**`, `src/lib/components/shared/**`, `components.json` |
| #71 S3 Query modules | 1 | S1 | `src/lib/queries/**` |
| #72 S4 Shell, auth, command palette, dashboard | 2 | S2, S3 | `src/routes/+layout.svelte`, `src/lib/components/{layout,auth}/**`, `command-palette.svelte`, `src/routes/dashboard/**` |
| #73 S5 Customers | 2 | S2, S3 | `src/routes/customers/**`, `src/lib/components/customers/**` |
| #74 S6 Tickets | 2 | S2, S3 | `src/routes/tickets/**`, `src/lib/components/tickets/**` |
| #75 S7 Feedback and surveys | 2 | S2, S3 | `src/routes/{feedback,surveys}/**`, `src/lib/components/surveys/**` |
| #76 S8 Catalog | 2 | S2, S3 | `src/routes/catalog/**`, `src/lib/components/catalog/**` |
| #77 S9 Cutover | 3 | all | delete `apps/web`, move `apps/console` → `apps/web`, Dockerfile, `.dockerignore`, root files, CI, `CLAUDE.md`, `README.md`, `.env.example`, `docs/deploy/fly.md`, this spec |

Batch-2 stories never edit `package.json`, `pnpm-lock.yaml`, `src/lib/components/{ui,shared}/**`,
`src/lib/queries/**`, `src/lib/*.ts` or `app.css`; a needed change there is an integration fix on
the epic branch after the batch.

Every story runs the pnpm gate and `podman build -t otto-cxp:check .`, whatever the CLAUDE.md path
lists say (they name only `apps/web/**`), and records a browser smoke test of its routes against
`cargo run -p cxp-server` serving the built console.

## Risks

- Kit 3 docs and examples are thin; Kit 2 idioms may not apply.
- shadcn-svelte's CLI fetches from its registry over the network and needs `svelte-kit sync` first.
- The boot-script extraction depends on Kit's generated HTML shape; its test is the guard.
