# Web console on the shared `@savvagent/console-ui` shell

**Status:** IMPLEMENTED (#84)
**Ticket:** savvagent/cxp#82 (part of savvagent/platform#154)

## Brief

From the ticket, verbatim:

> ## Acceptance criteria
> - [ ] `apps/web` uses the shared header, footer and theme; `layout/header.svelte` is removed, and the sidebar is kept as CXP's own navigation.
> - [ ] Local shadcn-svelte components that duplicate the package are removed.
> - [ ] No visual regressions (screenshot check in light and dark).
>
> Part of savvagent/platform#154.

The run's brief adds: pin `@savvagent/console-ui@0.2.0` exactly, from GitHub Packages; imports point
at `@savvagent/console-ui/ui/*`; use the package's `resolveAtBoot` (with CXP's own Paraglide
runtime) and `reconcile`; keep `script-src 'self'` working; GitHub Packages auth wherever pnpm
installs (root `.npmrc`, CI `web` and `docker-build`, a BuildKit secret in the Dockerfile, a Fly
`--build-secret`); and, as a prerequisite, extend `GET /auth/session` additively with what the
shell's `ConsoleSession` needs (the user's id, email and name; the org's id, slug and name with the
role; `platformUrl`), with `#[sqlx::test]` tests. `--destructive` contrast is savvagent/console-ui#10
and is not worked around here.

## Premise corrections

