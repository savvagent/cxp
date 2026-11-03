<script lang="ts">
  // The surveys list: the first page of surveys under the catalog filters (in the URL), a "New Survey"
  // dialog, row navigation to /surveys/<id>, and a per-row delete.
  import { m } from "#lib/paraglide/messages.js";
  import ClipboardList from "@lucide/svelte/icons/clipboard-list";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { toast } from "svelte-sonner";
  import { toastError } from "#lib/errors.js";
  import { catalogFiltersFromUrl } from "#lib/catalog-filters.js";
  import CatalogFilterBar from "#lib/components/catalog/catalog-filter-bar.svelte";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import CreateSurveyDialog from "#lib/components/surveys/create-survey-dialog.svelte";
  import { ACTIVE_BADGE_CLASS, questionCount, statusLabel } from "#lib/components/surveys/surveys.js";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Table from "#lib/components/ui/table/index.js";
  import { formatNumber, localeDate } from "#lib/format.js";
  import { PAGE_SIZE, showingLine } from "#lib/pagination.js";
  import { createDeleteSurvey, createSurveys } from "#lib/queries/index.js";
  import { searchOf } from "#lib/url-state.js";
  import type { Survey } from "#lib/types.js";

  let createOpen = $state(false);
  let deleteTarget = $state<Survey | null>(null);

  const catalogFilters = $derived(catalogFiltersFromUrl(searchOf(page.url)));

  // React fetched the first page only (its page state was never changed).
  const surveys = createSurveys(() => ({ limit: PAGE_SIZE, offset: 0, ...catalogFilters }));
  const deleteSurvey = createDeleteSurvey();

  const items = $derived(surveys.data?.data ?? []);
  const total = $derived(surveys.data?.total ?? 0);
  const showing = $derived(showingLine(PAGE_SIZE, items.length, total, m.surveys_showing));

  function openSurvey(survey: Survey) {
    void goto(resolve("/surveys/[id]", { id: survey.id }));
  }

  function askDelete(event: MouseEvent, survey: Survey) {
    event.stopPropagation();
    deleteTarget = survey;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSurvey.mutateAsync(deleteTarget.id);
    } catch (err) {
      toastError(err, m.common_failed_to_delete(), "prefix");
      return;
    }
    toast.success(m.surveys_deleted());
    deleteTarget = null;
  }
</script>

<div class="space-y-6">
  <PageHeader title={m.nav_surveys()} action={m.surveys_new()} onAction={() => (createOpen = true)} />

  <CatalogFilterBar />

  {#if surveys.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={ClipboardList}
      title={m.surveys_empty()}
      description={m.surveys_empty_description()}
      action={m.surveys_new()}
      onAction={() => (createOpen = true)}
    />
  {:else}
    <div class="overflow-x-auto rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{m.label_title()}</Table.Head>
            <Table.Head class="hidden sm:table-cell">{m.label_description()}</Table.Head>
            <Table.Head>{m.label_status()}</Table.Head>
            <Table.Head>{m.label_questions()}</Table.Head>
            <Table.Head class="hidden md:table-cell">{m.label_created_at()}</Table.Head>
            <Table.Head class="w-[80px]" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as survey (survey.id)}
            <Table.Row class="cursor-pointer" onclick={() => openSurvey(survey)}>
              <Table.Cell class="font-medium">{survey.title}</Table.Cell>
              <Table.Cell class="hidden max-w-[240px] truncate text-sm text-muted-foreground sm:table-cell">
                {survey.description ?? "—"}
              </Table.Cell>
              <Table.Cell>
                <Badge
                  variant={survey.active ? "default" : "secondary"}
                  class={survey.active ? ACTIVE_BADGE_CLASS : ""}
                >
                  {statusLabel(survey.active)}
                </Badge>
              </Table.Cell>
              <Table.Cell>{formatNumber(questionCount(survey.questions))}</Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
                {localeDate(survey.createdAt)}
              </Table.Cell>
              <Table.Cell>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={m.surveys_delete_aria()}
                  onclick={(e: MouseEvent) => askDelete(e, survey)}
                >
                  <Trash2 class="h-4 w-4 text-muted-foreground" />
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  {#if showing}
    <p class="text-sm text-muted-foreground">{showing}</p>
  {/if}

  <CreateSurveyDialog bind:open={createOpen} />

  <ConfirmDialog
    bind:open={() => deleteTarget !== null, (open) => {
      if (!open) deleteTarget = null;
    }}
    title={m.surveys_delete_title()}
    description={m.surveys_delete_description({ title: deleteTarget?.title ?? "" })}
    onConfirm={handleDelete}
    loading={deleteSurvey.isPending}
  />
</div>
