<script lang="ts">
  // The tickets list: status, priority and catalog filters and the page live in
  // the URL under the React console's parameter names; rows open the ticket;
  // tickets are created and deleted here.
  import { m } from "#lib/paraglide/messages.js";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import FilterX from "@lucide/svelte/icons/filter-x";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { toast } from "svelte-sonner";
  import { toastError } from "#lib/errors.js";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import PriorityBadge from "#lib/components/shared/priority-badge.svelte";
  import StatusBadge from "#lib/components/shared/status-badge.svelte";
  import CreateTicketDialog from "#lib/components/tickets/create-ticket-dialog.svelte";
  import CatalogFilterBar from "#lib/components/catalog/catalog-filter-bar.svelte";
  import { formatNumber, localeDate } from "#lib/format.js";
  import { ALL } from "#lib/forms.js";
  import { pageWindow } from "#lib/pagination.js";
  import { pushUrl, queryHref, searchOf } from "#lib/url-state.js";
  import {
    PRIORITY_OPTIONS,
    STATUS_OPTIONS,
    channelLabel,
    hasTicketFilters,
    optionLabel,
    ticketCount,
    ticketListParams,
    ticketListStateFromUrl,
    withPage,
    withTicketFilter,
  } from "#lib/components/tickets/tickets.js";
  import { Button } from "@savvagent/console-ui/ui/button";
  import * as Select from "@savvagent/console-ui/ui/select";
  import * as Table from "@savvagent/console-ui/ui/table";
  import { createDeleteTicket, createTickets } from "#lib/queries/index.js";
  import type { Ticket } from "#lib/types.js";

  const listState = $derived(ticketListStateFromUrl(searchOf(page.url)));

  const tickets = createTickets(() => ticketListParams(listState));
  const deleteTicket = createDeleteTicket();

  let createOpen = $state(false);
  let deleteTarget = $state<Ticket | null>(null);
  let deleteOpen = $state(false);

  const rows = $derived(tickets.data?.data ?? []);
  const total = $derived(tickets.data?.total ?? 0);
  const hasFilters = $derived(hasTicketFilters(listState));
  const pages = $derived(pageWindow(total, listState.page));

  /** Moves to the list with `params` as its query, as a new history entry. */
  function setSearchParams(params: URLSearchParams) {
    pushUrl(queryHref(resolve("/tickets"), params));
  }

  function setFilter(key: "status" | "priority", value: string) {
    setSearchParams(withTicketFilter(searchOf(page.url), key, value));
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  function setPage(next: number) {
    setSearchParams(withPage(searchOf(page.url), next));
  }

  function openTicket(ticket: Ticket) {
    void goto(resolve("/tickets/[id]", { id: ticket.id }));
  }

  function askDelete(event: MouseEvent, ticket: Ticket) {
    event.stopPropagation();
    deleteTarget = ticket;
    deleteOpen = true;
  }

  function onDeleteOpenChange(open: boolean) {
    if (!open) deleteTarget = null;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTicket.mutateAsync(deleteTarget.id);
    } catch (err) {
      toastError(err, m.tickets_delete_failed(), "fixed");
      return;
    }
    toast.success(m.tickets_deleted());
    deleteOpen = false;
    deleteTarget = null;
  }
</script>