1. **The platform's token introspection carries no names.** RFC 7662's response here is `sub`,
   `org_id`, `role`, `scope`, `aud`, `exp`, `client_id`, `token_type`, `token_kind`, `jti`
   (`savvagent_resource::IntrospectionResponse`). Names come from the platform's internal member
   API, `PlatformClient::member(org, user)` (`GET /internal/orgs/{org}/members/{user}`, this
   service's own credential, cached per `(org, user)`), which the MCP `whoami` tool already uses
   (`crates/cxp-mcp/src/tools/org.rs:34`). No call is made with the person's own token.
2. **No account locale exists to reconcile.** `savvagent_resource::UserInfo` is `{ id, email,
   name }` at the pinned rev and on platform `main` (0.19.0). `reconcile` is wired to an optional
   `user.locale` the server does not send yet, so it receives `undefined` and changes nothing until
   the platform exposes the locale (a platform change, out of scope).
3. **The console's CSP blocks the shell's service list.** `ConsoleHeader` fetches
   `${platformUrl}/services/v1.json` (cross-origin; the platform answers it with
   `Access-Control-Allow-Origin: *`), and `CONSOLE_CSP` is `connect-src 'self'`
   (`crates/cxp-server/src/lib.rs:258`). Without a change the header's service switcher would sit
   in its error state and every page would log a CSP violation. The fix is in `crates/`.
4. **The removed header held the page's only `<h1>`** (the route title); `PageHeader` renders an
   `<h2>`. The route title moves into `<main>` as a visually hidden `<h1>`, so the heading
   outline is unchanged; the visible route title in the top bar goes away with the bar (most pages
   repeat it in their own `PageHeader`).

## Assumptions

- **Service slug `cxp`**, as the platform's live `/services/v1.json` lists it.
- **One org per session**, as Tower's: `orgs = [currentOrg]`. The org switcher's other orgs would
  need a platform call per org the person belongs to; switching org is a fresh sign-in
  (`/auth/login?org=`), which the platform's org link already offers.
- **The sign-in screen gets the signed-out header and the footer** when the server reports a
  `platformUrl` (console sign-in configured). With sign-in off there is no platform URL to give
  the shell, so the screen stays as it is.
- **A member lookup that finds no active member answers signed out**, as an inactive token does:
  the platform no longer vouches for the membership, and the shell cannot render without the org's
  name. This only narrows `/auth/session`; `/api` authenticates the cookie exactly as before, so
  the auth invariant is unchanged. `PlatformClient` caches the miss briefly
  (`member_negative_ttl`), so a person re-added to the org reads as signed out until it lapses. A lookup that cannot be answered is `503` (retriable) or `500` (not), exactly as
  `authenticate` maps failures today.
- **`cn` and the shadcn prop types stay importable from `#lib/utils.js`** as a re-export of the
  package's, so `components.json`'s alias and the one local component (`sonner`) keep working.
- **CXP has no theme toggle** (none before, none in the shell); "dark" is the `.dark` class on
  `<html>`, which the screenshot check sets.
- **Direct dependencies only the deleted components used are dropped** (`bits-ui`,
  `tailwind-variants`, `tailwind-merge`, `clsx`, `tw-animate-css`, `@internationalized/date`), and
  `@lucide/svelte` moves to the package's range, so one copy of each ships.

## Goal & success criteria

The CXP console renders inside the shared Savvagent shell (header, footer, theme, locale) and builds
its UI from the package's components, with no visible change to its own pages.

- `layout/header.svelte` and the 17 duplicated `components/ui/*` directories are gone; every import
  is `@savvagent/console-ui/ui/<name>`; `sonner` (not in the package) stays local.
- `GET /auth/session` signed in also returns `user {id,email,name}`, `org {id,slug,name}` and
  `platformUrl`; signed out with sign-in configured returns `platformUrl`; the old fields are
  unchanged. Proved by `#[sqlx::test]` tests against a stub platform.
- Served console pages allow `connect-src` to the platform origin and still `script-src 'self'`
  only; the built `index.html` still has no inline script (`test/index-html.test.ts`).
- Every gate passes, including `podman build` with the GitHub Packages secret, and CI's `web` and
  `docker-build` install the package with the workflow token.
- Screenshots of six routes (desktop, light and dark) and two (mobile, light and dark), before and
  after, show the same page content; the only differences are the shell's header and footer.

## Scope

**In:** `crates/cxp-http` (`/auth/session`), `crates/cxp-server` (console CSP), `apps/web`, the
root `.npmrc`, `Dockerfile`, `.github/workflows/ci.yml`, `docs/deploy/fly.md`, `CLAUDE.md`.

**Out:** the account locale at the platform; an org list beyond the session's org; a theme toggle;
`--destructive` contrast (savvagent/console-ui#10); `packages/react` and `sdk/typescript`; moving
`scripts/check-messages.mjs` into the package.

## Architecture

### `/auth/session` (`crates/cxp-http/src/console/routes.rs:346`)

`SessionView` gains, additively (camelCase, skipped when absent):

```rust
user: Option<UserView>,       // { id, email: Option<String>, name: Option<String> }
org: Option<OrgView>,         // { id, slug, name }
platform_url: Option<String>, // CXP_PLATFORM_URL's origin, whenever console sign-in is configured
```

Flow when signed in: `console.authenticate(cookie)` yields the `Principal` (org and user from the
introspected, tombstone-checked token, exactly as today). Then `platform.member(p.org_id,
p.user_id)`:

| Platform answer | `/auth/session` |
|---|---|
| a member whose `user.id` and `org.id` equal the principal's | signed in, with `user`, `org`, `platformUrl` |
| a member whose ids differ | `500 internal`, logged at `error` (the platform answered for someone else) |
| no active member | signed out (`loginEnabled: true`, `platformUrl`) |
| retriable error | `503 unavailable` with `Retry-After` |
| other error | `500 internal` |

`user.id` and `org.id` in the response are the principal's, never the platform's echo; the names,
email and slug are display data. `role` stays the introspected role. The cookie, its attributes,
the stored token and how it is refreshed are untouched: the member lookup uses the service's
credential and reads nothing from the request but the cookie `authenticate` already verified.
`Console` gains a crate-private accessor for its `PlatformClient` (or the lookup lives on
`Console`) so `routes.rs` stays free of new state.

### Console CSP (`crates/cxp-server/src/lib.rs:258`)

`CONSOLE_CSP` becomes a function of the platform origin: `connect-src 'self' <origin>`, where
`<origin>` is `url::Url::parse(CXP_PLATFORM_URL)?.origin().ascii_serialization()` (validated at
config load: https, or http on loopback). Every other directive is unchanged. `ConsoleAssets`
carries the built `HeaderValue`; `ConsoleAssets::find` takes the origin. Tests assert the exact
header and that `script-src 'self'` has no `unsafe` source.

### Web console (`apps/web`)

- **Dependency:** `"@savvagent/console-ui": "0.2.0"` (exact). `app.css` imports
  `tailwindcss` then `@savvagent/console-ui/theme.css`, and keeps nothing the theme already
  defines (tokens, `dark` and `data-*` variants, `no-scrollbar`, base layer).
- **Components:** every `#lib/components/ui/<name>/index.js` import becomes
  `@savvagent/console-ui/ui/<name>`; the 17 local directories are deleted. `#lib/utils.ts`
  re-exports `cn` and the prop types from the package.
- **Locale:** `#lib/locale.ts` and its test are deleted. The root layout calls
  `resolveAtBoot(overwriteGetLocale)` (CXP's runtime) at the top of its script. Once the session
  is signed in, an effect calls `reconcile(session.user.locale)`; `locale` is optional in the
  schema and absent today, so this is a no-op until the platform sends it.
- **Session:** `sessionSchema` adds `user`, `org` and `platformUrl` (signed in, required) and
  `platformUrl` (signed out, optional). `toConsoleSession(s)` in `#lib/session.ts` maps it:
  `org = { ...s.org, role: s.role }`, `orgs = [org]`, `currentOrg = org`.
- **Shell (`root-layout.svelte`):**

  ```
  <div class="flex h-screen flex-col overflow-hidden">
    <ConsoleHeader session service="cxp" onSignOut={signOut}>
      {#snippet nav()} mobile menu button (md:hidden) · search button (⌘K, sm and up) {/snippet}
    </ConsoleHeader>
    <div class="flex flex-1 overflow-hidden">
      <Sidebar … />  <MobileNav … />
      <div class="flex flex-1 flex-col overflow-y-auto">
        <main class="flex-1 p-4 lg:p-6"> <h1 class="sr-only">{routeTitle}</h1> {children} </main>
        <ConsoleFooter platformUrl />
      </div>
    </div>
  </div>
  ```

  The sidebar keeps its own `h-14` row ("CXP" and the collapse toggle) at the top of the sidebar,
  under the shell header. Sign-out moves to the shell's account menu (same `signOut()`); `signOut` keeps its toast on a
  refusal. The loading and error states stay as they are (no platform URL is known yet).
- **Sign-in screen:** with a `platformUrl`, `ConsoleHeader platformUrl service="cxp"` (no
  `signedOut` snippet: the page's own button signs in) above the card, and `ConsoleFooter` below.
- **No inline script:** the shell adds none; `extract-inline-scripts.mjs` and
  `test/index-html.test.ts` are unchanged and keep proving it.

### Installs from GitHub Packages

- Root `.npmrc`: `@savvagent:registry=https://npm.pkg.github.com` and
  `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}` (a placeholder, never a token).
- CI `web`: `permissions: { contents: read, packages: read }`, `NODE_AUTH_TOKEN: ${{
  secrets.GITHUB_TOKEN }}` on the install step.
- CI `docker-build`: the same permissions; `docker/build-push-action` `secrets:
  NODE_AUTH_TOKEN=${{ secrets.GITHUB_TOKEN }}`.
- `Dockerfile` console stage: `COPY .npmrc`; the install `RUN` adds
  `--mount=type=secret,id=NODE_AUTH_TOKEN` and reads the file into the variable for that command
  only, failing with a message when it is missing. No `ARG`, no `ENV`, nothing in a layer.
- CI `deploy`: `packages: read`, and `flyctl deploy --build-only … --build-secret
  NODE_AUTH_TOKEN=…` from `secrets.GITHUB_TOKEN`.
- `docs/deploy/fly.md` hand deploys and `CLAUDE.md` (bootstrap, the `podman build` gate) gain
  `NODE_AUTH_TOKEN=$(gh auth token)` / `--secret id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN` /
  `--build-secret`.

## Invariants impact

- **Auth / console session cookie:** unchanged. `/auth/session` stays read-only and unauthenticated
  by design; it adds a platform read after the same `authenticate`. No credential moves to `/mcp`.
- **Org ids trusted only from the verified token:** the org and user ids returned are the
  principal's; the platform's echo is compared and a mismatch is refused.
- **Platform tokens encrypted at rest, never logged:** untouched; the lookup does not use them.
- **Untrusted text:** names and email are platform data rendered as text by Svelte (escaped).
- **No SQL outside `cxp-core`:** no SQL added. **Migrations:** none. **Metering:** none.
- **Licensing:** the package is the org's own, `UNLICENSED`, consumed (not vendored) by an
  AGPL app; no files of it are copied into the repo. See Risks: building the console now needs
  access to a private package.

## Migration

None.

## Out-of-band

- Package access (human: Rob, stated done in the run's brief): savvagent/cxp has Read access to
  the `console-ui` package's Actions settings. If it did not, the PR's `web` and `docker-build`
  jobs fail before merge.
- No recurring cost: no new app, machine, volume or paid service; the extra member lookup per
  `/auth/session` is cached per `(org, user)` by `PlatformClient`.
- No new config key or secret on Fly: `CXP_PLATFORM_URL` already exists. The deploy job's
  `GITHUB_TOKEN` must be able to read the package (Rob granted the repo Read access, per the
  brief); verified by CI's `docker-build` and `web` on the PR.
- A hand `fly deploy` now needs `--build-secret NODE_AUTH_TOKEN=$(gh auth token)` (documented).

## Error handling & edge cases

- Platform member API down: `/auth/session` is `503`; the console shows its existing "could not
  check your sign-in" state with a retry, as for any other session failure.
- Service list unreachable: the shell's own error state; the rest of the console works.
- `platformUrl` not https and not loopback: impossible by config validation; the shell would throw
  at render, so the config check is the guard.
- During a rolling deploy the new bundle can meet an old machine's `/auth/session` without
  `user`/`org`; the stricter schema rejects it and the console shows its "could not check your
  sign-in" state with a retry until the roll finishes. Accepted: it lasts seconds and recovers on
  retry.
- A session cached from before the deploy: the console refetches `/auth/session` on load; the
  service worker never caches `/auth`.

## Testing approach

- **Rust (`crates/cxp-api/tests/console.rs`, `#[sqlx::test]`):** the stub platform gains
  `GET /internal/orgs/{org}/members/{user}` (member, absent, mismatched ids, 503). Tests: signed in
  returns the new fields with the principal's ids; signed out includes `platformUrl`; console off
  omits it; no member → signed out; platform 503 → `503`; mismatched ids → `500`.
- **Rust (`crates/cxp-server/src/lib.rs` tests):** the console CSP carries the platform origin in
  `connect-src` and nothing else changed.
- **Web (vitest):** the session schema accepts the new shape and rejects a signed-in body without
  `org`; `toConsoleSession` maps it; `test/index-html.test.ts` still finds no inline script.
- **Gates:** every gate in `CLAUDE.md`, including `podman build` with the secret.
- **Screenshots:** a scratch harness serves `dist` with stubbed `/auth/session`, `/api/v1` and
  `/services/v1.json`; Playwright captures the routes before (main) and after, light and dark.
  Kept outside the repo.

## Risks & open questions

- **The public AGPL repo now builds against a private, `UNLICENSED` package.** savvagent/cxp is
  public; savvagent/console-ui is private. Nobody outside the org can build `apps/web` or the
  image from the published source, and pull requests from forks get a workflow token without
  package access, so their `web` and `docker-build` jobs fail. Savvagent holds both copyrights,
  so this is a policy choice, not a violation, but AGPL section 13's Corresponding Source for the
  served console is affected. **Human decision (Rob):** accept it, or publish console-ui under an
  AGPL-compatible licence (and make the package public). The brief chose this dependency, so
  the change ships and the decision is handed off.

- **Two copies of shared libraries** if CXP's direct ranges drift from the package's: mitigated by
  dropping the direct dependencies the package now provides.
- **Header height differs from the old 56px bar**, shifting page content; acceptable (the shell is
  shared by design), and the screenshot check shows it.
- **The deploy job's token and the package grant** cannot be tested before merge on `push` (only
  the `pull_request` jobs run); same token, same grant, so the PR's `docker-build` is the proxy.
