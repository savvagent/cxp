import { MutationObserver, QueryClient } from "@tanstack/svelte-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as applications from "./applications";
import * as components from "./components";
import * as customers from "./customers";
import * as experiences from "./experiences";
import * as pages from "./pages";
import * as surveys from "./surveys";
import * as tickets from "./tickets";
import { recordFetch } from "./test-fetch";

// The seven catalog-style domains share one shape. The expected keys are
// written out literally (not computed from the factories) so a change to a
// key, which would split the cache from what a mutation invalidates or from
// another page's query, fails here.

const ID = "00000000-0000-0000-0000-000000000001";
// What the server answers an update with. Distinct from ID, so the tests show
// the detail invalidation uses the returned record's id, as the React hooks did.
const UPDATED_ID = "00000000-0000-0000-0000-000000000002";

type Keys = {
  all: readonly unknown[];
  lists: () => readonly unknown[];
  list: (params: Record<string, unknown>) => readonly unknown[];
  details: () => readonly unknown[];
  detail: (id: string) => readonly unknown[];
};

type Options = {
  queryKey: readonly unknown[];
  enabled?: unknown;
  staleTime?: unknown;
};

type MutationFactory = (client: QueryClient) => object;

type Domain = {
  name: string;
  keys: Keys;
  listOptions: (params?: never) => Options;
  detailOptions: (id: string | undefined) => Options;
  create: MutationFactory;
  update: MutationFactory;
  remove: MutationFactory;
  createInput: Record<string, unknown>;
  listFilter: Record<string, string>;
};

const domains: Domain[] = [
  {
    name: "applications",
    keys: applications.applicationKeys,
    listOptions: applications.applicationListOptions,
    detailOptions: applications.applicationOptions,
    create: applications.createApplicationMutationOptions,
    update: applications.updateApplicationMutationOptions,
    remove: applications.deleteApplicationMutationOptions,
    createInput: { experienceId: ID, name: "a" },
    listFilter: { experienceId: ID },
  },
  {
    name: "components",
    keys: components.componentKeys,
    listOptions: components.componentListOptions,
    detailOptions: components.componentOptions,
    create: components.createComponentMutationOptions,
    update: components.updateComponentMutationOptions,
    remove: components.deleteComponentMutationOptions,
    createInput: { pageId: ID, name: "c" },
    listFilter: { pageId: ID },
  },
  {
    name: "customers",
    keys: customers.customerKeys,
    listOptions: customers.customerListOptions,
    detailOptions: customers.customerOptions,
    create: customers.createCustomerMutationOptions,
    update: customers.updateCustomerMutationOptions,
    remove: customers.deleteCustomerMutationOptions,
    createInput: { email: "ada@example.com" },
    listFilter: { experienceId: ID },
  },
  {
    name: "experiences",
    keys: experiences.experienceKeys,
    listOptions: experiences.experienceListOptions,
    detailOptions: experiences.experienceOptions,
    create: experiences.createExperienceMutationOptions,
    update: experiences.updateExperienceMutationOptions,
    remove: experiences.deleteExperienceMutationOptions,
    createInput: { name: "e" },
    listFilter: {},
  },
  {
    name: "pages",
    keys: pages.pageKeys,
    listOptions: pages.pageListOptions,
    detailOptions: pages.pageOptions,
    create: pages.createPageMutationOptions,
    update: pages.updatePageMutationOptions,
    remove: pages.deletePageMutationOptions,
    createInput: { applicationId: ID, name: "p" },
    listFilter: { applicationId: ID },
  },
  {
    name: "surveys",
    keys: surveys.surveyKeys,
    listOptions: surveys.surveyListOptions,
    detailOptions: surveys.surveyOptions,
    create: surveys.createSurveyMutationOptions,
    update: surveys.updateSurveyMutationOptions,
    remove: surveys.deleteSurveyMutationOptions,
    createInput: { title: "t", questions: [] },
    listFilter: { componentId: ID },
  },
  {
    name: "tickets",
    keys: tickets.ticketKeys,
    listOptions: tickets.ticketListOptions,
    detailOptions: tickets.ticketOptions,
    create: tickets.createTicketMutationOptions,
    update: tickets.updateTicketMutationOptions,
    remove: tickets.deleteTicketMutationOptions,
    createInput: { customerId: ID, subject: "s" },
    listFilter: { status: "open" },
  },
];

