# Console on the shared console-ui shell: Implementation Plan

> Execute task-by-task (fresh implementer per task, review between tasks). Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** The web console renders inside `@savvagent/console-ui@0.2.0` (header, footer, theme,
locale, components), and `/auth/session` returns what the shell's `ConsoleSession` needs.

**Architecture:** `/auth/session` adds `user`, `org` and `platformUrl` from the verified principal
plus the platform's member lookup; the console's CSP admits the platform origin in `connect-src`
for the shell's service list; `apps/web` swaps its local shadcn copies, locale module and header for
the package's; installs authenticate to GitHub Packages with `NODE_AUTH_TOKEN`.

**Tech stack:** Rust (axum, sqlx tests), SvelteKit 3 / Svelte 5, Tailwind 4, Paraglide, pnpm 9.

**Ticket:** savvagent/cxp#82 (part of savvagent/platform#154)

**Spec:** `docs/specs/2026-11-05-console-ui-shell-design.md`

## Global Constraints

- Worktree only: `/home/robhicks/dev/savvagent-services/cxp/.claude/worktrees/feat-82-console-ui`
  (branch `feat/82-console-ui`); trunk changes only through the PR.
- Every shell that runs pnpm first runs `export NODE_AUTH_TOKEN=$(gh auth token)`; pnpm is
  `npx -y pnpm@9.15.9` (CI's and the Dockerfile's major).
- Gates:
  - `DATABASE_URL=postgres://cxp:cxp@localhost:15435/otto_cxp cargo test --workspace --locked`
  - `cargo clippy --workspace --all-targets --locked -- -D warnings`
  - `cargo fmt --all -- --check`
  - `git diff --name-status --diff-filter=MDR origin/main...HEAD -- 'crates/*/migrations/*'`
    prints nothing
  - `podman build --secret id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN -t otto-cxp:check .`
  - `pnpm install --frozen-lockfile && pnpm lint && pnpm build && pnpm test` (repo root)
- Evidence: pass counts per test binary. A `cargo test` panic about `DATABASE_URL` is a missing
  variable, not a pass. `DATABASE_URL` is the local Postgres only.
- Invariants: org and user ids only from the verified principal; the console session cookie, the
  stored tokens and their refresh are untouched; no SQL outside `cxp-core`; no migration;
  `script-src 'self'` with no inline script; licensing unchanged.
