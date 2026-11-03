// The list pages' URL state: reading the query, building where a change goes,
// and going there. The console keeps its filters in the query string under the
// parameter names the React console used.
import { goto } from "$app/navigation";
import { withCatalogFilters, type CatalogFilterValues } from "#lib/catalog-filters.js";

/** What these helpers read of a URL (`page.url` is a read-only `URL`). */
export interface UrlLike {
  pathname: string;
  hash: string;
  searchParams: { toString(): string };
}

/** `url`'s query as a fresh, writable `URLSearchParams`. */
export function searchOf(url: Pick<UrlLike, "searchParams">): URLSearchParams {
  return new URLSearchParams(url.searchParams.toString());
}

/** `prev` with `name` set to `value`, or removed when `value` is empty. `prev` is not modified. */
export function withParam(prev: URLSearchParams, name: string, value: string | undefined): URLSearchParams {
  const next = new URLSearchParams(prev);
  if (value) next.set(name, value);
  else next.delete(name);
  return next;
}

/** `path` with `params` as its query (none when `params` is empty). */
export function queryHref(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}

/** `url`'s path (and hash) with its query replaced by `params`. */
export function hrefWith(url: UrlLike, params: URLSearchParams): string {
  return `${queryHref(url.pathname, params)}${url.hash}`;
}

/** The current URL with one parameter set, or removed when `value` is empty. */
export function paramHref(url: UrlLike, name: string, value: string | undefined): string {
  return hrefWith(url, withParam(searchOf(url), name, value));
}

/**
 * Where the catalog filter bar navigates when its filters become `values`:
 * the current URL with the four catalog parameters set or removed, every other
 * parameter kept except `resetParams` (e.g. `["page"]`, so a list returns to
 * its first page).
 */
export function catalogFilterHref(
  url: UrlLike,
  values: CatalogFilterValues,
  resetParams: readonly string[] = [],
): string {
  const next = withCatalogFilters(searchOf(url), values);
  for (const name of resetParams) next.delete(name);
  return hrefWith(url, next);
}

/**
 * Goes to `href` as a new history entry, leaving scroll and focus where they
 * are (what react-router's `setSearchParams` did).
 */
export function pushUrl(href: string): void {
  void goto(href, { reset: false });
}
