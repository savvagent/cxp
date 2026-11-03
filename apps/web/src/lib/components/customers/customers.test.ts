import { describe, expect, it } from "vitest";
import type { Customer } from "#lib/types.js";
import {
  EMPTY_CUSTOMER_FORM,
  PAGE_SIZE,
  customerFormValues,
  displayName,
  filterCustomers,
  formatDate,
  humanize,
  pagination,
  parseCustomerForm,
  splitTags,
} from "./customers";

function customer(over: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    email: "ada@example.com",
    name: "Ada Lovelace",
    phone: null,
    company: "Analytical",
    metadata: {},
    tags: ["vip", "enterprise"],
    experienceId: null,
    applicationId: null,
    pageId: null,
    componentId: null,
    createdAt: "2026-01-05T12:00:00Z",
    updatedAt: "2026-01-05T12:00:00Z",
    ...over,
  };
}

describe("customer form", () => {
  it("requires a valid email with the React form's message", () => {
    expect(parseCustomerForm(EMPTY_CUSTOMER_FORM)).toEqual({
      ok: false,
      errors: { email: "Enter a valid email address" },
    });
    expect(parseCustomerForm({ ...EMPTY_CUSTOMER_FORM, email: "not-an-email" })).toEqual({
      ok: false,
      errors: { email: "Enter a valid email address" },
    });
  });

  it("sends empty optional fields as absent and splits tags", () => {
    expect(
      parseCustomerForm({ ...EMPTY_CUSTOMER_FORM, email: "a@b.co", tags: " vip, ,enterprise ," }),
    ).toEqual({
      ok: true,
      data: {
        email: "a@b.co",
        name: undefined,
        phone: undefined,
        company: undefined,
        tags: ["vip", "enterprise"],
      },
    });
  });

  it("keeps filled optional fields", () => {
    const r = parseCustomerForm({
      email: "a@b.co",
      name: "A",
      phone: "+1",
      company: "Acme",
      tags: "",
    });
    expect(r).toEqual({
      ok: true,
      data: { email: "a@b.co", name: "A", phone: "+1", company: "Acme", tags: [] },
    });
  });

  it("prefills the edit form from a customer", () => {
    expect(customerFormValues(customer({ name: null, phone: "+1" }))).toEqual({
      email: "ada@example.com",
      name: "",
      phone: "+1",
      company: "Analytical",
      tags: "vip, enterprise",
    });
  });

  it("splits no tags from nothing", () => {
    expect(splitTags(undefined)).toEqual([]);
    expect(splitTags("")).toEqual([]);
  });
});

describe("customer list search", () => {
  const list = [
    customer({ id: "1" }),
    customer({ id: "2", email: "bob@corp.io", name: null, company: null, tags: ["Beta"] }),
  ];

  it("returns everything for a blank query", () => {
    expect(filterCustomers(list, "  ")).toBe(list);
  });

  it("matches email, name, company and tags case-insensitively", () => {
    expect(filterCustomers(list, "LOVELACE").map((c) => c.id)).toEqual(["1"]);
    expect(filterCustomers(list, "corp.io").map((c) => c.id)).toEqual(["2"]);
    expect(filterCustomers(list, "analyt").map((c) => c.id)).toEqual(["1"]);
    expect(filterCustomers(list, "beta").map((c) => c.id)).toEqual(["2"]);
    expect(filterCustomers(list, "nobody")).toEqual([]);
  });
});

describe("customer list paging", () => {
  it("pages by 50", () => {
    expect(PAGE_SIZE).toBe(50);
    expect(pagination(0, 120)).toEqual({
      hasPrev: false,
      hasNext: true,
      from: 1,
      to: 50,
      prevOffset: 0,
      nextOffset: 50,
    });
    expect(pagination(100, 120)).toMatchObject({ hasPrev: true, hasNext: false, from: 101, to: 120, prevOffset: 50 });
  });
});

describe("customer labels", () => {
  it("names a customer by name, else email", () => {
    expect(displayName(customer())).toBe("Ada Lovelace");
    expect(displayName(customer({ name: null }))).toBe("ada@example.com");
  });

  it("formats dates and enum values as the React pages did", () => {
    expect(formatDate("2026-01-05T12:00:00Z")).toBe("Jan 5, 2026");
    expect(humanize("page_view_event")).toBe("page view event");
  });
});