- The GitHub token never lands in a file, an image layer, an `ARG` or an `ENV`.
- No attribution of any kind in commits, code, docs or the PR.
- Commits: `<type>(<scope>): <imperative, lower-case>`, body explains why, ends `Refs #82` (the
  squash merge's PR body carries `Fixes #82`).

## Tasks

### Task 1: `/auth/session` carries the user, the org and the platform URL

**Model:** sonnet

**Files:**
- Modify: `crates/cxp-http/src/console/routes.rs` (`SessionView`, `session`)
- Modify: `crates/cxp-http/src/console/mod.rs` (a `pub(crate)` way for `routes.rs` to reach the
  `PlatformClient` and the platform URL, if not already reachable through `console.inner`)
- Modify: `crates/cxp-api/tests/console.rs` (stub route, assertions, new tests)

- [ ] **Step 1: stub the member API.** In `start_platform`, add
  `GET /internal/orgs/{org}/members/{user}` answering from a new `Platform` field
  `members: HashMap<(Uuid, Uuid), MemberMode>` where the mode is "member" (default when absent:
  answer `MemberInfo { user: { id: user, email: "ada@acme.test", name: "Ada" }, org: { id: org,
  slug: "acme", name: "Acme", plan: "pro" }, role: admin }`), `Absent` (404), `Other` (a member
  whose `org.id` is a fresh uuid), or `Down` (503). Use `savvagent_resource::{MemberInfo,
  UserInfo, OrgInfo}` for the body.
- [ ] **Step 2: failing tests.** Update `the_console_signs_in_through_the_platform`: the signed-in
  body is the old fields plus `"user": {"id": user, "email": "ada@acme.test", "name": "Ada"}`,
  `"org": {"id": org, "slug": "acme", "name": "Acme"}`, `"platformUrl": <stub base>`; the
  signed-out body is `{"signedIn": false, "loginEnabled": true, "platformUrl": <stub base>}`.
  `with_the_console_off_…` keeps `{"signedIn": false, "loginEnabled": false}` exactly. Add:
  `a_session_whose_member_is_gone_is_signed_out` (Absent → signed out with `platformUrl`, `200`),
  `a_session_the_platform_answers_for_another_org_is_refused` (Other → `500`, `code: internal`),
  `a_session_is_503_while_the_member_lookup_is_down` (Down → `503`, `Retry-After` set).
  Run `DATABASE_URL=postgres://cxp:cxp@localhost:15435/otto_cxp cargo test -p cxp-api --test console --locked`; see them fail.
- [ ] **Step 3: implement.** `SessionView` gains `user: Option<UserView>`, `org: Option<OrgView>`,
  `platform_url: Option<String>` (camelCase, `skip_serializing_if = "Option::is_none"`);
  `UserView { id: Uuid, email: Option<String>, name: Option<String> }` (email and name serialize as
  `null` when absent), `OrgView { id: Uuid, slug: String, name: String }`. After
  `console.authenticate(cookie)` succeeds, call `platform.member(p.org_id.as_uuid(),
  p.user_id.as_uuid())`: `Ok(Some(m))` with `m.user.id == p.user_id` and `m.org.id == p.org_id` →
  signed in, ids from `p`; ids differ → `tracing::error!` (no names or emails logged) and
  `internal()`; `Ok(None)` → signed out; `Err(e)` → `unavailable()` when `e.is_retriable()`, else
  `tracing::error!` and `internal()`. `platformUrl` is `settings.platform_url` whenever the console
  is configured (signed in or out), absent when it is not.
- [ ] **Step 4: pass.** Re-run the console test binary, then the full gates (test, clippy, fmt).
- [ ] **Step 5: commit** `feat(console): return the user, org and platform url from /auth/session`.

Reminders: org/user ids only from the principal; the member call uses the service credential, never
the stored token; nothing about the cookie or refresh changes; no SQL.

### Task 2: the console's CSP admits the platform origin for `connect-src`

**Model:** sonnet

**Files:**
- Modify: `crates/cxp-server/src/lib.rs` (`CONSOLE_CSP`, `ConsoleAssets`, `router`, tests)

- [ ] **Step 1: failing test.** In the console-serving test (the one asserting
  `headers["content-security-policy"]`), build the app with a known platform URL and assert the
  exact header `default-src 'self'; script-src 'self'; connect-src 'self' <platform origin>;
  style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'self';
  frame-ancestors 'none'`, keep the directive and no-`unsafe`-script checks, and add a unit test of
  the builder: a URL with a path and trailing slash (`https://savvagent.com/x/`) yields
  `https://savvagent.com`; a loopback `http://127.0.0.1:3000` yields itself. Run
  `DATABASE_URL=… cargo test -p cxp-server --lib --locked`; see it fail.
- [ ] **Step 2: implement.** Replace the constant with `fn console_csp(platform_origin: &str) ->
  String` (same directives, `connect-src 'self' {origin}`), the origin from
  `url::Url::parse(&config.platform_url)?.origin().ascii_serialization()`; `ConsoleAssets` holds the
  `HeaderValue`, built once in `router` (a parse failure is a startup error, as other config
  errors are). Doc comment says why (the shared shell's service list, savvagent/cxp#82).
- [ ] **Step 3: pass.** The lib tests, then the full gates.
- [ ] **Step 4: commit** `feat(server): let the console reach the platform's service list`.

### Task 3: install `@savvagent/console-ui` from GitHub Packages everywhere

**Model:** orchestrator (mechanical edits, reviewed like any task)

**Files:**
- Create: `.npmrc` (already in the worktree, uncommitted)
- Modify: `apps/web/package.json`, `pnpm-lock.yaml` (dependency already added, uncommitted)
- Modify: `Dockerfile`, `.github/workflows/ci.yml`, `docs/deploy/fly.md`, `CLAUDE.md`

- [ ] **Step 1: `.npmrc`** holds exactly the two lines from the spec (placeholder, no token).
- [ ] **Step 2: Dockerfile console stage.** `COPY .npmrc` with the manifests; the install becomes
  `RUN --mount=type=secret,id=NODE_AUTH_TOKEN --mount=type=cache,… sh -c 'test -s
  /run/secrets/NODE_AUTH_TOKEN || { echo "build with --secret id=NODE_AUTH_TOKEN (a token that can
  read @savvagent packages)" >&2; exit 1; }; NODE_AUTH_TOKEN="$(cat /run/secrets/NODE_AUTH_TOKEN)"
  pnpm install --frozen-lockfile --filter @cxp/web'`. A comment says why (GitHub Packages; a
  secret mount keeps the token out of every layer). No `ARG`/`ENV` for it.
- [ ] **Step 3: CI.** `web`: job `permissions: { contents: read, packages: read }`, `env:
  NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` on the `pnpm install` step. `docker-build`: the
  same permissions; build-push-action `secrets: | NODE_AUTH_TOKEN=${{ secrets.GITHUB_TOKEN }}`.
  `deploy`: `permissions: { contents: read, packages: read }`; the build step passes
  `--build-secret NODE_AUTH_TOKEN="$NODE_AUTH_TOKEN"` with `NODE_AUTH_TOKEN: ${{
  secrets.GITHUB_TOKEN }}` in its env.
- [ ] **Step 4: docs.** `docs/deploy/fly.md`: every hand `fly deploy … --build-only`/`--remote-only`
  build command gains `--build-secret NODE_AUTH_TOKEN="$(gh auth token)"`, with one sentence on
  why. `CLAUDE.md`: the bootstrap pnpm line becomes `export NODE_AUTH_TOKEN=$(gh auth token) && pnpm
  install --frozen-lockfile`; the `podman build` gate becomes `podman build --secret
  id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN -t otto-cxp:check .`; the Architecture line for
  `apps/web` names the shell package and drops `src/lib/locale.ts`.
- [ ] **Step 5: verify.** `npx -y pnpm@9.15.9 install --frozen-lockfile` from the root;
  `podman build --secret id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN -t otto-cxp:check .` succeeds, and
  without the secret fails with the message; `podman history --no-trunc otto-cxp:check` and
  `podman run --rm --entrypoint sh` are not needed (the runtime image has no console stage
  files besides `/srv/console`) — instead grep the build log for the token's first 8 characters
  (must not appear).
- [ ] **Step 6: commit** `build(web): install @savvagent/console-ui from github packages`.

### Task 4: components, utilities and theme from the package

**Model:** orchestrator (a mechanical import rewrite, reviewed like any task)

**Files:**
- Delete: `apps/web/src/lib/components/ui/{badge,button,card,command,dialog,dropdown-menu,input,input-group,label,select,separator,sheet,skeleton,table,tabs,textarea,tooltip}/`
- Modify: every importer of `#lib/components/ui/<name>/index.js` (keep `ui/sonner`)
- Modify: `apps/web/src/lib/utils.ts` (re-export `cn` and the four prop types from the package)
- Modify: `apps/web/src/app.css` (`@import "tailwindcss"; @import "@savvagent/console-ui/theme.css";`
  and nothing the theme defines)
- Modify: `apps/web/package.json`, `pnpm-lock.yaml` (drop `bits-ui`, `tailwind-variants`,
  `tailwind-merge`, `clsx`, `tw-animate-css`, `@internationalized/date` when nothing in `src`
  imports them; `@lucide/svelte` to the package's range so one copy installs)

- [ ] **Step 1:** rewrite imports (`#lib/components/ui/button/index.js` →
  `@savvagent/console-ui/ui/button`, same named exports and namespace imports), delete the 17
  directories, update `utils.ts`, `app.css`, dependencies.
- [ ] **Step 2: verify.** `pnpm build` (svelte-check fails on any export the package lacks) and
  `pnpm test` in `apps/web`; `grep -rn "components/ui/" apps/web/src` shows only `sonner`;
  `pnpm-lock.yaml` has one `bits-ui` and one `@lucide/svelte`.
- [ ] **Step 3: commit** `refactor(web): build the console from @savvagent/console-ui components`.

### Task 5: the shared shell, session and locale

**Model:** sonnet

**Files:**
- Delete: `apps/web/src/lib/components/layout/header.svelte`, `apps/web/src/lib/locale.ts`,
  `apps/web/src/lib/locale.test.ts`
- Modify: `apps/web/src/routes/+layout.svelte`, `apps/web/src/lib/components/layout/root-layout.svelte`,
  `apps/web/src/lib/components/auth/sign-in.svelte`, `apps/web/src/lib/session.ts`,
  `apps/web/src/lib/session.test.ts`, `apps/web/src/lib/format.ts` (comment), `CLAUDE.md` if it
  still names `locale.ts`

- [ ] **Step 1: failing tests** in `session.test.ts`: the schema accepts the new signed-in body
  (with and without `user.locale`), rejects one missing `org`, accepts signed-out with and without
  `platformUrl`; `toConsoleSession` returns `{ user, orgs: [org], currentOrg: org, platformUrl }`
  with `org.role` from `role`. Run `pnpm test` in `apps/web`; see them fail.
- [ ] **Step 2: session.** Extend the schema (`user: {id: guid, email: string|null, name:
  string|null, locale?: string|null}`, `org: {id: guid, slug, name}`, `platformUrl: string`);
  signed out `platformUrl` optional; add `toConsoleSession`.
- [ ] **Step 3: locale.** `+layout.svelte` calls `resolveAtBoot(overwriteGetLocale)` from
  `@savvagent/console-ui` with `#lib/paraglide/runtime.js`'s `overwriteGetLocale`; delete
  `locale.ts` and its test. In `root-layout.svelte`, an `$effect` calls
  `reconcile(session.data.user.locale)` when signed in.
- [ ] **Step 4: shell.** `root-layout.svelte` per the spec's layout block: `ConsoleHeader`
  (`service="cxp"`, `session={toConsoleSession(data)}`, `onSignOut={signOut}`, `nav` snippet with
  the mobile menu button and the ⌘K search button, both with their old classes and labels),
  sidebar and mobile nav beside a scrolling column holding `<main>` (first child
  `<h1 class="sr-only">{routeTitle(page.url.pathname)}</h1>`) and `ConsoleFooter`. Delete
  `header.svelte`. `sign-in.svelte` (or `root-layout.svelte`) renders `ConsoleHeader
  platformUrl service="cxp"` above and `ConsoleFooter` below the card when the signed-out
  session has a `platformUrl`.
- [ ] **Step 5: pass.** `pnpm build && pnpm test` in `apps/web` (`test/index-html.test.ts` still
  finds no inline script).
- [ ] **Step 6: commit** `feat(web): render the console inside the shared savvagent shell`.

### Task 6: screenshot check (no repo changes)

**Model:** orchestrator

- [ ] Build `apps/web`, serve `dist` with the scratch harness (stubbed `/auth/session` with the new
  fields, `/api/v1`, `/services/v1.json`), capture the same routes as the baseline (desktop: six
  routes; mobile: dashboard and tickets; light and dark), plus the sign-in screen, and compare with
  the baseline from `main`. Screenshots stay in the session scratchpad. Record the summary in the
  PR body.
