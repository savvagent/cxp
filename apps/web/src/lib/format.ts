// How the console shows dates and numbers: always in the active locale (the
// one `resolveAtBoot` from `@savvagent/console-ui` set at boot, read through
// Paraglide's `getLocale`).
// The pages keep the date shapes they always had, so the shapes differ.
import { getLocale } from "#lib/paraglide/runtime.js";

/** `Jan 5, 2026` in English, `5 ene 2026` in Spanish: the customer pages. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** `Jan 5, 2026, 3:04 PM` in English (numeric hour): a customer's interactions. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** A short date and a two-digit time: a ticket's dates. */
export function formatLocaleDateTime(iso: string): string {
  return new Date(iso).toLocaleString(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The locale's default date: the list pages' dates. */
export function localeDate(iso: string): string {
  return new Date(iso).toLocaleDateString(getLocale());
}

/** The locale's default date and time: a survey response's completion. */
export function localeDateTime(iso: string): string {
  return new Date(iso).toLocaleString(getLocale());
}

/** A count with the locale's grouping: `1,234` in English, `1.234` in German. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}
