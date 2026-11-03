import { describe, expect, it } from "vitest";
import { ALL } from "#lib/forms.js";
import { PAGE_SIZE } from "#lib/pagination.js";
import {
  FEEDBACK_TYPES,
  feedbackListParams,
  feedbackTypeBadgeVariant,
  feedbackTypeFromUrl,
  feedbackTypeLabel,
  ratingStars,
  withFeedbackType,
} from "./feedback";

describe("feedback types", () => {
  it("lists the five types in the React order", () => {
    expect(FEEDBACK_TYPES.map((t) => t.value)).toEqual([
      "bug_report",
      "feature_request",
      "complaint",
      "praise",
      "suggestion",
    ]);
  });

  it("labels known types and passes unknown ones through", () => {
    expect(feedbackTypeLabel("bug_report")).toBe("Bug Report");
    expect(feedbackTypeLabel("feature_request")).toBe("Feature Request");
    expect(feedbackTypeLabel("nps")).toBe("nps");
  });

  it("picks the badge variant per type", () => {
    expect(feedbackTypeBadgeVariant("complaint")).toBe("destructive");
    expect(feedbackTypeBadgeVariant("praise")).toBe("default");
    expect(feedbackTypeBadgeVariant("bug_report")).toBe("outline");
    expect(feedbackTypeBadgeVariant("suggestion")).toBe("secondary");
    expect(feedbackTypeBadgeVariant("feature_request")).toBe("secondary");
    expect(feedbackTypeBadgeVariant("other")).toBe("secondary");
  });
});

describe("feedback_type URL parameter", () => {
  it("reads the filter, treating an empty value as none", () => {
    expect(feedbackTypeFromUrl(new URLSearchParams("feedback_type=praise"))).toBe("praise");
    expect(feedbackTypeFromUrl(new URLSearchParams("feedback_type="))).toBeUndefined();
    expect(feedbackTypeFromUrl(new URLSearchParams())).toBeUndefined();
  });

  it("sets the filter and keeps every other parameter", () => {
    const prev = new URLSearchParams("experience_id=e1&feedback_type=praise");
    const next = withFeedbackType(prev, "complaint");
    expect(next.toString()).toBe("experience_id=e1&feedback_type=complaint");
    expect(prev.get("feedback_type")).toBe("praise");
  });

  it("removes the filter for the all item, empty or undefined", () => {
    for (const value of [ALL, "", undefined]) {
      const next = withFeedbackType(new URLSearchParams("feedback_type=praise&page_id=p1"), value);
      expect(next.toString()).toBe("page_id=p1");
    }
  });
});

describe("feedback list", () => {
  it("asks for one page with the type and catalog filters", () => {
    expect(feedbackListParams("praise", 2, { experienceId: "e1", componentId: "c1" })).toEqual({
      feedbackType: "praise",
      limit: PAGE_SIZE,
      offset: 2 * PAGE_SIZE,
      experienceId: "e1",
      componentId: "c1",
    });
    expect(feedbackListParams(undefined, 0, {})).toEqual({
      feedbackType: undefined,
      limit: 20,
      offset: 0,
    });
  });

  it("fills one star per rating point", () => {
    expect(ratingStars(3)).toEqual([true, true, true, false, false]);
    expect(ratingStars(0)).toEqual([false, false, false, false, false]);
    expect(ratingStars(5)).toEqual([true, true, true, true, true]);
  });
});
