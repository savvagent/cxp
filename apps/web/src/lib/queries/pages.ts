// Port of the React console's src/hooks/use-pages.ts: the same query keys, `enabled`
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
import { pagesApi } from "#lib/api/index.js";
import type { Page } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** Filters and paging for a page list (`pagesApi.list`). */
export type PageListParams = NonNullable<Parameters<typeof pagesApi.list>[0]>;
/** What `createCreatePage` sends. */
export type CreatePageInput = Parameters<typeof pagesApi.create>[0];
/** What `createUpdatePage` sends: the page's id and the fields to change. */
export type UpdatePageInput = { id: string; data: Parameters<typeof pagesApi.update>[1] };

/** Query keys: `["pages"]`, `["pages", "list", params]`, `["pages", "detail", id]`. */
export const pageKeys = entityKeys("pages");

/** Options for one page of pages. */
export function pageListOptions(params?: PageListParams) {
  return queryOptions({
    queryKey: pageKeys.list(params ?? {}),
    queryFn: () => pagesApi.list(params),
  });
}

/** Options for one page; disabled until `id` is known. */
export function pageOptions(id: string | undefined) {
  return queryOptions({
    queryKey: pageKeys.detail(id as string),
    queryFn: () => pagesApi.get(id as string),
    enabled: !!id,
  });
}

/** Replaces `usePages(params)`. `params` is a getter, so the query follows reactive filters. */
export function createPages(params: Accessor<PageListParams | undefined> = () => undefined) {
  return createQuery(() => pageListOptions(params()));
}

/** Replaces `usePage(id)`. */
export function createPage(id: Accessor<string | undefined>) {
  return createQuery(() => pageOptions(id()));
}

/** Creates a page, then refreshes every page list. */
export function createPageMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Page, Error, CreatePageInput> {
  return {
    mutationFn: (data) => pagesApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
    },
  };
}

/** Updates a page, then refreshes every page list and the updated page. */
export function updatePageMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Page, Error, UpdatePageInput> {
  return {
    mutationFn: ({ id, data }) => pagesApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: pageKeys.detail(updated.id) });
    },
  };
}

/** Deletes a page by id, then refreshes every page list. */
export function deletePageMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<{ deleted: boolean }, Error, string> {
  return {
    mutationFn: (id) => pagesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
    },
  };
}

/** Replaces `useCreatePage()`. Call during component init. */
export function createCreatePage() {
  const queryClient = useQueryClient();
  return createMutation(() => createPageMutationOptions(queryClient));
}

/** Replaces `useUpdatePage()`. Call during component init. */
export function createUpdatePage() {
  const queryClient = useQueryClient();
  return createMutation(() => updatePageMutationOptions(queryClient));
}

/** Replaces `useDeletePage()`. Call during component init. */
export function createDeletePage() {
  const queryClient = useQueryClient();
  return createMutation(() => deletePageMutationOptions(queryClient));
}
