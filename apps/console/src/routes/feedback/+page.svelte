<script lang="ts">
  // The feedback list (port of apps/web/src/pages/feedback/index.tsx): the type
  // filter (`?feedback_type=`) and the catalog filters live in the URL; the page
  // number is local state, back to the first page whenever a filter changes.
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { catalogFiltersFromUrl } from "#lib/catalog-filters.js";
  import CatalogFilterBar from "#lib/components/catalog/catalog-filter-bar.svelte";
  import { searchOf } from "#lib/components/catalog/url.js";
  import {
    ALL,
    FEEDBACK_TYPES,
    feedbackListParams,
    feedbackPagination,
    feedbackTypeBadgeVariant,
    feedbackTypeFromUrl,
    feedbackTypeLabel,
    withFeedbackType,
  } from "#lib/components/feedback/feedback.js";
  import RatingStars from "#lib/components/feedback/rating-stars.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import * as Table from "#lib/components/ui/table/index.js";
  import { createFeedback } from "#lib/queries/index.js";

  /** Zero-based page number; React kept it in component state, not the URL. */
  let pageIndex = $state(0);

  const feedbackType = $derived(feedbackTypeFromUrl(searchOf(page.url)));
  const catalogFilters = $derived(catalogFiltersFromUrl(searchOf(page.url)));

  const feedback = createFeedback(() => feedbackListParams(feedbackType, pageIndex, catalogFilters));

  const items = $derived(feedback.data?.data ?? []);
  const total = $derived(feedback.data?.total ?? 0);
  const paging = $derived(feedbackPagination(total, pageIndex));

  function setFeedbackType(value: string | undefined) {
    const qs = withFeedbackType(searchOf(page.url), value).toString();
    // A new history entry, as react-router's `setSearchParams`; focus and
    // scroll stay where they are.
    void goto(`${resolve("/feedback")}${qs ? `?${qs}` : ""}`, { reset: false });
    pageIndex = 0;
  }
</script>

<div class="space-y-6">
  <PageHeader title="Feedback" />

  <div class="flex flex-wrap items-center gap-3">
    <Select.Root type="single" bind:value={() => feedbackType ?? ALL, (v) => setFeedbackType(v)}>
      <Select.Trigger class="w-[180px]" aria-label="Filter by type">
        {feedbackType ? feedbackTypeLabel(feedbackType) : "All types"}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label="All types" />
        {#each FEEDBACK_TYPES as t (t.value)}
          <Select.Item value={t.value} label={t.label} />
        {/each}
      </Select.Content>
    </Select.Root>
    {#if feedbackType}
      <Button variant="ghost" size="sm" onclick={() => setFeedbackType(undefined)}>Clear filter</Button>
    {/if}
  </div>

  <CatalogFilterBar onChange={() => (pageIndex = 0)} />

  {#if feedback.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={MessageSquare}
      title="No feedback found"
      description="Adjust your filters or check back later."
    />
  {:else}
    <div class="overflow-x-auto rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Type</Table.Head>
            <Table.Head>Subject</Table.Head>
            <Table.Head>Rating</Table.Head>
            <Table.Head>Customer ID</Table.Head>
            <Table.Head class="hidden md:table-cell">Created At</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as item (item.id)}
            <Table.Row>
              <Table.Cell>
                <Badge variant={feedbackTypeBadgeVariant(item.feedbackType)}>
                  {feedbackTypeLabel(item.feedbackType)}
                </Badge>
              </Table.Cell>
              <Table.Cell class="max-w-[200px] truncate">
                {#if item.subject != null}
                  {item.subject}
                {:else}
                  <span class="text-xs text-muted-foreground">—</span>
                {/if}
              </Table.Cell>
              <Table.Cell>
                <RatingStars rating={item.rating} />
              </Table.Cell>
              <Table.Cell class="font-mono text-xs">{item.customerId?.slice(0, 8) ?? "—"}</Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
                {new Date(item.createdAt).toLocaleDateString()}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

    {#if paging.totalPages > 1}
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>{paging.range}</span>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" onclick={() => (pageIndex -= 1)} disabled={!paging.hasPrev}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onclick={() => (pageIndex += 1)} disabled={!paging.hasNext}>
            Next
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
