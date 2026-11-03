import { describe, expect, it } from "vitest";
import { ALL, validate } from "#lib/forms.js";
import { PAGE_SIZE } from "#lib/pagination.js";
import {
  assigneeChange,
  createTicketSchema,
  emptyCreateTicketForm,
  hasTicketFilters,
  optionLabel,
  STATUS_OPTIONS,
  ticketCount,
  ticketFieldUpdate,
  ticketListParams,
  ticketListStateFromUrl,
  toCreateTicketInput,
  withPage,
  withTicketFilter,
} from "./tickets";

describe("tickets list URL state", () => {
  it("reads filters, page and catalog filters from the URL", () => {
    const state = ticketListStateFromUrl(
      new URLSearchParams("status=open&priority=high&page=2&experience_id=e1&component_id=c1"),
    );
    expect(state).toEqual({
      status: "open",
      priority: "high",
      page: 2,
      catalog: { experienceId: "e1", componentId: "c1" },
    });
  });

  it("defaults to no filters on the first page", () => {
    expect(ticketListStateFromUrl(new URLSearchParams())).toEqual({
      status: "",
      priority: "",
      page: 0,
      catalog: {},
    });
  });

  it("reads a malformed or negative page as the first page", () => {
    expect(ticketListStateFromUrl(new URLSearchParams("page=abc")).page).toBe(0);
    expect(ticketListStateFromUrl(new URLSearchParams("page=-3")).page).toBe(0);
  });

  it("asks the API for one page with the set filters only", () => {
    const state = ticketListStateFromUrl(new URLSearchParams("priority=low&page=3&page_id=p1"));
    expect(ticketListParams(state)).toEqual({
      limit: PAGE_SIZE,
      offset: 3 * PAGE_SIZE,
      status: undefined,
      priority: "low",
      pageId: "p1",
    });
  });

  it("counts status, priority and every catalog filter as a filter", () => {
    const has = (q: string) => hasTicketFilters(ticketListStateFromUrl(new URLSearchParams(q)));
    expect(has("")).toBe(false);
    expect(has("page=4")).toBe(false);
    expect(has("status=open")).toBe(true);
    expect(has("priority=urgent")).toBe(true);
    expect(has("experience_id=e")).toBe(true);
    expect(has("application_id=a")).toBe(true);
    expect(has("page_id=p")).toBe(true);
    expect(has("component_id=c")).toBe(true);
  });

  it("sets a filter, keeps the others and returns to the first page", () => {
    const prev = new URLSearchParams("priority=high&page=3&experience_id=e1");
    const next = withTicketFilter(prev, "status", "waiting");
    expect(next.toString()).toBe("priority=high&experience_id=e1&status=waiting");
    expect(prev.toString()).toBe("priority=high&page=3&experience_id=e1");
  });

  it("removes a filter for the all item or an empty value", () => {
    const prev = new URLSearchParams("status=open&priority=high&page=1");
    expect(withTicketFilter(prev, "status", ALL).toString()).toBe("priority=high");
    expect(withTicketFilter(prev, "priority", "").toString()).toBe("status=open");
  });

  it("writes the page, dropping it on the first page", () => {
    const prev = new URLSearchParams("status=open&page=2");
    expect(withPage(prev, 3).toString()).toBe("status=open&page=3");
    expect(withPage(prev, 0).toString()).toBe("status=open");
    expect(prev.toString()).toBe("status=open&page=2");
  });

  it("counts tickets", () => {
    expect(ticketCount(0)).toBe("0 tickets");
    expect(ticketCount(1)).toBe("1 ticket");
    expect(ticketCount(7)).toBe("7 tickets");
  });

  it("labels options", () => {
    expect(optionLabel(STATUS_OPTIONS, "in_progress")).toBe("In Progress");
    expect(optionLabel(STATUS_OPTIONS, "mystery")).toBe("mystery");
  });
});

describe("create ticket form", () => {
  it("requires a customer id and a subject, with the old messages", () => {
    const result = validate(createTicketSchema, emptyCreateTicketForm());
    expect(result).toEqual({
      ok: false,
      errors: { customer_id: "Customer ID is required", subject: "Subject is required" },
    });
  });

  it("accepts a form with only the required fields", () => {
    const values = { ...emptyCreateTicketForm(), customer_id: "c1", subject: "Broken" };
    expect(validate(createTicketSchema, values)).toEqual({ ok: true, data: values });
  });

  it("sends empty optional fields as unset", () => {
    expect(
      toCreateTicketInput({ ...emptyCreateTicketForm(), customer_id: "c1", subject: "Broken" }),
    ).toEqual({
      customerId: "c1",
      subject: "Broken",
      description: undefined,
      priority: undefined,
      channel: undefined,
    });
    expect(
      toCreateTicketInput({
        customer_id: "c1",
        subject: "Broken",
        description: "It broke",
        priority: "high",
        channel: "email",
      }),
    ).toEqual({ customerId: "c1", subject: "Broken", description: "It broke", priority: "high", channel: "email" });
  });
});

describe("ticket detail updates", () => {
  it("sends one field, an empty value as unset", () => {
    expect(ticketFieldUpdate("t1", "status", "resolved")).toEqual({ id: "t1", data: { status: "resolved" } });
    expect(ticketFieldUpdate("t1", "assignedTo", "")).toEqual({ id: "t1", data: { assignedTo: undefined } });
  });

  it("saves the trimmed assignee only when it changed", () => {
    expect(assigneeChange("  ana  ", null)).toBe("ana");
    expect(assigneeChange("ana", "ana")).toBeNull();
    expect(assigneeChange(" ana ", "ana")).toBeNull();
    expect(assigneeChange("", null)).toBeNull();
    expect(assigneeChange("", "ana")).toBe("");
  });
});
