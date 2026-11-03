// The feedback page's framework-free logic (ported from
// the React console's src/pages/feedback/index.tsx): the type options and badges, the
// `feedback_type` URL parameter, what the list asks the API for, and the
// pagination footer. Kept out of the component so it is tested on its own.
import type { CatalogFilterValues } from "#lib/catalog-filters.js";
import type { FeedbackListParams } from "#lib/queries/feedback.js";

export const PAGE_SIZE = 20;

/** The URL parameter holding the type filter. */
export const FEEDBACK_TYPE_PARAM = "feedback_type";

/** The select item that clears the type filter. */
export const ALL = "all";

export const FEEDBACK_TYPES = [
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "complaint", label: "Complaint" },
  { value: "praise", label: "Praise" },
  { value: "suggestion", label: "Suggestion" },
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
  const next = new URLSearchParams(prev);
  if (value && value !== ALL) next.set(FEEDBACK_TYPE_PARAM, value);
  else next.delete(FEEDBACK_TYPE_PARAM);
  return next;
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

export interface FeedbackPagination {
  totalPages: number;
  /** "Showing 21–40 of 45". */
  range: string;
  hasPrev: boolean;
  hasNext: boolean;
}

export function feedbackPagination(total: number, page: number): FeedbackPagination {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return {
    totalPages,
    range: `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`,
    hasPrev: page > 0,
    hasNext: page < totalPages - 1,
  };
}

/** One star per point of a 5-point rating: whether each is filled. */
export function ratingStars(rating: number): boolean[] {
  return Array.from({ length: 5 }, (_, i) => i < rating);
}
