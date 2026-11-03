// The dashboard's metrics query, with the React console's key.
import { createQuery, queryOptions } from "@tanstack/svelte-query";
import { dashboardApi } from "#lib/api/index.js";

/** Query keys: `["dashboard"]`, `["dashboard", "metrics"]`. */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
};

/** Options for the dashboard's metrics. */
export function dashboardMetricsOptions() {
  return queryOptions({
    queryKey: dashboardKeys.metrics(),
    queryFn: () => dashboardApi.metrics(),
  });
}

/** Replaces `useDashboardMetrics()`. */
export function createDashboardMetrics() {
  return createQuery(() => dashboardMetricsOptions());
}
