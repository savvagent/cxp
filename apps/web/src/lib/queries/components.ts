// Port of the React console's src/hooks/use-components.ts: the same query keys, `enabled`
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
import { componentsApi } from "#lib/api/index.js";
import type { Component } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** Filters and paging for a component list (`componentsApi.list`). */
export type ComponentListParams = NonNullable<Parameters<typeof componentsApi.list>[0]>;
/** What `createCreateComponent` sends. */
export type CreateComponentInput = Parameters<typeof componentsApi.create>[0];
/** What `createUpdateComponent` sends: the component's id and the fields to change. */
export type UpdateComponentInput = { id: string; data: Parameters<typeof componentsApi.update>[1] };

/** Query keys: `["components"]`, `["components", "list", params]`, `["components", "detail", id]`. */
export const componentKeys = entityKeys("components");

/** Options for one page of components. */
export function componentListOptions(params?: ComponentListParams) {
  return queryOptions({
    queryKey: componentKeys.list(params ?? {}),
    queryFn: () => componentsApi.list(params),
  });
}

/** Options for one component; disabled until `id` is known. */
export function componentOptions(id: string | undefined) {
  return queryOptions({
    queryKey: componentKeys.detail(id as string),
    queryFn: () => componentsApi.get(id as string),
    enabled: !!id,
  });
}

/** Replaces `useComponents(params)`. `params` is a getter, so the query follows reactive filters. */
export function createComponents(params: Accessor<ComponentListParams | undefined> = () => undefined) {
  return createQuery(() => componentListOptions(params()));
}

/** Replaces `useComponent(id)`. */
export function createComponent(id: Accessor<string | undefined>) {
  return createQuery(() => componentOptions(id()));
}

/** Creates a component, then refreshes every component list. */
export function createComponentMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Component, Error, CreateComponentInput> {
  return {
    mutationFn: (data) => componentsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: componentKeys.lists() });
    },
  };
}

/** Updates a component, then refreshes every component list and the updated component. */
export function updateComponentMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Component, Error, UpdateComponentInput> {
  return {
    mutationFn: ({ id, data }) => componentsApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: componentKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: componentKeys.detail(updated.id) });
    },
  };
}

/** Deletes a component by id, then refreshes every component list. */
export function deleteComponentMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<{ deleted: boolean }, Error, string> {
  return {
    mutationFn: (id) => componentsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: componentKeys.lists() });
    },
  };
}

/** Replaces `useCreateComponent()`. Call during component init. */
export function createCreateComponent() {
  const queryClient = useQueryClient();
  return createMutation(() => createComponentMutationOptions(queryClient));
}

/** Replaces `useUpdateComponent()`. Call during component init. */
export function createUpdateComponent() {
  const queryClient = useQueryClient();
  return createMutation(() => updateComponentMutationOptions(queryClient));
}

/** Replaces `useDeleteComponent()`. Call during component init. */
export function createDeleteComponent() {
  const queryClient = useQueryClient();
  return createMutation(() => deleteComponentMutationOptions(queryClient));
}
