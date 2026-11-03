// The feedback list query, with the React console's keys. Feedback is read-only in the
// console, so there are no mutations and no detail keys.
import { createQuery, queryOptions, type Accessor } from "@tanstack/svelte-query";
import { feedbackApi } from "#lib/api/index.js";

/** Filters and paging for a feedback list (`feedbackApi.list`). */
export type FeedbackListParams = NonNullable<Parameters<typeof feedbackApi.list>[0]>;

/** Query keys: `["feedback"]`, `["feedback", "list"]`, `["feedback", "list", params]`. */
export const feedbackKeys = {
  all: ["feedback"] as const,
  lists: () => [...feedbackKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...feedbackKeys.lists(), params] as const,
};

/** Options for one page of feedback. */
export function feedbackListOptions(params?: FeedbackListParams) {
  return queryOptions({
    queryKey: feedbackKeys.list(params ?? {}),
    queryFn: () => feedbackApi.list(params),
  });
}

/** Replaces `useFeedback(params)`. `params` is a getter, so the query follows reactive filters. */
export function createFeedback(params: Accessor<FeedbackListParams | undefined> = () => undefined) {
  return createQuery(() => feedbackListOptions(params()));
}
