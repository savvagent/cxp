import { m } from "#lib/paraglide/messages.js";
import { describe, expect, it } from "vitest";
import { CUSTOMER_PAGE_SIZE, PAGE_SIZE, pageWindow, showingLine } from "./pagination";

describe("page sizes", () => {
  it("are 20, and 50 for customers", () => {
    expect(PAGE_SIZE).toBe(20);
    expect(CUSTOMER_PAGE_SIZE).toBe(50);
  });
});

describe("pageWindow", () => {
  it("has no pages for an empty list", () => {
    expect(pageWindow(0, 0)).toEqual({ offset: 0, totalPages: 0, hasPrev: false, hasNext: false, from: 1, to: 0 });
  });

  it("is one page when everything fits", () => {
    expect(pageWindow(PAGE_SIZE, 0)).toMatchObject({ totalPages: 1, hasPrev: false, hasNext: false });
  });

  it("pages through 41 rows in threes", () => {
    expect(pageWindow(PAGE_SIZE * 2 + 1, 0)).toEqual({
      offset: 0,
      totalPages: 3,
      hasPrev: false,
      hasNext: true,
      from: 1,
      to: 20,
    });
    expect(pageWindow(PAGE_SIZE * 2 + 1, 2)).toEqual({
      offset: 40,
      totalPages: 3,
      hasPrev: true,
      hasNext: false,
      from: 41,
      to: 41,
    });
  });

  it("feedback's footer reads 21–40 of 45 on its second page", () => {
    const w = pageWindow(45, 1);
    expect(`Showing ${w.from}–${w.to} of 45`).toBe("Showing 21–40 of 45");
  });

  it("customers page by 50", () => {
    expect(pageWindow(120, 0, CUSTOMER_PAGE_SIZE)).toEqual({
      offset: 0,
      totalPages: 3,
      hasPrev: false,
      hasNext: true,
      from: 1,
      to: 50,
    });
    expect(pageWindow(120, 2, CUSTOMER_PAGE_SIZE)).toMatchObject({ offset: 100, hasPrev: true, hasNext: false, from: 101, to: 120 });
  });
});

describe("showingLine", () => {
  it("only past one page", () => {
    expect(showingLine(20, 20, 20, m.catalog_experience_showing)).toBeNull();
    expect(showingLine(20, 20, 45, m.catalog_experience_showing)).toBe("Showing 20 of 45 experiences");
    expect(showingLine(20, 25, 45, m.catalog_page_showing)).toBe("Showing 20 of 45 pages");
  });

  it("formats the counts for the locale", () => {
    expect(showingLine(20, 20, 1234, ({ shown, total }) => `${shown}/${total}`)).toBe("20/1,234");
  });
});