/** Run a mutation's options as `createMutation` would, without a component. */
async function mutate(client: QueryClient, factory: MutationFactory, variables: unknown) {
  const observer = new MutationObserver(client, factory(client) as never);
  return observer.mutate(variables as never);
}

/** The `queryKey`s `invalidateQueries` was called with, in order. */
function invalidated(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.map(([filters]) => (filters as { queryKey: unknown }).queryKey);
}

afterEach(() => vi.unstubAllGlobals());

describe.each(domains)("$name", (d) => {
  it("keeps the React console's keys", () => {
    expect(d.keys.all).toEqual([d.name]);
    expect(d.keys.lists()).toEqual([d.name, "list"]);
    expect(d.keys.list({ limit: 10 })).toEqual([d.name, "list", { limit: 10 }]);
    expect(d.keys.details()).toEqual([d.name, "detail"]);
    expect(d.keys.detail(ID)).toEqual([d.name, "detail", ID]);
  });

  it("lists under the list key, with the client's default staleTime", () => {
    const params = { limit: 10, ...d.listFilter } as never;
    const options = d.listOptions(params);
    expect(options.queryKey).toEqual([d.name, "list", params]);
    expect(options.enabled).toBeUndefined();
    expect(options.staleTime).toBeUndefined();
    // No params is the same cache entry as `{}`, as in React.
    expect(d.listOptions().queryKey).toEqual([d.name, "list", {}]);
  });

  it("fetches the list with its filters", async () => {
    const calls = recordFetch({ data: [], total: 0, limit: 10, offset: 0 });
    const client = new QueryClient();
    await client.fetchQuery(d.listOptions({ limit: 10, ...d.listFilter } as never) as never);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("GET");
    const url = new URL(calls[0].path, "http://console.test");
    expect(url.pathname).toBe(`/api/v1/${d.name}`);
    expect(url.searchParams.get("limit")).toBe("10");
    for (const [key, value] of Object.entries(d.listFilter)) {
      expect(url.searchParams.get(key)).toBe(value);
    }
  });

  it("reads one record only once its id is known", async () => {
    const options = d.detailOptions(ID);
    expect(options.queryKey).toEqual([d.name, "detail", ID]);
    expect(options.enabled).toBe(true);
    expect(options.staleTime).toBeUndefined();
    expect(d.detailOptions(undefined).enabled).toBe(false);
    expect(d.detailOptions("").enabled).toBe(false);

    const calls = recordFetch({ id: ID });
    await new QueryClient().fetchQuery(options as never);
    expect(calls).toEqual([{ method: "GET", path: `/api/v1/${d.name}/${ID}`, body: undefined }]);
  });

  it("creates, then invalidates every list", async () => {
    const calls = recordFetch({ id: ID });
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    await mutate(client, d.create, d.createInput);
    expect(calls).toEqual([{ method: "POST", path: `/api/v1/${d.name}`, body: d.createInput }]);
    expect(invalidated(spy)).toEqual([[d.name, "list"]]);
  });

  it("updates, then invalidates every list and the returned record", async () => {
    const calls = recordFetch({ id: UPDATED_ID });
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    await mutate(client, d.update, { id: ID, data: { name: "n" } });
    expect(calls).toEqual([{ method: "PUT", path: `/api/v1/${d.name}/${ID}`, body: { name: "n" } }]);
    expect(invalidated(spy)).toEqual([
      [d.name, "list"],
      [d.name, "detail", UPDATED_ID],
    ]);
  });

  it("deletes, then invalidates every list", async () => {
    const calls = recordFetch({ deleted: true });
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    await mutate(client, d.remove, ID);
    expect(calls).toEqual([{ method: "DELETE", path: `/api/v1/${d.name}/${ID}`, body: undefined }]);
    expect(invalidated(spy)).toEqual([[d.name, "list"]]);
  });

  it("invalidates nothing when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "nope" }), { status: 500 })),
    );
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    await expect(mutate(client, d.remove, ID)).rejects.toThrow("nope");
    expect(spy).not.toHaveBeenCalled();
  });
});
