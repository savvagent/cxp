<script lang="ts">
  // One survey: its details and questions, edited in place (title, description, status and the
  // questions JSON), and the first page of its responses.
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ClipboardList from "@lucide/svelte/icons/clipboard-list";
  import ListOrdered from "@lucide/svelte/icons/list-ordered";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Save from "@lucide/svelte/icons/save";
  import X from "@lucide/svelte/icons/x";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { toast } from "svelte-sonner";
  import CopyableId from "#lib/components/shared/copyable-id.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import QuestionsList from "#lib/components/surveys/questions-list.svelte";
  import {
    ACTIVE_BADGE_CLASS,
    ACTIVE_TOGGLE_CLASS,
    QUESTIONS_PLACEHOLDER,
    answersPreview,
    editFormFromSurvey,
    statusLabel,
    surveyUpdate,
    type SurveyEditForm,
  } from "#lib/components/surveys/surveys.js";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
  import * as Table from "#lib/components/ui/table/index.js";
  import { Textarea } from "#lib/components/ui/textarea/index.js";
  import { localeDate, localeDateTime } from "#lib/format.js";
  import { createSurvey, createSurveyResponses, createUpdateSurvey } from "#lib/queries/index.js";
  import { responsesCount } from "#lib/surveys.js";

  const id = $derived(page.params.id);

  const surveyQuery = createSurvey(() => id);
  const responsesQuery = createSurveyResponses(() => id);
  const updateSurvey = createUpdateSurvey();

  let editing = $state(false);
  let form = $state<SurveyEditForm>({ title: "", description: "", active: true, questionsRaw: "" });

  const survey = $derived(surveyQuery.data);
  const responses = $derived(responsesQuery.data?.data ?? []);
  const total = $derived(responsesQuery.data?.total ?? 0);

  // Fill the form whenever editing starts or the survey (re)loads while editing,
  // as React's effect on `[survey, editing]` did.
  $effect(() => {
    if (survey && editing) form = editFormFromSurvey(survey);
  });

  async function handleSave() {
    if (!id) return;
    const result = surveyUpdate(id, form);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    try {
      await updateSurvey.mutateAsync(result.update);
    } catch (err) {
      toast.error(`Failed to update survey: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    toast.success("Survey updated");
    editing = false;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <a
      href={resolve("/surveys")}
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to Surveys
    </a>
    {#if survey && !surveyQuery.isLoading && !editing}
      <Button variant="outline" size="sm" onclick={() => (editing = true)}>
        <Pencil class="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
    {/if}
    {#if editing}
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" onclick={() => (editing = false)} disabled={updateSurvey.isPending}>
          <X class="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button size="sm" onclick={handleSave} disabled={updateSurvey.isPending}>
          <Save class="mr-1.5 h-3.5 w-3.5" />
          {updateSurvey.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    {/if}
  </div>

  <Card.Root>
    <Card.Header>
      {#if surveyQuery.isLoading}
        <div class="space-y-2">
          <Skeleton class="h-7 w-64" />
          <Skeleton class="h-4 w-40" />
        </div>
      {:else if survey}
        {#if editing}
          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label for="edit-title">Title <span class="text-destructive">*</span></Label>
              <Input id="edit-title" bind:value={form.title} placeholder="Survey title" />
            </div>
            <div class="space-y-1.5">
              <Label for="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                bind:value={form.description}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div class="flex items-center gap-3">
              <Label for="edit-active">Status</Label>
              <Button
                id="edit-active"
                type="button"
                variant={form.active ? "default" : "secondary"}
                size="sm"
                class={form.active ? ACTIVE_TOGGLE_CLASS : ""}
                onclick={() => (form.active = !form.active)}
              >
                {statusLabel(form.active)}
              </Button>
            </div>
          </div>
        {:else}
          <div class="flex flex-wrap items-center justify-between gap-4">
            <Card.Title class="text-xl">{survey.title}</Card.Title>
            <Badge variant={survey.active ? "default" : "secondary"} class={survey.active ? ACTIVE_BADGE_CLASS : ""}>
              {statusLabel(survey.active)}
            </Badge>
          </div>
          {#if survey.description}
            <Card.Description>{survey.description}</Card.Description>
          {/if}
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <CopyableId value={survey.id} />
            <span>Created {localeDate(survey.createdAt)}</span>
          </div>
        {/if}
      {:else}
        <Card.Title>Survey not found</Card.Title>
      {/if}
    </Card.Header>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <div class="flex items-center gap-2">
        <ListOrdered class="h-4 w-4 text-muted-foreground" />
        <Card.Title class="text-base">Questions</Card.Title>
      </div>
    </Card.Header>
    <Card.Content>
      {#if surveyQuery.isLoading}
        <div class="space-y-2">
          {#each [1, 2, 3] as i (i)}
            <Skeleton class="h-6 w-full" />
          {/each}
        </div>
      {:else if editing}
        <div class="space-y-1.5">
          <Textarea
            bind:value={form.questionsRaw}
            placeholder={QUESTIONS_PLACEHOLDER}
            rows={10}
            class="font-mono text-xs"
          />
          <p class="text-xs text-muted-foreground">JSON array of question objects.</p>
        </div>
      {:else}
        <QuestionsList questions={survey?.questions} />
      {/if}
    </Card.Content>
  </Card.Root>

  <div class="space-y-3">
    <h3 class="text-lg font-semibold">
      Responses{responsesQuery.data ? ` (${responsesCount(responses.length, total)})` : ""}
    </h3>
    {#if responsesQuery.isLoading}
      <LoadingTable />
    {:else if responsesQuery.isError}
      <EmptyState title="Failed to load responses" description="Check your connection and try again." />
    {:else if responses.length === 0}
      <EmptyState
        icon={ClipboardList}
        title="No responses yet"
        description="Responses will appear here once customers complete the survey."
      />
    {:else}
      <div class="overflow-x-auto rounded-md border">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Customer ID</Table.Head>
              <Table.Head>Completed At</Table.Head>
              <Table.Head>Answers</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each responses as response (response.id)}
              {@const answers = answersPreview(response.answers)}
              <Table.Row>
                <Table.Cell class="font-mono text-xs">{response.customerId?.slice(0, 8) ?? "—"}</Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {response.completedAt ? localeDateTime(response.completedAt) : "—"}
                </Table.Cell>
                <Table.Cell class="max-w-[300px] truncate font-mono text-xs" title={answers.full}>
                  {answers.short}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </div>
</div>
