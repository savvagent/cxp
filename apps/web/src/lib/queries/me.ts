// The signed-in user's teams query, with the React console's keys.
import { createQuery, queryOptions } from "@tanstack/svelte-query";
import { meApi } from "#lib/api/index.js";

/** Query keys: `["me"]`, `["me", "teams"]`. */
export const meKeys = {
  all: ["me"] as const,
  teams: () => [...meKeys.all, "teams"] as const,
};

/** Options for the teams the signed-in person belongs to, from the otto platform. */
export function myTeamsOptions() {
  return queryOptions({
    queryKey: meKeys.teams(),
    queryFn: () => meApi.teams(),
  });
}

/** Replaces `useMyTeams()`. */
export function createMyTeams() {
  return createQuery(() => myTeamsOptions());
}
