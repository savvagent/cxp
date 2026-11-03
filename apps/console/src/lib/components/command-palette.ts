// The command palette's logic, framework-free: its shortcut and its search.
// Ported from apps/web/src/components/command-palette.tsx.
import type { Customer, Ticket } from "#lib/types.js";

/** The shortest query the palette searches for. */
export const PALETTE_MIN_QUERY = 2;
/** How long typing must pause before the palette searches. */
export const PALETTE_DEBOUNCE_MS = 200;
/** How many customers and tickets the palette shows at most. */
export const PALETTE_MAX_RESULTS = 5;
/** How many recent tickets the palette filters by subject or id. */
export const PALETTE_TICKET_SAMPLE = 10;

/** Cmd+K or Ctrl+K. */
export function isPaletteShortcut(event: Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "key">): boolean {
  return (event.metaKey || event.ctrlKey) && event.key === "k";
}

/** The tickets whose subject contains `q` (any case) or whose id starts with it, at most five. */
export function matchTickets(tickets: Ticket[], q: string): Ticket[] {
  const needle = q.toLowerCase();
  return tickets
    .filter((t) => t.subject.toLowerCase().includes(needle) || t.id.startsWith(q))
    .slice(0, PALETTE_MAX_RESULTS);
}

export interface PaletteResults {
  customers: Customer[];
  tickets: Ticket[];
}

export const NO_RESULTS: PaletteResults = { customers: [], tickets: [] };

/** What the palette searches with. */
export interface PaletteSearchApi {
  searchCustomers: (q: string) => Promise<{ data: Customer[] }>;
  recentTickets: () => Promise<{ data: Ticket[] }>;
}

/**
 * Search for `q`: customers from the server's search, tickets from the ten
 * most recent filtered here. Below two characters there are no results. A
 * search that fails keeps that kind's `previous` results, as the old palette did.
 */
export async function searchPalette(
  q: string,
  previous: PaletteResults,
  api: PaletteSearchApi,
): Promise<PaletteResults> {
  if (q.length < PALETTE_MIN_QUERY) return NO_RESULTS;
  const [customers, tickets] = await Promise.allSettled([api.searchCustomers(q), api.recentTickets()]);
  return {
    customers:
      customers.status === "fulfilled" ? customers.value.data.slice(0, PALETTE_MAX_RESULTS) : previous.customers,
    tickets: tickets.status === "fulfilled" ? matchTickets(tickets.value.data, q) : previous.tickets,
  };
}
