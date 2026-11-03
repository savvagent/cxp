// Port of the React console's src/hooks/use-customers.ts: the same query keys, `enabled`
// and invalidations, as option factories (testable without a component) and
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
import { customersApi } from "#lib/api/index.js";
import type { Customer } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** Filters and paging for a customer list (`customersApi.list`). */
export type CustomerListParams = NonNullable<Parameters<typeof customersApi.list>[0]>;
/** What `createCreateCustomer` sends. */
export type CreateCustomerInput = Parameters<typeof customersApi.create>[0];
/** What `createUpdateCustomer` sends: the customer's id and the fields to change. */
export type UpdateCustomerInput = { id: string; data: Parameters<typeof customersApi.update>[1] };

/**
 * Query keys: `["customers"]`, `["customers", "list", params]`,
 * `["customers", "detail", id]`, plus `["customers", id, "360"]` (the key the
 * React customer page used inline) and `["customers", "search", q]`.
 */
export const customerKeys = {
  ...entityKeys("customers"),
  customer360: (id: string) => ["customers", id, "360"] as const,
  search: (q: string) => ["customers", "search", q] as const,
};

/** Options for one page of customers. */
export function customerListOptions(params?: CustomerListParams) {
  return queryOptions({
    queryKey: customerKeys.list(params ?? {}),
    queryFn: () => customersApi.list(params),
  });
}

/** Options for one customer; disabled until `id` is known. */
export function customerOptions(id: string | undefined) {
  return queryOptions({
    queryKey: customerKeys.detail(id as string),
    queryFn: () => customersApi.get(id as string),
    enabled: !!id,
  });
}

/**
 * Options for a customer's 360 view; disabled until `id` is known. The React
 * customer page ran this query inline with `useQuery`.
 */
export function customer360Options(id: string | undefined) {
  return queryOptions({
    queryKey: customerKeys.customer360(id as string),
    queryFn: () => customersApi.get360(id as string),
    enabled: !!id,
  });
}

/** The shortest query `customerSearchOptions` searches for, as the React command palette required. */
export const CUSTOMER_SEARCH_MIN_LENGTH = 2;

/**
 * Options for a customer search; disabled below
 * {@link CUSTOMER_SEARCH_MIN_LENGTH} characters. The React command palette
 * called `customersApi.search` directly; this gives its port a key.
 */
export function customerSearchOptions(q: string) {
  return queryOptions({
    queryKey: customerKeys.search(q),
    queryFn: () => customersApi.search(q),
    enabled: q.length >= CUSTOMER_SEARCH_MIN_LENGTH,
  });
}

/** Replaces `useCustomers(params)`. `params` is a getter, so the query follows reactive filters. */
export function createCustomers(params: Accessor<CustomerListParams | undefined> = () => undefined) {
  return createQuery(() => customerListOptions(params()));
}

/** Replaces `useCustomer(id)`. */
export function createCustomer(id: Accessor<string | undefined>) {
  return createQuery(() => customerOptions(id()));
}

/** Replaces the customer page's inline `useQuery` of `customersApi.get360(id)`. */
export function createCustomer360(id: Accessor<string | undefined>) {
  return createQuery(() => customer360Options(id()));
}

/** A customer search that follows a reactive query string. */
export function createCustomerSearch(q: Accessor<string>) {
  return createQuery(() => customerSearchOptions(q()));
}

/** Creates a customer, then refreshes every customer list. */
export function createCustomerMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Customer, Error, CreateCustomerInput> {
  return {
    mutationFn: (data) => customersApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  };
}

/** Updates a customer, then refreshes every customer list and the updated customer. */
export function updateCustomerMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Customer, Error, UpdateCustomerInput> {
  return {
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(updated.id) });
    },
  };
}

/** Deletes a customer by id, then refreshes every customer list. */
export function deleteCustomerMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<{ deleted: boolean }, Error, string> {
  return {
    mutationFn: (id) => customersApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  };
}

/** Replaces `useCreateCustomer()`. Call during component init. */
export function createCreateCustomer() {
  const queryClient = useQueryClient();
  return createMutation(() => createCustomerMutationOptions(queryClient));
}

/** Replaces `useUpdateCustomer()`. Call during component init. */
export function createUpdateCustomer() {
  const queryClient = useQueryClient();
  return createMutation(() => updateCustomerMutationOptions(queryClient));
}

/** Replaces `useDeleteCustomer()`. Call during component init. */
export function createDeleteCustomer() {
  const queryClient = useQueryClient();
  return createMutation(() => deleteCustomerMutationOptions(queryClient));
}
