import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatLocaleDateTime, localeDate, localeDateTime } from "./format";

const ISO = "2026-01-05T12:00:00Z";

describe("customer pages (en-US)", () => {
  it("formatDate", () => {
    expect(formatDate(ISO)).toBe("Jan 5, 2026");
  });

  it("formatDateTime uses a numeric hour", () => {
    const expected = new Date(ISO).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    expect(formatDateTime(ISO)).toBe(expected);
    expect(formatDateTime(ISO)).toMatch(/^Jan 5, 2026, \d{1,2}:00\s?[AP]M$/);
  });
});

describe("browser-locale formats", () => {
  it("formatLocaleDateTime: short month, two-digit hour (the ticket page)", () => {
    expect(formatLocaleDateTime(ISO)).toBe(
      new Date(ISO).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  });

  it("localeDate and localeDateTime are the browser's defaults", () => {
    expect(localeDate(ISO)).toBe(new Date(ISO).toLocaleDateString());
    expect(localeDateTime(ISO)).toBe(new Date(ISO).toLocaleString());
  });
});
