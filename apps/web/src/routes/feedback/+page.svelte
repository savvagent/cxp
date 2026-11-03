<script lang="ts">
  // The feedback list: the type filter (`?feedback_type=`) and the catalog
  // filters live in the URL; the page number is local state, back to the first
  // page whenever a filter changes.
  import { m } from "#lib/paraglide/messages.js";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { catalogFiltersFromUrl } from "#lib/catalog-filters.js";
  import CatalogFilterBar from "#lib/components/catalog/catalog-filter-bar.svelte";
  import {
    FEEDBACK_TYPES,
    feedbackListParams,
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
  import { ALL } from "#lib/forms.js";
  import { formatNumber, localeDate } from "#lib/format.js";
  import { pageWindow } from "#lib/pagination.js";
  import { createFeedback } from "#lib/queries/index.js";
  import { pushUrl, queryHref, searchOf } from "#lib/url-state.js";

  /** Zero-based page number; React kept it in component state, not the URL. */
  let pageIndex = $state(0);

  const feedbackType = $derived(feedbackTypeFromUrl(searchOf(page.url)));
  const catalogFilters = $derived(catalogFiltersFromUrl(searchOf(page.url)));

  const feedback = createFeedback(() => feedbackListParams(feedbackType, pageIndex, catalogFilters));

  const items = $derived(feedback.data?.data ?? []);
  const total = $derived(feedback.data?.total ?? 0);
  const paging = $derived(pageWindow(total, pageIndex));

  function setFeedbackType(value: string | undefined) {
    pushUrl(queryHref(resolve("/feedback"), withFeedbackType(searchOf(page.url), value)));
    pageIndex = 0;
  }
</script>

<div class="space-y-6">
  <PageHeader title={m.nav_feedback()} />

  <div class="flex flex-wrap items-center gap-3">
    <Select.Root type="single" bind:value={() => feedbackType ?? ALL, (v) => setFeedbackType(v)}>
      <Select.Trigger class="w-[180px]" aria-label={m.feedback_filter_type()}>
        {feedbackType ? feedbackTypeLabel(feedbackType) : m.feedback_all_types()}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label={m.feedback_all_types()} />
        {#each FEEDBACK_TYPES as t (t.value)}
          <Select.Item value={t.value} label={t.label} />
        {/each}
      </Select.Content>
    </Select.Root>
    {#if feedbackType}
      <Button variant="ghost" size="sm" onclick={() => setFeedbackType(undefined)}>{m.common_clear_filter()}</Button>
    {/if}
  </div>

  <CatalogFilterBar onChange={() => (pageIndex = 0)} />

  {#if feedback.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={MessageSquare}
      title={m.feedback_none()}
      description={m.feedback_none_description()}
    />
  {:else}
    <div class="overflow-x-auto rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{m.label_type()}</Table.Head>
            <Table.Head>{m.label_subject()}</Table.Head>
            <Table.Head>{m.label_rating()}</Table.Head>
            <Table.Head>{m.label_customer_id()}</Table.Head>
            <Table.Head class="hidden md:table-cell">{m.label_created_at()}</Table.Head>
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
                {localeDate(item.createdAt)}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

    {#if paging.totalPages > 1}
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {m.feedback_showing({ from: formatNumber(paging.from), to: formatNumber(paging.to), total: formatNumber(total) })}
        </span>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" onclick={() => (pageIndex -= 1)} disabled={!paging.hasPrev}>
            {m.common_previous()}
          </Button>
          <Button variant="outline" size="sm" onclick={() => (pageIndex += 1)} disabled={!paging.hasNext}>
            {m.common_next()}
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
