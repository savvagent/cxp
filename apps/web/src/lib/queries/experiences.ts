// Port of the React console's src/hooks/use-experiences.ts: the same query keys, `enabled`
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
import { experiencesApi } from "#lib/api/index.js";
import type { Experience } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** Filters and paging for a experience list (`experiencesApi.list`). */
export type ExperienceListParams = NonNullable<Parameters<typeof experiencesApi.list>[0]>;
/** What `createCreateExperience` sends. */
export type CreateExperienceInput = Parameters<typeof experiencesApi.create>[0];
/** What `createUpdateExperience` sends: the experience's id and the fields to change. */
export type UpdateExperienceInput = { id: string; data: Parameters<typeof experiencesApi.update>[1] };

/** Query keys: `["experiences"]`, `["experiences", "list", params]`, `["experiences", "detail", id]`. */
export const experienceKeys = entityKeys("experiences");

/** Options for one page of experiences. */
export function experienceListOptions(params?: ExperienceListParams) {
  return queryOptions({
    queryKey: experienceKeys.list(params ?? {}),
    queryFn: () => experiencesApi.list(params),
  });
}

/** Options for one experience; disabled until `id` is known. */
export function experienceOptions(id: string | undefined) {
  return queryOptions({
    queryKey: experienceKeys.detail(id as string),
    queryFn: () => experiencesApi.get(id as string),
    enabled: !!id,
  });
}

/** Replaces `useExperiences(params)`. `params` is a getter, so the query follows reactive filters. */
export function createExperiences(params: Accessor<ExperienceListParams | undefined> = () => undefined) {
  return createQuery(() => experienceListOptions(params()));
}

/** Replaces `useExperience(id)`. */
export function createExperience(id: Accessor<string | undefined>) {
  return createQuery(() => experienceOptions(id()));
}

/** Creates a experience, then refreshes every experience list. */
export function createExperienceMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Experience, Error, CreateExperienceInput> {
  return {
    mutationFn: (data) => experiencesApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: experienceKeys.lists() });
    },
  };
}

/** Updates a experience, then refreshes every experience list and the updated experience. */
export function updateExperienceMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Experience, Error, UpdateExperienceInput> {
  return {
    mutationFn: ({ id, data }) => experiencesApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: experienceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: experienceKeys.detail(updated.id) });
    },
  };
}

/** Deletes a experience by id, then refreshes every experience list. */
export function deleteExperienceMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<{ deleted: boolean }, Error, string> {
  return {
    mutationFn: (id) => experiencesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: experienceKeys.lists() });
    },
  };
}

/** Replaces `useCreateExperience()`. Call during component init. */
export function createCreateExperience() {
  const queryClient = useQueryClient();
  return createMutation(() => createExperienceMutationOptions(queryClient));
}

/** Replaces `useUpdateExperience()`. Call during component init. */
export function createUpdateExperience() {
  const queryClient = useQueryClient();
  return createMutation(() => updateExperienceMutationOptions(queryClient));
}

/** Replaces `useDeleteExperience()`. Call during component init. */
export function createDeleteExperience() {
  const queryClient = useQueryClient();
  return createMutation(() => deleteExperienceMutationOptions(queryClient));
}
