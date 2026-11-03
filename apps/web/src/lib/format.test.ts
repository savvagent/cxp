import { afterEach, describe, expect, it } from "vitest";
import { getLocale, overwriteGetLocale } from "#lib/paraglide/runtime.js";
import { formatDate, formatDateTime, formatLocaleDateTime, formatNumber, localeDate, localeDateTime } from "./format";

const ISO = "2026-01-05T12:00:00Z";
const defaultGetLocale = getLocale;

afterEach(() => overwriteGetLocale(defaultGetLocale));

describe("in the base locale (en)", () => {
  it("formatDate", () => {
    expect(formatDate(ISO)).toBe("Jan 5, 2026");
  });

  it("formatDateTime uses a numeric hour", () => {
    expect(formatDateTime(ISO)).toMatch(/^Jan 5, 2026, \d{1,2}:00\s?[AP]M$/);
  });

  it("formatLocaleDateTime: short month, two-digit hour (the ticket page)", () => {
    expect(formatLocaleDateTime(ISO)).toBe(
      new Date(ISO).toLocaleString("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  });

  it("localeDate and localeDateTime are the locale's defaults", () => {
    expect(localeDate(ISO)).toBe(new Date(ISO).toLocaleDateString("en"));
    expect(localeDateTime(ISO)).toBe(new Date(ISO).toLocaleString("en"));
  });

  it("formatNumber groups thousands", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("in the active locale", () => {
  it("formats every date in the locale the console resolved, not the browser's", () => {
    overwriteGetLocale(() => "de");
    expect(formatDate(ISO)).toBe(new Date(ISO).toLocaleDateString("de", { year: "numeric", month: "short", day: "numeric" }));
    expect(formatDate(ISO)).toMatch(/^5\. Jan\.? 2026$/);
    expect(localeDate(ISO)).toBe("5.1.2026");
    expect(formatDateTime(ISO)).toContain("2026");
    expect(formatDateTime(ISO)).not.toMatch(/[AP]M/);
    expect(formatLocaleDateTime(ISO)).toBe(new Date(ISO).toLocaleString("de", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }));
    expect(localeDateTime(ISO)).toBe(new Date(ISO).toLocaleString("de"));
  });

  it("formats numbers in the active locale", () => {
    overwriteGetLocale(() => "de");
    expect(formatNumber(1234567)).toBe("1.234.567");
    overwriteGetLocale(() => "hi");
    expect(formatNumber(1234567)).toBe("12,34,567");
  });
});
