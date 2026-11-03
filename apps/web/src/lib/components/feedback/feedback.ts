// The feedback page's framework-free logic: the type options and badges, the
// `feedback_type` URL parameter, and what the list asks the API for. Kept out
// of the component so it is tested on its own.
import type { CatalogFilterValues } from "#lib/catalog-filters.js";
import { option } from "#lib/components/tickets/tickets.js";
import { m } from "#lib/paraglide/messages.js";
import { fromFilterSelect } from "#lib/forms.js";
import { PAGE_SIZE } from "#lib/pagination.js";
import type { FeedbackListParams } from "#lib/queries/feedback.js";
import { withParam } from "#lib/url-state.js";

/** The URL parameter holding the type filter. */
export const FEEDBACK_TYPE_PARAM = "feedback_type";

/** The feedback types, each label read in the active locale when shown. */
export const FEEDBACK_TYPES = [
  option("bug_report", m.feedback_type_bug_report),
  option("feature_request", m.feedback_type_feature_request),
  option("complaint", m.feedback_type_complaint),
  option("praise", m.feedback_type_praise),
  option("suggestion", m.feedback_type_suggestion),
] as const;

export type FeedbackBadgeVariant = "destructive" | "default" | "outline" | "secondary";

export function feedbackTypeBadgeVariant(type: string): FeedbackBadgeVariant {
  switch (type) {
    case "complaint":
      return "destructive";
    case "praise":
      return "default";
    case "bug_report":
      return "outline";
    default:
      return "secondary";
  }
}

/** `type`'s label, or `type` itself when it is not one of `FEEDBACK_TYPES`. */
export function feedbackTypeLabel(type: string): string {
  return FEEDBACK_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** The type filter in `params`, or undefined when there is none. */
export function feedbackTypeFromUrl(params: URLSearchParams): string | undefined {
  return params.get(FEEDBACK_TYPE_PARAM) || undefined;
}

/**
 * `prev` with the type filter set to `value` (undefined, "" or the "all" item
 * removes it); every other parameter is kept. `prev` is not modified.
 */
export function withFeedbackType(prev: URLSearchParams, value: string | undefined): URLSearchParams {
  return withParam(prev, FEEDBACK_TYPE_PARAM, fromFilterSelect(value));
}

/** What the list asks the API for on zero-based page `page`. */
export function feedbackListParams(
  feedbackType: string | undefined,
  page: number,
  catalog: CatalogFilterValues,
): FeedbackListParams {
  return {
    feedbackType,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...catalog,
  };
}

/** One star per point of a 5-point rating: whether each is filled. */
export function ratingStars(rating: number): boolean[] {
  return Array.from({ length: 5 }, (_, i) => i < rating);
}
