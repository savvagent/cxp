// Port of apps/web/src/hooks/use-surveys.ts: the same query keys, `enabled`
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
import { surveysApi } from "#lib/api/index.js";
import type { Survey } from "#lib/types.js";
import { entityKeys } from "./keys.js";

/** Filters and paging for a survey list (`surveysApi.list`). */
export type SurveyListParams = NonNullable<Parameters<typeof surveysApi.list>[0]>;
/** What `createCreateSurvey` sends. */
export type CreateSurveyInput = Parameters<typeof surveysApi.create>[0];
/** What `createUpdateSurvey` sends: the survey's id and the fields to change. */
export type UpdateSurveyInput = { id: string; data: Parameters<typeof surveysApi.update>[1] };

/** Paging for a survey's responses (`surveysApi.getResponses`). */
export type SurveyResponsesParams = NonNullable<Parameters<typeof surveysApi.getResponses>[1]>;

const surveyEntityKeys = entityKeys("surveys");

/**
 * Query keys: `["surveys"]`, `["surveys", "list", params]`,
 * `["surveys", "detail", id]` and `["surveys", "detail", id, "responses", params]`
 * (so invalidating a survey's detail refreshes its responses too).
 */
export const surveyKeys = {
  ...surveyEntityKeys,
  responses: (id: string, params: Record<string, unknown> = {}) =>
    [...surveyEntityKeys.detail(id), "responses", params] as const,
};

/** Options for one page of surveys. */
export function surveyListOptions(params?: SurveyListParams) {
  return queryOptions({
    queryKey: surveyKeys.list(params ?? {}),
    queryFn: () => surveysApi.list(params),
  });
}

/** Options for one survey; disabled until `id` is known. */
export function surveyOptions(id: string | undefined) {
  return queryOptions({
    queryKey: surveyKeys.detail(id as string),
    queryFn: () => surveysApi.get(id as string),
    enabled: !!id,
  });
}

/** Options for one page of a survey's responses; disabled until `id` is known. */
export function surveyResponsesOptions(id: string | undefined, params?: SurveyResponsesParams) {
  return queryOptions({
    queryKey: surveyKeys.responses(id as string, params ?? {}),
    queryFn: () => surveysApi.getResponses(id as string, params),
    enabled: !!id,
  });
}

/** Replaces `useSurveys(params)`. `params` is a getter, so the query follows reactive filters. */
export function createSurveys(params: Accessor<SurveyListParams | undefined> = () => undefined) {
  return createQuery(() => surveyListOptions(params()));
}

/** Replaces `useSurvey(id)`. */
export function createSurvey(id: Accessor<string | undefined>) {
  return createQuery(() => surveyOptions(id()));
}

/** Replaces `useSurveyResponses(id, params)`. */
export function createSurveyResponses(
  id: Accessor<string | undefined>,
  params: Accessor<SurveyResponsesParams | undefined> = () => undefined,
) {
  return createQuery(() => surveyResponsesOptions(id(), params()));
}

/** Creates a survey, then refreshes every survey list. */
export function createSurveyMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Survey, Error, CreateSurveyInput> {
  return {
    mutationFn: (data) => surveysApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
    },
  };
}

/** Updates a survey, then refreshes every survey list and the updated survey. */
export function updateSurveyMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<Survey, Error, UpdateSurveyInput> {
  return {
    mutationFn: ({ id, data }) => surveysApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: surveyKeys.detail(updated.id) });
    },
  };
}

/** Deletes a survey by id, then refreshes every survey list. */
export function deleteSurveyMutationOptions(
  queryClient: QueryClient,
): CreateMutationOptions<{ deleted: boolean }, Error, string> {
  return {
    mutationFn: (id) => surveysApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
    },
  };
}

/** Replaces `useCreateSurvey()`. Call during component init. */
export function createCreateSurvey() {
  const queryClient = useQueryClient();
  return createMutation(() => createSurveyMutationOptions(queryClient));
}

/** Replaces `useUpdateSurvey()`. Call during component init. */
export function createUpdateSurvey() {
  const queryClient = useQueryClient();
  return createMutation(() => updateSurveyMutationOptions(queryClient));
}

/** Replaces `useDeleteSurvey()`. Call during component init. */
export function createDeleteSurvey() {
  const queryClient = useQueryClient();
  return createMutation(() => deleteSurveyMutationOptions(queryClient));
}
