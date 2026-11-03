// The catalog filters a console page carries in its URL. Framework-free, so
// the pages and their filter bar share it and it is tested on its own.

export interface CatalogFilterValues {
  experienceId?: string;
  applicationId?: string;
  pageId?: string;
  componentId?: string;
}

/**
 * The console's own URL parameter for each catalog filter (router state, not
 * the API wire). These keep their snake_case names so existing console links
 * work; the API itself takes the camelCase keys (#24).
 */
const URL_PARAM: Record<keyof CatalogFilterValues, string> = {
  experienceId: "experience_id",
  applicationId: "application_id",
  pageId: "page_id",
  componentId: "component_id",
};

/** The catalog filters a console page's URL carries, as API-ready values. */
export function catalogFiltersFromUrl(params: URLSearchParams): CatalogFilterValues {
  const out: CatalogFilterValues = {};
  for (const [key, name] of Object.entries(URL_PARAM) as [keyof CatalogFilterValues, string][]) {
    const v = params.get(name);
    if (v) out[key] = v;
  }
  return out;
}

/**
 * `prev` with the catalog filters set to `values` (an unset value removes its
 * parameter); every other parameter is kept. `prev` is not modified.
 */
export function withCatalogFilters(prev: URLSearchParams, values: CatalogFilterValues): URLSearchParams {
  const next = new URLSearchParams(prev);
  for (const [key, name] of Object.entries(URL_PARAM) as [keyof CatalogFilterValues, string][]) {
    const v = values[key];
    if (v) next.set(name, v);
    else next.delete(name);
  }
  return next;
}
