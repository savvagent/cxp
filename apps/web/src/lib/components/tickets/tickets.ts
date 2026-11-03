// The tickets pages' framework-free logic: the option lists, the URL state of
// the list page, the create form's schema and payload, and the detail page's
// field updates. Kept out of the components so it is tested on its own.
import { m } from "#lib/paraglide/messages.js";
import { formatNumber } from "#lib/format.js";
import { z } from "#lib/zod.js";
import { catalogFiltersFromUrl, type CatalogFilterValues } from "#lib/catalog-filters.js";
import { fromFilterSelect } from "#lib/forms.js";
import { PAGE_SIZE } from "#lib/pagination.js";
import { withParam } from "#lib/url-state.js";
import type { CreateTicketInput, TicketListParams, UpdateTicketInput } from "#lib/queries/tickets.js";

export interface Option {
  readonly value: string;
  /** The value's label in the active locale (a getter: read when shown). */
  readonly label: string;
}

/** An option whose label is read from its message each time it is shown. */
export function option(value: string, label: () => string): Option {
  return {
    value,
    get label() {
      return label();
    },
  };
}

export const STATUS_OPTIONS: Option[] = [
  option("open", m.ticket_status_open),
  option("in_progress", m.ticket_status_in_progress),
  option("waiting", m.ticket_status_waiting),
  option("resolved", m.ticket_status_resolved),
  option("closed", m.ticket_status_closed),
];

export const PRIORITY_OPTIONS: Option[] = [
  option("urgent", m.ticket_priority_urgent),
  option("high", m.ticket_priority_high),
  option("medium", m.ticket_priority_medium),
  option("low", m.ticket_priority_low),
];

/** The channels a new ticket can be given. */
export const CHANNEL_OPTIONS: Option[] = [
  option("email", m.ticket_channel_email),
  option("phone", m.ticket_channel_phone),
  option("chat", m.ticket_channel_chat),
  option("web", m.ticket_channel_web),
];

/** Every channel a ticket can have: the create form's, and `social` (set by integrations). */
const ALL_CHANNELS: Option[] = [...CHANNEL_OPTIONS, option("social", m.ticket_channel_social)];

/** A ticket channel's label, or the channel itself when the console does not know it. */
export function channelLabel(channel: string): string {
  return optionLabel(ALL_CHANNELS, channel);
}

/** `value`'s label in `options`, or `value` itself when it is not one of them. */
export function optionLabel(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// List page URL state
// ---------------------------------------------------------------------------

export interface TicketListState {
  status: string;
  priority: string;
  /** Zero-based page number (`?page=`, absent on the first page). */
  page: number;
  catalog: CatalogFilterValues;
}

/** The list page's filters and page, read from its URL. */
export function ticketListStateFromUrl(params: URLSearchParams): TicketListState {
  const page = Number.parseInt(params.get("page") ?? "0", 10);
  return {
    status: params.get("status") ?? "",
    priority: params.get("priority") ?? "",
    page: Number.isFinite(page) && page > 0 ? page : 0,
    catalog: catalogFiltersFromUrl(params),
  };
}

/** What the list page asks the API for. */
export function ticketListParams(state: TicketListState): TicketListParams {
  return {
    limit: PAGE_SIZE,
    offset: state.page * PAGE_SIZE,
    status: state.status || undefined,
    priority: state.priority || undefined,
    ...state.catalog,
  };
}

/** Whether any filter (status, priority or catalog) is set. */
export function hasTicketFilters(state: TicketListState): boolean {
  const c = state.catalog;
  return !!(state.status || state.priority || c.experienceId || c.applicationId || c.pageId || c.componentId);
}

/**
 * `prev` with the status or priority filter set to `value` (the "all" item or
 * "" removes it) and back on the first page. `prev` is not modified.
 */
export function withTicketFilter(prev: URLSearchParams, key: "status" | "priority", value: string): URLSearchParams {
  const next = withParam(prev, key, fromFilterSelect(value));
  next.delete("page");
  return next;
}

/** `prev` on page `page` (zero-based; page 0 has no parameter). `prev` is not modified. */
export function withPage(prev: URLSearchParams, page: number): URLSearchParams {
  return withParam(prev, "page", page > 0 ? String(page) : undefined);
}

/** "1 ticket", "3 tickets", in the active locale. */
export function ticketCount(total: number): string {
  return m.tickets_count({ count: total, countText: formatNumber(total) });
}

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

// The messages are functions, so each is read in the active locale when it is
// reported, not when the schema is built at module load.
export const createTicketSchema = z.object({
  customer_id: z.string().min(1, { error: () => m.ticket_customer_id_required() }),
  subject: z.string().min(1, { error: () => m.ticket_subject_required() }),
  description: z.string().optional(),
  priority: z.string().optional(),
  channel: z.string().optional(),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;

export function emptyCreateTicketForm(): Required<CreateTicketForm> {
  return { customer_id: "", subject: "", description: "", priority: "", channel: "" };
}

/** The API payload for a valid form; empty optional fields are left out. */
export function toCreateTicketInput(values: CreateTicketForm): CreateTicketInput {
  return {
    customerId: values.customer_id,
    subject: values.subject,
    description: values.description || undefined,
    priority: values.priority || undefined,
    channel: values.channel || undefined,
  };
}

// ---------------------------------------------------------------------------
// Detail page
// ---------------------------------------------------------------------------

export type TicketField = "status" | "priority" | "assignedTo";

/** The update for one field; an empty value is sent as unset. */
export function ticketFieldUpdate(id: string, field: TicketField, value: string): UpdateTicketInput {
  return { id, data: { [field]: value || undefined } };
}

/**
 * The assignee to save when the field loses focus, or `null` when the trimmed
 * input equals the current assignee and nothing should be sent.
 */
export function assigneeChange(input: string, current: string | null): string | null {
  const val = input.trim();
  return val !== (current ?? "") ? val : null;
}
