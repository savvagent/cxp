import { QueryClient } from "@tanstack/svelte-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CUSTOMER_SEARCH_MIN_LENGTH,
  customer360Options,
  customerKeys,
  customerSearchOptions,
} from "./customers";
import { dashboardKeys, dashboardMetricsOptions } from "./dashboard";
import { feedbackKeys, feedbackListOptions } from "./feedback";
import * as queries from "./index";
import { meKeys, myTeamsOptions } from "./me";
import { SESSION_STALE_TIME, sessionKeys, sessionOptions } from "./session";
import { surveyKeys, surveyResponsesOptions } from "./surveys";
import { recordFetch } from "./test-fetch";

const ID = "00000000-0000-0000-0000-000000000001";

afterEach(() => vi.unstubAllGlobals());

/** Run a query's options against the stubbed fetch and return the one request it made. */
async function fetchOnce(options: unknown, body: unknown = {}) {
  const calls = recordFetch(body);
  await new QueryClient().fetchQuery(options as never);
  expect(calls).toHaveLength(1);
  return calls[0];
}

describe("dashboard", () => {
  it("keeps the React keys and fetches the metrics", async () => {
    expect(dashboardKeys.all).toEqual(["dashboard"]);
    expect(dashboardKeys.metrics()).toEqual(["dashboard", "metrics"]);
    const options = dashboardMetricsOptions();
    expect(options.queryKey).toEqual(["dashboard", "metrics"]);
    expect(options.enabled).toBeUndefined();
    expect(options.staleTime).toBeUndefined();
    expect((await fetchOnce(options)).path).toBe("/api/v1/dashboard/metrics");
  });
});

describe("me", () => {
  it("keeps the React keys and fetches the caller's teams", async () => {
    expect(meKeys.all).toEqual(["me"]);
    expect(meKeys.teams()).toEqual(["me", "teams"]);
    const options = myTeamsOptions();
    expect(options.queryKey).toEqual(["me", "teams"]);
    expect(options.staleTime).toBeUndefined();
    expect((await fetchOnce(options, [])).path).toBe("/api/v1/me/teams");
  });
});

describe("session", () => {
  it("is the key `markSignedOut` writes, trusted for a minute", async () => {
    expect(sessionKeys.all).toEqual(["session"]);
    const options = sessionOptions();
    expect(options.queryKey).toEqual(["session"]);
    expect(SESSION_STALE_TIME).toBe(60_000);
    expect(options.staleTime).toBe(60_000);
    const request = await fetchOnce(options, { signedIn: false, loginEnabled: true });
    expect(request.path).toBe("/auth/session");
  });
});

describe("feedback", () => {
  it("keeps the React keys and fetches with its filters", async () => {
    expect(feedbackKeys.all).toEqual(["feedback"]);
    expect(feedbackKeys.lists()).toEqual(["feedback", "list"]);
    const params = { customerId: ID, feedbackType: "nps" };
    const options = feedbackListOptions(params);
    expect(options.queryKey).toEqual(["feedback", "list", params]);
    expect(feedbackListOptions().queryKey).toEqual(["feedback", "list", {}]);
    expect(options.staleTime).toBeUndefined();
    const url = new URL((await fetchOnce(options, { data: [] })).path, "http://console.test");
    expect(url.pathname).toBe("/api/v1/feedback");
    expect(url.searchParams.get("customerId")).toBe(ID);
    expect(url.searchParams.get("feedbackType")).toBe("nps");
  });
});

describe("customer 360", () => {
  it("keeps the key the React customer page used, and waits for an id", async () => {
    expect(customerKeys.customer360(ID)).toEqual(["customers", ID, "360"]);
    const options = customer360Options(ID);
    expect(options.queryKey).toEqual(["customers", ID, "360"]);
    expect(options.enabled).toBe(true);
    expect(customer360Options(undefined).enabled).toBe(false);
    expect((await fetchOnce(options)).path).toBe(`/api/v1/customers/${ID}/360`);
  });
});

describe("customer search", () => {
  it("searches only from the palette's minimum length", async () => {
    expect(CUSTOMER_SEARCH_MIN_LENGTH).toBe(2);
    expect(customerKeys.search("ada")).toEqual(["customers", "search", "ada"]);
    expect(customerSearchOptions("a").enabled).toBe(false);
    const options = customerSearchOptions("ad a");
    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(["customers", "search", "ad a"]);
    const request = await fetchOnce(options, { data: [], total: 0, totalCapped: false });
    expect(request.path).toBe("/api/v1/customers/search?q=ad%20a");
  });
});

describe("survey responses", () => {
  it("nest under the survey's detail key, and wait for an id", async () => {
    expect(surveyKeys.responses(ID)).toEqual(["surveys", "detail", ID, "responses", {}]);
    const options = surveyResponsesOptions(ID, { limit: 5, offset: 10 });
    expect(options.queryKey).toEqual(["surveys", "detail", ID, "responses", { limit: 5, offset: 10 }]);
    expect(options.enabled).toBe(true);
    expect(surveyResponsesOptions(undefined).enabled).toBe(false);
    expect(surveyResponsesOptions(ID).queryKey).toEqual(["surveys", "detail", ID, "responses", {}]);
    const request = await fetchOnce(options, { data: [] });
    expect(request.path).toBe(`/api/v1/surveys/${ID}/responses?limit=5&offset=10`);
  });
});

describe("the index", () => {
  it("exports a create… wrapper for every React hook", () => {
    const replaced = [
      "createCustomers", "createCustomer", "createCreateCustomer", "createUpdateCustomer", "createDeleteCustomer",
      "createCustomer360", "createCustomerSearch",
      "createDashboardMetrics",
      "createFeedback",
      "createMyTeams",
      "createSession",
      "createSurveys", "createSurvey", "createSurveyResponses", "createCreateSurvey", "createUpdateSurvey", "createDeleteSurvey",
      "createTickets", "createTicket", "createCreateTicket", "createUpdateTicket", "createDeleteTicket",
    ];
    for (const name of replaced) {
      expect(typeof (queries as Record<string, unknown>)[name], name).toBe("function");
    }
  });

  it("exports the catalog levels' list, record and mutation wrappers", () => {
    for (const entity of ["experienceQueries", "applicationQueries", "pageQueries", "componentQueries"]) {
      const q = (queries as unknown as Record<string, Record<string, unknown>>)[entity];
      for (const name of ["list", "one", "create", "update", "remove"]) {
        expect(typeof q?.[name], `${entity}.${name}`).toBe("function");
      }
    }
  });
});
