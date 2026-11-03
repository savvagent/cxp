import { describe, expect, it } from "vitest";
import { consolePath, isNavActive, routeTitle } from "./nav.js";

describe("consolePath", () => {
  it("strips the console base", () => {
    expect(consolePath("/console/tickets/1")).toBe("/tickets/1");
    expect(consolePath("/console/")).toBe("/");
    expect(consolePath("/console")).toBe("/");
  });

  it("leaves a path outside the console alone", () => {
    expect(consolePath("/consoles/x")).toBe("/consoles/x");
    expect(consolePath("/auth/login")).toBe("/auth/login");
  });
});

describe("isNavActive", () => {
  it("is active on the item's own path and below it", () => {
    expect(isNavActive("/console/customers", "/customers")).toBe(true);
    expect(isNavActive("/console/customers/abc", "/customers")).toBe(true);
    expect(isNavActive("/console/catalog/pages", "/catalog/pages")).toBe(true);
  });

  it("is not active on a sibling or a prefix that is not a segment", () => {
    expect(isNavActive("/console/tickets", "/customers")).toBe(false);
    expect(isNavActive("/console/customersx", "/customers")).toBe(false);
    expect(isNavActive("/console/catalog/pages", "/catalog/experiences")).toBe(false);
    expect(isNavActive("/console/", "/dashboard")).toBe(false);
  });

  it("ignores a trailing slash", () => {
    expect(isNavActive("/console/dashboard/", "/dashboard")).toBe(true);
  });
});

describe("routeTitle", () => {
  it("names top-level and catalog routes", () => {
    expect(routeTitle("/console/dashboard")).toBe("Dashboard");
    expect(routeTitle("/console/surveys")).toBe("Surveys");
    expect(routeTitle("/console/catalog/applications")).toBe("Applications");
    expect(routeTitle("/console/catalog/components")).toBe("Components");
  });

  it("names a detail page after its list", () => {
    expect(routeTitle("/console/customers/0000-1")).toBe("Customers");
    expect(routeTitle("/console/tickets/abc")).toBe("Tickets");
  });

  it("falls back to CXP", () => {
    expect(routeTitle("/console/")).toBe("CXP");
    expect(routeTitle("/console/catalog")).toBe("CXP");
    expect(routeTitle("/console/nowhere")).toBe("CXP");
  });
});
