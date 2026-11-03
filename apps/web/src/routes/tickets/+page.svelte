<script lang="ts">
  // The tickets list (port of the React console's src/pages/tickets/index.tsx): status,
  // priority and catalog filters and the page live in the URL under the same
  // parameter names; rows open the ticket; tickets are created and deleted here.
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import FilterX from "@lucide/svelte/icons/filter-x";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { toast } from "svelte-sonner";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import PriorityBadge from "#lib/components/shared/priority-badge.svelte";
  import StatusBadge from "#lib/components/shared/status-badge.svelte";
  import CreateTicketDialog from "#lib/components/tickets/create-ticket-dialog.svelte";
  import CatalogFilterBar from "#lib/components/catalog/catalog-filter-bar.svelte";
  import {
    ALL,
    PRIORITY_OPTIONS,
    STATUS_OPTIONS,
    hasTicketFilters,
    optionLabel,
    pagination,
    ticketCount,
    ticketListParams,
    ticketListStateFromUrl,
    withPage,
    withTicketFilter,
  } from "#lib/components/tickets/tickets.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import * as Table from "#lib/components/ui/table/index.js";
  import { createDeleteTicket, createTickets } from "#lib/queries/index.js";
  import type { Ticket } from "#lib/types.js";

  /** A writable copy of the URL's query (Kit's own is read-only). */
  function currentParams() {
    return new URLSearchParams(page.url.search);
  }

  const listState = $derived(ticketListStateFromUrl(new URLSearchParams(page.url.search)));

  const tickets = createTickets(() => ticketListParams(listState));
  const deleteTicket = createDeleteTicket();

  let createOpen = $state(false);
  let deleteTarget = $state<Ticket | null>(null);
  let deleteOpen = $state(false);

  const rows = $derived(tickets.data?.data ?? []);
  const total = $derived(tickets.data?.total ?? 0);
  const hasFilters = $derived(hasTicketFilters(listState));
  const pages = $derived(pagination(total, listState.page));

  /** Moves to the list with `params` as its query, as a new history entry. */
  function setSearchParams(params: URLSearchParams) {
    const qs = params.toString();
    void goto(`${resolve("/tickets")}${qs ? `?${qs}` : ""}`, { reset: false });
  }

  function setFilter(key: "status" | "priority", value: string) {
    setSearchParams(withTicketFilter(currentParams(), key, value));
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  function setPage(next: number) {
    setSearchParams(withPage(currentParams(), next));
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
      toast.success("Ticket deleted");
      deleteOpen = false;
      deleteTarget = null;
    } catch {
      toast.error("Failed to delete ticket");
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Tickets"
    description="Manage customer support tickets"
    action="New Ticket"
    onAction={() => (createOpen = true)}
  />

  <div class="flex flex-wrap items-center gap-3">
    <Select.Root
      type="single"
      bind:value={() => listState.status, (v) => setFilter("status", v)}
    >
      <Select.Trigger class="w-40" aria-label="Filter by status">
        {listState.status ? optionLabel(STATUS_OPTIONS, listState.status) : "All statuses"}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label="All statuses" />
        {#each STATUS_OPTIONS as opt (opt.value)}
          <Select.Item value={opt.value} label={opt.label} />
        {/each}
      </Select.Content>
    </Select.Root>

    <Select.Root
      type="single"
      bind:value={() => listState.priority, (v) => setFilter("priority", v)}
    >
      <Select.Trigger class="w-40" aria-label="Filter by priority">
        {listState.priority ? optionLabel(PRIORITY_OPTIONS, listState.priority) : "All priorities"}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label="All priorities" />
        {#each PRIORITY_OPTIONS as opt (opt.value)}
          <Select.Item value={opt.value} label={opt.label} />
        {/each}
      </Select.Content>
    </Select.Root>

    {#if hasFilters}
      <Button variant="ghost" size="sm" onclick={clearFilters} class="gap-1.5">
        <FilterX class="h-4 w-4" />
        Clear filters
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
      title="Failed to load tickets"
      description="There was an error fetching tickets. Please try again."
    />
  {:else if rows.length === 0}
    <EmptyState
      icon={TicketIcon}
      title="No tickets found"
      description={hasFilters
        ? "No tickets match the current filters."
        : "Create your first support ticket to get started."}
      action={hasFilters ? "Clear filters" : "New Ticket"}
      onAction={hasFilters ? clearFilters : () => (createOpen = true)}
    />
  {:else}
    <div class="rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Subject</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Priority</Table.Head>
            <Table.Head class="hidden sm:table-cell">Customer ID</Table.Head>
            <Table.Head class="hidden md:table-cell">Channel</Table.Head>
            <Table.Head class="hidden lg:table-cell">Created</Table.Head>
            <Table.Head class="w-12">
              <span class="sr-only">Actions</span>
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
              <Table.Cell class="hidden capitalize text-muted-foreground md:table-cell">
                {ticket.channel ?? "-"}
              </Table.Cell>
              <Table.Cell class="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ticket: ${ticket.subject}`}
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
      <p class="text-sm text-muted-foreground">Page {listState.page + 1} of {pages.totalPages}</p>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => setPage(listState.page - 1)}
          disabled={!pages.hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft class="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() => setPage(listState.page + 1)}
          disabled={!pages.hasNext}
          aria-label="Next page"
        >
          Next
          <ChevronRight class="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}

  <CreateTicketDialog bind:open={createOpen} />

  <ConfirmDialog
    bind:open={deleteOpen}
    onOpenChange={onDeleteOpenChange}
    title="Delete ticket?"
    description={deleteTarget
      ? `"${deleteTarget.subject}" will be permanently deleted. This action cannot be undone.`
      : ""}
    onConfirm={handleDelete}
    loading={deleteTicket.isPending}
  />
</div>
