import { describe, expect, it } from "vitest";
import { catalogFilterHref, paramHref, queryHref, searchOf, withParam } from "./url-state";

const at = (href: string) => new URL(href, "http://localhost");

describe("catalogFilterHref", () => {
  it("sets the snake_case catalog parameters on the current path", () => {
    expect(catalogFilterHref(at("/console/tickets"), { experienceId: "e1", componentId: "c1" })).toBe(
      "/console/tickets?experience_id=e1&component_id=c1",
    );
  });

  it("keeps unrelated parameters and drops cleared filters", () => {
    expect(
      catalogFilterHref(at("/console/tickets?status=open&experience_id=e1&page_id=p1"), { pageId: "p2" }),
    ).toBe("/console/tickets?status=open&page_id=p2");
  });

  it("removes the reset parameters (the tickets list's page)", () => {
    expect(catalogFilterHref(at("/console/tickets?page=3&status=open"), { applicationId: "a1" }, ["page"])).toBe(
      "/console/tickets?status=open&application_id=a1",
    );
  });

  it("clearing every filter leaves no query string", () => {
    expect(catalogFilterHref(at("/console/feedback?experience_id=e1&page=2"), {}, ["page"])).toBe(
      "/console/feedback",
    );
  });

  it("keeps the hash", () => {
    expect(catalogFilterHref(at("/console/surveys#top"), { pageId: "p1" })).toBe("/console/surveys?page_id=p1#top");
  });
});

describe("paramHref", () => {
  it("sets one parameter and keeps the rest", () => {
    expect(paramHref(at("/console/catalog/pages?x=1"), "application_id", "a1")).toBe(
      "/console/catalog/pages?x=1&application_id=a1",
    );
  });

  it("replaces an existing value", () => {
    expect(paramHref(at("/console/catalog/components?page_id=p1"), "page_id", "p2")).toBe(
      "/console/catalog/components?page_id=p2",
    );
  });

  it("removes the parameter for an empty value", () => {
    expect(paramHref(at("/console/catalog/applications?experience_id=e1"), "experience_id", undefined)).toBe(
      "/console/catalog/applications",
    );
    expect(paramHref(at("/console/catalog/applications?experience_id=e1&x=1"), "experience_id", "")).toBe(
      "/console/catalog/applications?x=1",
    );
  });
});

describe("withParam", () => {
  it("sets or removes one parameter on a copy", () => {
    const prev = new URLSearchParams("a=1&b=2");
    expect(withParam(prev, "a", "3").toString()).toBe("a=3&b=2");
    expect(withParam(prev, "b", undefined).toString()).toBe("a=1");
    expect(withParam(prev, "b", "").toString()).toBe("a=1");
    expect(prev.toString()).toBe("a=1&b=2");
  });
});

describe("queryHref", () => {
  it("adds the query only when there is one", () => {
    expect(queryHref("/console/tickets", new URLSearchParams("status=open"))).toBe("/console/tickets?status=open");
    expect(queryHref("/console/tickets", new URLSearchParams())).toBe("/console/tickets");
  });
});

describe("searchOf", () => {
  it("is a writable copy of the URL's query", () => {
    const url = at("/console/feedback?feedback_type=praise");
    const params = searchOf(url);
    params.set("x", "1");
    expect(url.searchParams.has("x")).toBe(false);
    expect(params.get("feedback_type")).toBe("praise");
  });
});
