// The ticket queries, with the React console's query keys, `enabled` and
// invalidations, as option factories (testable without a component) and
// the thin `create…` wrappers that components call.
import {
  createMutation,
  createQuery,
  queryOptions,
  useQueryClient,
  type Accessor,
  type CreateMutationOptions,
  type QueryClient,
} from "@tanstack/svelte-query";
import { ticketsApi } from "#lib/api/index.js";
import type { Ticket } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** Filters and paging for a ticket list (`ticketsApi.list`). */
export type TicketListParams = NonNullable<Parameters<typeof ticketsApi.list>[0]>;
/** What `createCreateTicket` sends. */
export type CreateTicketInput = Parameters<typeof ticketsApi.create>[0];
/** What `createUpdateTicket` sends: the ticket's id and the fields to change. */
export type UpdateTicketInput = { id: string; data: Parameters<typeof ticketsApi.update>[1] };

/** Query keys: `["tickets"]`, `["tickets", "list", params]`, `["tickets", "detail", id]`. */
export const ticketKeys = entityKeys("tickets");

/** Options for one page of tickets. */
export function ticketListOptions(params?: TicketListParams) {
  return queryOptions({
    queryKey: ticketKeys.list(params ?? {}),
    queryFn: () => ticketsApi.list(params),
  });
}

/** Options for one ticket; disabled until `id` is known. */
export function ticketOptions(id: string | undefined) {
  return queryOptions({
    queryKey: ticketKeys.detail(id as string),
    queryFn: () => ticketsApi.get(id as string),
    enabled: !!id,
  });
}

/** Replaces `useTickets(params)`. `params` is a getter, so the query follows reactive filters. */
export function createTickets(params: Accessor<TicketListParams | undefined> = () => undefined) {
  return createQuery(() => ticketListOptions(params()));
}

/** Replaces `useTicket(id)`. */
export function createTicket(id: Accessor<string | undefined>) {
  return createQuery(() => ticketOptions(id()));
}

/** Creates a ticket, then refreshes every ticket list. */
export function createTicketMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Ticket, Error, CreateTicketInput> {
  return {
    mutationFn: (data) => ticketsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  };
}

/** Updates a ticket, then refreshes every ticket list and the updated ticket. */
export function updateTicketMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Ticket, Error, UpdateTicketInput> {
  return {
    mutationFn: ({ id, data }) => ticketsApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(updated.id) });
    },
  };
}

/** Deletes a ticket by id, then refreshes every ticket list. */
export function deleteTicketMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<{ deleted: boolean }, Error, string> {
  return {
    mutationFn: (id) => ticketsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  };
}

/** Replaces `useCreateTicket()`. Call during component init. */
export function createCreateTicket() {
  const queryClient = useQueryClient();
  return createMutation(() => createTicketMutationOptions(queryClient));
}

/** Replaces `useUpdateTicket()`. Call during component init. */
export function createUpdateTicket() {
  const queryClient = useQueryClient();
  return createMutation(() => updateTicketMutationOptions(queryClient));
}

/** Replaces `useDeleteTicket()`. Call during component init. */
export function createDeleteTicket() {
  const queryClient = useQueryClient();
  return createMutation(() => deleteTicketMutationOptions(queryClient));
}
