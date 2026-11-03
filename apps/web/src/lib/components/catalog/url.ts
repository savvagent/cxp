// URL state for the catalog pages and the catalog filter bar: where each
// change navigates to. The React console kept these filters in the query string
// (`useSearchParams`); the Svelte one keeps the same parameter names.
import { withCatalogFilters, type CatalogFilterValues } from "#lib/catalog-filters.js";

/** What these helpers read of a URL (`page.url` is a read-only `URL`). */
export interface UrlLike {
  pathname: string;
  hash: string;
  searchParams: { toString(): string };
}

/** `url`'s query as a fresh, writable `URLSearchParams`. */
export function searchOf(url: UrlLike): URLSearchParams {
  return new URLSearchParams(url.searchParams.toString());
}

/** `url`'s path and query (and hash) with its query replaced by `params`. */
function hrefWith(url: UrlLike, params: URLSearchParams): string {
  const qs = params.toString();
  return `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`;
}

/**
 * Where the catalog filter bar navigates when its filters become `values`:
 * the current URL with the four catalog parameters set or removed, every other
 * parameter kept except `resetParams` (e.g. `["page"]`, so a list returns to
 * its first page as the tickets list did).
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

/** The current URL with one parameter set, or removed when `value` is empty. */
export function paramHref(url: UrlLike, name: string, value: string | undefined): string {
  const next = searchOf(url);
  if (value) next.set(name, value);
  else next.delete(name);
  return hrefWith(url, next);
}

/** The select value that stands for "no filter" in a filter select. */
export const ALL = "all";
/** The select value that stands for "none" in a form's optional select. */
export const NONE = "_none";
