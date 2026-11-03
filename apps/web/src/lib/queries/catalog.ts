// The catalog's four levels (experiences, applications, pages, components)
// share one query shape: the React console's keys, `enabled` and
// invalidations, built once by `catalogEntity` as option factories (testable
// without a component) and the thin `create…` wrappers components call.
import {
  createMutation,
  createQuery,
  queryOptions,
  useQueryClient,
  type Accessor,
  type CreateMutationOptions,
  type QueryClient,
} from "@tanstack/svelte-query";
import { applicationsApi, componentsApi, experiencesApi, pagesApi } from "#lib/api/index.js";
import type { PaginatedResponse } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** What a catalog level's API module offers. */
export interface CatalogApi<T, ListParams, CreateInput, UpdateData> {
  list: (params?: ListParams) => Promise<PaginatedResponse<T>>;
  get: (id: string) => Promise<T>;
  create: (data: CreateInput) => Promise<T>;
  update: (id: string, data: UpdateData) => Promise<T>;
  delete: (id: string) => Promise<{ deleted: boolean }>;
}

/**
 * One catalog level's queries. Keys are `[name]`, `[name, "list", params]` and
 * `[name, "detail", id]`; every mutation refreshes every list of the level,
 * and an update also the record the server returned.
 */
export function catalogEntity<const Name extends string, T extends { id: string }, ListParams extends object, CreateInput, UpdateData>(
  name: Name,
  api: CatalogApi<T, ListParams, CreateInput, UpdateData>,
) {
  const keys = entityKeys(name);

  /** Options for one page of the list. No params is the same cache entry as `{}`. */
  function listOptions(params?: ListParams) {
    return queryOptions({
      queryKey: keys.list((params ?? {}) as Record<string, unknown>),
      queryFn: () => api.list(params),
    });
  }

  /** Options for one record; disabled until `id` is known. */
  function detailOptions(id: string | undefined) {
    return queryOptions({
      queryKey: keys.detail(id as string),
      queryFn: () => api.get(id as string),
      enabled: !!id,
    });
  }

  function createOptions(queryClient: QueryClient): CreateMutationOptions<T, Error, CreateInput> {
    return {
      mutationFn: (data) => api.create(data),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.lists() });
      },
    };
  }

  function updateOptions(queryClient: QueryClient): CreateMutationOptions<T, Error, { id: string; data: UpdateData }> {
    return {
      mutationFn: ({ id, data }) => api.update(id, data),
      onSuccess: (updated) => {
        void queryClient.invalidateQueries({ queryKey: keys.lists() });
        void queryClient.invalidateQueries({ queryKey: keys.detail(updated.id) });
      },
    };
  }

  function deleteOptions(queryClient: QueryClient): CreateMutationOptions<{ deleted: boolean }, Error, string> {
    return {
      mutationFn: (id) => api.delete(id),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.lists() });
      },
    };
  }

  return {
    keys,
    listOptions,
    detailOptions,
    createOptions,
    updateOptions,
    deleteOptions,
    /** The list; `params` is a getter, so the query follows reactive filters. */
    list: (params: Accessor<ListParams | undefined> = () => undefined) => createQuery(() => listOptions(params())),
    /** One record. */
    one: (id: Accessor<string | undefined>) => createQuery(() => detailOptions(id())),
    /** The create mutation. Call during component init. */
    create: () => {
      const queryClient = useQueryClient();
      return createMutation(() => createOptions(queryClient));
    },
    /** The update mutation. Call during component init. */
    update: () => {
      const queryClient = useQueryClient();
      return createMutation(() => updateOptions(queryClient));
    },
    /** The delete mutation. Call during component init. */
    remove: () => {
      const queryClient = useQueryClient();
      return createMutation(() => deleteOptions(queryClient));
    },
  };
}

export const experienceQueries = catalogEntity("experiences", experiencesApi);
export const applicationQueries = catalogEntity("applications", applicationsApi);
export const pageQueries = catalogEntity("pages", pagesApi);
export const componentQueries = catalogEntity("components", componentsApi);

/** What a level's list takes, its create sends, and its update sends. */
type ListParamsOf<A> = A extends { list: (params?: infer P) => unknown } ? NonNullable<P> : never;
type CreateInputOf<A> = A extends { create: (data: infer C) => unknown } ? C : never;
type UpdateInputOf<A> = A extends { update: (id: string, data: infer U) => unknown } ? { id: string; data: U } : never;

export type ExperienceListParams = ListParamsOf<typeof experiencesApi>;
export type CreateExperienceInput = CreateInputOf<typeof experiencesApi>;
export type UpdateExperienceInput = UpdateInputOf<typeof experiencesApi>;
export type ApplicationListParams = ListParamsOf<typeof applicationsApi>;
export type CreateApplicationInput = CreateInputOf<typeof applicationsApi>;
export type UpdateApplicationInput = UpdateInputOf<typeof applicationsApi>;
export type PageListParams = ListParamsOf<typeof pagesApi>;
export type CreatePageInput = CreateInputOf<typeof pagesApi>;
export type UpdatePageInput = UpdateInputOf<typeof pagesApi>;
export type ComponentListParams = ListParamsOf<typeof componentsApi>;
export type CreateComponentInput = CreateInputOf<typeof componentsApi>;
export type UpdateComponentInput = UpdateInputOf<typeof componentsApi>;
