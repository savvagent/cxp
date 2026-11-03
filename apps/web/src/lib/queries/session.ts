// Port of the React console's src/hooks/use-session.ts. The key and the fetch live in
// `#lib/session.js`, which `apiFetch` uses to mark the console signed out.
import { createQuery, queryOptions } from "@tanstack/svelte-query";
import { fetchSession, sessionKeys } from "#lib/session.js";

export { sessionKeys };

/** How long a known sign-in state is trusted before it is checked again. */
export const SESSION_STALE_TIME = 60_000;

/** Options for whether this browser is signed in to the console, and as whom. */
export function sessionOptions() {
  return queryOptions({
    queryKey: sessionKeys.all,
    queryFn: fetchSession,
    staleTime: SESSION_STALE_TIME,
  });
}

/** Replaces `useSession()`. */
export function createSession() {
  return createQuery(() => sessionOptions());
}
