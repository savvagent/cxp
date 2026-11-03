// How the console shows dates. Each page keeps the format it always had, so
// the formats differ: the customer pages spell dates in en-US, the other pages
// use the browser's locale.

/** `Jan 5, 2026` (en-US): the customer pages. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** `Jan 5, 2026, 3:04 PM` (en-US, numeric hour): a customer's interactions. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** A short date and a two-digit time in the browser's locale: a ticket's dates. */
export function formatLocaleDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The browser's default date (`toLocaleDateString()`): the list pages' dates. */
export function localeDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** The browser's default date and time (`toLocaleString()`): a survey response's completion. */
export function localeDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}
