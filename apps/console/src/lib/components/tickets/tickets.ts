// The tickets pages' framework-free logic (ported from
// apps/web/src/pages/tickets/*.tsx): the option lists, the URL state of the
// list page, the create form's schema and payload, and the detail page's
// field updates. Kept out of the components so it is tested on its own.
import { z } from "zod";
import { catalogFiltersFromUrl, type CatalogFilterValues } from "#lib/catalog-filters.js";
import type { CreateTicketInput, TicketListParams, UpdateTicketInput } from "#lib/queries/tickets.js";

export const PAGE_SIZE = 20;

export interface Option {
  value: string;
  label: string;
}

export const STATUS_OPTIONS: Option[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const PRIORITY_OPTIONS: Option[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const CHANNEL_OPTIONS: Option[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "chat", label: "Chat" },
  { value: "web", label: "Web" },
];

/** The select item that clears a list filter. */
export const ALL = "_all";
/** The select item that clears an optional create-form field. */
export const NONE = "_none";

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
  const next = new URLSearchParams(prev);
  if (value && value !== ALL) next.set(key, value);
  else next.delete(key);
  next.delete("page");
  return next;
}

/** `prev` on page `page` (zero-based; page 0 has no parameter). `prev` is not modified. */
export function withPage(prev: URLSearchParams, page: number): URLSearchParams {
  const next = new URLSearchParams(prev);
  if (page <= 0) next.delete("page");
  else next.set("page", String(page));
  return next;
}

export interface Pagination {
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function pagination(total: number, page: number): Pagination {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return { totalPages, hasPrev: page > 0, hasNext: page < totalPages - 1 };
}

/** "1 ticket", "3 tickets". */
export function ticketCount(total: number): string {
  return `${total} ticket${total !== 1 ? "s" : ""}`;
}

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

export const createTicketSchema = z.object({
  customer_id: z.string().min(1, "Customer ID is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  priority: z.string().optional(),
  channel: z.string().optional(),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;

export type CreateTicketErrors = Partial<Record<keyof CreateTicketForm, string>>;

export function emptyCreateTicketForm(): Required<CreateTicketForm> {
  return { customer_id: "", subject: "", description: "", priority: "", channel: "" };
}

export type CreateTicketValidation =
  | { success: true; data: CreateTicketForm }
  | { success: false; errors: CreateTicketErrors };

/** Validates the form; on failure, the first message for each field. */
export function validateCreateTicket(values: CreateTicketForm): CreateTicketValidation {
  const result = createTicketSchema.safeParse(values);
  if (result.success) return { success: true, data: result.data };
  const errors: CreateTicketErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CreateTicketForm | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { success: false, errors };
}

/** A select's value as a form value: the "none" item means unset. */
export function fromOptionalSelect(value: string): string {
  return value === NONE ? "" : value;
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

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