<div class="space-y-6">
  <PageHeader
    title={m.nav_tickets()}
    description={m.tickets_description()}
    action={m.tickets_new()}
    onAction={() => (createOpen = true)}
  />

  <div class="flex flex-wrap items-center gap-3">
    <Select.Root
      type="single"
      bind:value={() => listState.status, (v) => setFilter("status", v)}
    >
      <Select.Trigger class="w-40" aria-label={m.tickets_filter_status()}>
        {listState.status ? optionLabel(STATUS_OPTIONS, listState.status) : m.tickets_all_statuses()}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label={m.tickets_all_statuses()} />
        {#each STATUS_OPTIONS as opt (opt.value)}
          <Select.Item value={opt.value} label={opt.label} />
        {/each}
      </Select.Content>
    </Select.Root>

    <Select.Root
      type="single"
      bind:value={() => listState.priority, (v) => setFilter("priority", v)}
    >
      <Select.Trigger class="w-40" aria-label={m.tickets_filter_priority()}>
        {listState.priority ? optionLabel(PRIORITY_OPTIONS, listState.priority) : m.tickets_all_priorities()}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label={m.tickets_all_priorities()} />
        {#each PRIORITY_OPTIONS as opt (opt.value)}
          <Select.Item value={opt.value} label={opt.label} />
        {/each}
      </Select.Content>
    </Select.Root>

    {#if hasFilters}
      <Button variant="ghost" size="sm" onclick={clearFilters} class="gap-1.5">
        <FilterX class="h-4 w-4" />
        {m.common_clear_filters()}
      </Button>
    {/if}

    {#if !tickets.isLoading}
      <span class="ml-auto text-sm text-muted-foreground">{ticketCount(total)}</span>
    {/if}
  </div>

  <!-- The bar writes the catalog filters to the URL itself; a change returns to the first page. -->
  <CatalogFilterBar resetParams={["page"]} />

  {#if tickets.isLoading}
    <LoadingTable rows={8} />
  {:else if tickets.isError}
    <EmptyState
      icon={TicketIcon}
      title={m.tickets_load_failed()}
      description={m.tickets_load_failed_description()}
    />
  {:else if rows.length === 0}
    <EmptyState
      icon={TicketIcon}
      title={m.tickets_none()}
      description={hasFilters ? m.tickets_none_filtered() : m.tickets_empty_description()}
      action={hasFilters ? m.common_clear_filters() : m.tickets_new()}
      onAction={hasFilters ? clearFilters : () => (createOpen = true)}
    />
  {:else}
    <div class="rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{m.label_subject()}</Table.Head>
            <Table.Head>{m.label_status()}</Table.Head>
            <Table.Head>{m.label_priority()}</Table.Head>
            <Table.Head class="hidden sm:table-cell">{m.label_customer_id()}</Table.Head>
            <Table.Head class="hidden md:table-cell">{m.label_channel()}</Table.Head>
            <Table.Head class="hidden lg:table-cell">{m.label_created()}</Table.Head>
            <Table.Head class="w-12">
              <span class="sr-only">{m.common_actions()}</span>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as ticket (ticket.id)}
            <Table.Row class="cursor-pointer" onclick={() => openTicket(ticket)}>
              <Table.Cell class="max-w-xs truncate font-medium">{ticket.subject}</Table.Cell>
              <Table.Cell><StatusBadge status={ticket.status} /></Table.Cell>
              <Table.Cell><PriorityBadge priority={ticket.priority} /></Table.Cell>
              <Table.Cell class="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                {ticket.customerId?.slice(0, 8) ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-muted-foreground md:table-cell">
                {ticket.channel ? channelLabel(ticket.channel) : "-"}
              </Table.Cell>
              <Table.Cell class="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
                {localeDate(ticket.createdAt)}
              </Table.Cell>
              <Table.Cell>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={m.tickets_delete_aria({ subject: ticket.subject })}
                  onclick={(e: MouseEvent) => askDelete(e, ticket)}
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  {#if pages.totalPages > 1}
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        {m.tickets_page({ page: formatNumber(listState.page + 1), pages: formatNumber(pages.totalPages) })}
      </p>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => setPage(listState.page - 1)}
          disabled={!pages.hasPrev}
          aria-label={m.common_previous_page()}
        >
          <ChevronLeft class="mr-1 h-4 w-4" />
          {m.common_previous()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() => setPage(listState.page + 1)}
          disabled={!pages.hasNext}
          aria-label={m.common_next_page()}
        >
          {m.common_next()}
          <ChevronRight class="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}

  <CreateTicketDialog bind:open={createOpen} />

  <ConfirmDialog
    bind:open={deleteOpen}
    onOpenChange={onDeleteOpenChange}
    title={m.tickets_delete_title()}
    description={deleteTarget ? m.tickets_delete_description({ subject: deleteTarget.subject }) : ""}
    onConfirm={handleDelete}
    loading={deleteTicket.isPending}
  />
</div>
