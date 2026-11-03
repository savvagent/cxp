// Port of the React console's src/hooks/use-applications.ts: the same query keys, `enabled`
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
import { applicationsApi } from "#lib/api/index.js";
import type { Application } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** Filters and paging for a application list (`applicationsApi.list`). */
export type ApplicationListParams = NonNullable<Parameters<typeof applicationsApi.list>[0]>;
/** What `createCreateApplication` sends. */
export type CreateApplicationInput = Parameters<typeof applicationsApi.create>[0];
/** What `createUpdateApplication` sends: the application's id and the fields to change. */
export type UpdateApplicationInput = { id: string; data: Parameters<typeof applicationsApi.update>[1] };

/** Query keys: `["applications"]`, `["applications", "list", params]`, `["applications", "detail", id]`. */
export const applicationKeys = entityKeys("applications");

/** Options for one page of applications. */
export function applicationListOptions(params?: ApplicationListParams) {
  return queryOptions({
    queryKey: applicationKeys.list(params ?? {}),
    queryFn: () => applicationsApi.list(params),
  });
}

/** Options for one application; disabled until `id` is known. */
export function applicationOptions(id: string | undefined) {
  return queryOptions({
    queryKey: applicationKeys.detail(id as string),
    queryFn: () => applicationsApi.get(id as string),
    enabled: !!id,
  });
}

/** Replaces `useApplications(params)`. `params` is a getter, so the query follows reactive filters. */
export function createApplications(params: Accessor<ApplicationListParams | undefined> = () => undefined) {
  return createQuery(() => applicationListOptions(params()));
}

/** Replaces `useApplication(id)`. */
export function createApplication(id: Accessor<string | undefined>) {
  return createQuery(() => applicationOptions(id()));
}

/** Creates a application, then refreshes every application list. */
export function createApplicationMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Application, Error, CreateApplicationInput> {
  return {
    mutationFn: (data) => applicationsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  };
}

/** Updates a application, then refreshes every application list and the updated application. */
export function updateApplicationMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Application, Error, UpdateApplicationInput> {
  return {
    mutationFn: ({ id, data }) => applicationsApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(updated.id) });
    },
  };
}

/** Deletes a application by id, then refreshes every application list. */
export function deleteApplicationMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<{ deleted: boolean }, Error, string> {
  return {
    mutationFn: (id) => applicationsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  };
}

/** Replaces `useCreateApplication()`. Call during component init. */
export function createCreateApplication() {
  const queryClient = useQueryClient();
  return createMutation(() => createApplicationMutationOptions(queryClient));
}

/** Replaces `useUpdateApplication()`. Call during component init. */
export function createUpdateApplication() {
  const queryClient = useQueryClient();
  return createMutation(() => updateApplicationMutationOptions(queryClient));
}

/** Replaces `useDeleteApplication()`. Call during component init. */
export function createDeleteApplication() {
  const queryClient = useQueryClient();
  return createMutation(() => deleteApplicationMutationOptions(queryClient));
}
