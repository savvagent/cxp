// Select options for the catalog's filters and forms.
import type { Page } from "#lib/types.js";

/** One item of a catalog select: its value, its text, and an optional muted hint. */
export interface CatalogOption {
  value: string;
  label: string;
  /** Shown after the label in a monospace muted span (a page's path). */
  hint?: string | null;
}

/** Options for named records (experiences, applications, teams). */
export function namedOptions(items: readonly { id: string; name: string }[]): CatalogOption[] {
  return items.map((i) => ({ value: i.id, label: i.name }));
}

/** Options for pages: the name, with the path as its hint. */
export function pageOptions(pages: readonly Page[]): CatalogOption[] {
  return pages.map((p) => ({ value: p.id, label: p.name, hint: p.path }));
}
