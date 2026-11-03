// The console's list paging: the page sizes and the window a page shows.
// Framework-free, so it is tested on its own.

/** The page size of every paged list except customers. */
export const PAGE_SIZE = 20;
/** The customer list's page size. */
export const CUSTOMER_PAGE_SIZE = 50;

/** Where zero-based page `page` of a `total`-long list sits. */
export interface PageWindow {
  /** The first row's offset, what the list asks the API for. */
  offset: number;
  /** How many pages there are (0 for an empty list). */
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** The first row's one-based position. */
  from: number;
  /** The last row's one-based position. */
  to: number;
}

export function pageWindow(total: number, page: number, pageSize: number = PAGE_SIZE): PageWindow {
  const offset = page * pageSize;
  const totalPages = Math.ceil(total / pageSize);
  return {
    offset,
    totalPages,
    hasPrev: page > 0,
    hasNext: page < totalPages - 1,
    from: offset + 1,
    to: Math.min(offset + pageSize, total),
  };
}

/**
 * The "Showing n of total" footer of a list that shows its first page only,
 * or `null` when everything fits on that page.
 */
export function showingLine(pageSize: number, shown: number, total: number, noun: string): string | null {
  return total > pageSize ? `Showing ${Math.min(pageSize, shown)} of ${total} ${noun}` : null;
}
