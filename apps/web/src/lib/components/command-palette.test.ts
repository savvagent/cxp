import { describe, expect, it, vi } from "vitest";
import type { Customer, Ticket } from "#lib/types.js";
import { NO_RESULTS, isPaletteShortcut, matchTickets, searchPalette } from "./command-palette.js";

function ticket(id: string, subject: string): Ticket {
  return { id, subject } as Ticket;
}

function customer(id: string): Customer {
  return { id, email: `${id}@example.com` } as Customer;
}

describe("isPaletteShortcut", () => {
  it("is Cmd+K or Ctrl+K", () => {
    expect(isPaletteShortcut({ metaKey: true, ctrlKey: false, key: "k" })).toBe(true);
    expect(isPaletteShortcut({ metaKey: false, ctrlKey: true, key: "k" })).toBe(true);
  });

  it("is nothing else", () => {
    expect(isPaletteShortcut({ metaKey: false, ctrlKey: false, key: "k" })).toBe(false);
    expect(isPaletteShortcut({ metaKey: true, ctrlKey: false, key: "j" })).toBe(false);
    expect(isPaletteShortcut({ metaKey: false, ctrlKey: true, key: "K" })).toBe(false);
  });
});

describe("matchTickets", () => {
  const tickets = [
    ticket("abc-1", "Login fails"),
    ticket("def-2", "Billing question"),
    ticket("abd-3", "Cannot LOG IN on mobile"),
  ];

  it("matches the subject in any case", () => {
    expect(matchTickets(tickets, "login").map((t) => t.id)).toEqual(["abc-1"]);
    expect(matchTickets(tickets, "LOG").map((t) => t.id)).toEqual(["abc-1", "abd-3"]);
  });

  it("matches an id prefix, case-sensitively", () => {
    expect(matchTickets(tickets, "ab").map((t) => t.id)).toEqual(["abc-1", "abd-3"]);
    expect(matchTickets(tickets, "DEF").map((t) => t.id)).toEqual([]);
  });

  it("keeps at most five", () => {
    const many = Array.from({ length: 8 }, (_, i) => ticket(`t${i}`, "same"));
    expect(matchTickets(many, "same")).toHaveLength(5);
  });
});

describe("searchPalette", () => {
  const api = {
    searchCustomers: async () => ({ data: Array.from({ length: 7 }, (_, i) => customer(`c${i}`)) }),
    recentTickets: async () => ({ data: [ticket("t1", "Refund"), ticket("t2", "Other")] }),
  };

  it("searches nothing below two characters", async () => {
    let called = false;
    const spy = {
      searchCustomers: async () => ((called = true), { data: [] }),
      recentTickets: async () => ((called = true), { data: [] }),
    };
    expect(await searchPalette("r", { customers: [customer("x")], tickets: [] }, spy)).toEqual(NO_RESULTS);
    expect(called).toBe(false);
  });

  it("keeps five customers and the matching tickets", async () => {
    const results = await searchPalette("ref", NO_RESULTS, api);
    expect(results.customers.map((c) => c.id)).toEqual(["c0", "c1", "c2", "c3", "c4"]);
    expect(results.tickets.map((t) => t.id)).toEqual(["t1"]);
  });

  it("keeps the previous results of a search that failed, and warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const previous = { customers: [customer("old")], tickets: [ticket("old", "Refund old")] };
    const failing = {
      searchCustomers: () => Promise.reject(new Error("down")),
      recentTickets: api.recentTickets,
    };
    const results = await searchPalette("ref", previous, failing);
    expect(results.customers).toBe(previous.customers);
    expect(results.tickets.map((t) => t.id)).toEqual(["t1"]);

    const ticketsFail = { searchCustomers: api.searchCustomers, recentTickets: () => Promise.reject(new Error("x")) };
    expect((await searchPalette("ref", previous, ticketsFail)).tickets).toBe(previous.tickets);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toMatch(/^Customer search failed/);
    expect(warn.mock.calls[1][0]).toMatch(/^Ticket search failed/);
    warn.mockRestore();
  });
});
