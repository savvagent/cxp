// The console's sign-in, which the server runs: `/auth/login` sends the browser
// to the otto platform and back with an HttpOnly session cookie the console
// never sees; `/auth/session` says whether it is signed in, and as whom;
// `/auth/logout` ends it.
import type { ConsoleSession } from "@savvagent/console-ui";
import type { QueryClient } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { m } from "#lib/paraglide/messages.js";
import { z } from "#lib/zod.js";

/** Where the console lives. The server accepts a sign-in `next` only under it. */
export const CONSOLE_HOME = "/console/";

export const sessionKeys = {
  all: ["session"] as const,
};

const signedOutSchema = z.object({
  signedIn: z.literal(false),
  /** False while the server has no console client configured. */
  loginEnabled: z.boolean(),
  /** The platform's origin, for the shared header; absent while sign-in is off. */
  platformUrl: z.string().optional(),
});

// `z.guid()` is zod 3's `z.string().uuid()`: any 8-4-4-4-12 hex id. zod 4's
// `uuid()` also checks the RFC 9562 version and variant bits, which the
// console has never required of the platform's ids.
const signedInSchema = z.object({
  signedIn: z.literal(true),
  loginEnabled: z.literal(true),
  userId: z.guid(),
  orgId: z.guid(),
  role: z.enum(["owner", "admin", "member"]),
  scopes: z.array(z.string()),
  /** Who is signed in, as the platform names them: the shared header's account menu. */
  user: z.object({
    id: z.guid(),
    email: z.string().nullable(),
    name: z.string().nullable(),
    /**
     * The account's chosen locale, `null` for none. The platform does not
     * expose it to services yet, so the server never sends it and
     * `reconcile` gets `undefined`, which changes nothing.
     */
    locale: z.string().nullable().optional(),
  }),
  /** The one org this session opens: the shared header's org switcher. */
  org: z.object({ id: z.guid(), slug: z.string(), name: z.string() }),
  /** The platform's origin, which every link in the shared shell is built from. */
  platformUrl: z.string(),
});

/** What `GET /auth/session` answers. */
export const sessionSchema = z.discriminatedUnion("signedIn", [signedOutSchema, signedInSchema]);

export type Session = z.infer<typeof sessionSchema>;
export type SignedIn = z.infer<typeof signedInSchema>;
export type SignedOut = z.infer<typeof signedOutSchema>;

/**
 * The shared shell's view of a session. A CXP session opens exactly one org,
 * so that org is both the current one and the only one offered; switching org
 * is a fresh sign-in, which the platform's org page starts.
 */
export function toConsoleSession(s: SignedIn): ConsoleSession {
  const org = { id: s.org.id, slug: s.org.slug, name: s.org.name, role: s.role };
  const { id, email, name } = s.user;
  return { user: { id, email, name }, orgs: [org], currentOrg: org, platformUrl: s.platformUrl };
}

/**
 * Why the last sign-in failed, from the `login_error` the server redirects
 * with. Messages, not strings: each is read when shown, in the active locale.
 */
export const LOGIN_ERRORS: Record<string, () => string> = {
  access_denied: m.login_error_access_denied,
  invalid_state: m.login_error_invalid_state,
  platform_unavailable: m.login_error_platform_unavailable,
  unavailable: m.login_error_unavailable,
  failed: m.login_error_failed,
};

export function loginErrorMessage(search: string): string | null {
  const code = new URLSearchParams(search).get("login_error");
  if (code === null) return null;
  return (Object.hasOwn(LOGIN_ERRORS, code) ? LOGIN_ERRORS[code] : LOGIN_ERRORS.failed)();
}

/** The session, or a thrown error for a non-2xx answer or an unexpected body. */
export async function fetchSession(): Promise<Session> {
  const response = await fetch("/auth/session", { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(`Could not check the sign-in (${response.status})`);
  }
  const parsed = sessionSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("The server's sign-in answer was not understood");
  }
  return parsed.data;
}

/**
 * Show the sign-in screen: the API refused this browser's session. Keeps
 * whether sign-in is enabled from what the server last said; with nothing
 * known yet, asks the server again.
 */
export function markSignedOut(client: QueryClient): void {
  const previous = client.getQueryData<Session>(sessionKeys.all);
  if (previous === undefined) {
    void client.invalidateQueries({ queryKey: sessionKeys.all });
    return;
  }
  const signedOut: SignedOut = {
    signedIn: false,
    loginEnabled: previous.loginEnabled,
    ...(previous.platformUrl === undefined ? {} : { platformUrl: previous.platformUrl }),
  };
  client.setQueryData<Session>(sessionKeys.all, signedOut);
}

/** Where to send the browser to sign in, returning to `next` (a full path under `/console/`) afterwards. */
export function loginUrl(next: string): string {
  return `/auth/login?next=${encodeURIComponent(next)}`;
}

/**
 * Where to come back to after signing in: the browser's own path (which,
 * unlike the router's, includes `/console/`), or the console's home after a
 * failed attempt, so its error marker is not carried along.
 */
export function returnPath(location: Pick<Location, "pathname" | "search">): string {
  if (loginErrorMessage(location.search) !== null) return CONSOLE_HOME;
  if (!location.pathname.startsWith(CONSOLE_HOME)) return CONSOLE_HOME;
  return location.pathname + location.search;
}

/**
 * Sign out at the server, then leave. A refusal or an unreachable server is
 * shown, and the console stays as it is: the person is still signed in.
 */
export async function signOut(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    toast.error(m.signout_unreachable());
    return;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    toast.error(
      typeof body.error === "string" ? body.error : m.signout_failed({ status: String(response.status) }),
    );
    return;
  }
  window.location.assign(CONSOLE_HOME);
}
