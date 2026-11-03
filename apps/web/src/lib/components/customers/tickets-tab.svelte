<script lang="ts">
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import PriorityBadge from "#lib/components/shared/priority-badge.svelte";
  import StatusBadge from "#lib/components/shared/status-badge.svelte";
  import * as Table from "#lib/components/ui/table/index.js";
  import type { TicketSummary } from "#lib/types.js";
  import { formatDate } from "#lib/format.js";

  let { tickets }: { tickets: TicketSummary[] } = $props();
</script>

{#if tickets.length === 0}
  <EmptyState
    icon={MessageSquare}
    title="No tickets"
    description="This customer has no support tickets yet."
  />
{:else}
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Subject</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head class="hidden sm:table-cell">Priority</Table.Head>
          <Table.Head class="hidden md:table-cell">Channel</Table.Head>
          <Table.Head class="hidden sm:table-cell">Created</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each tickets as ticket (ticket.id)}
          <Table.Row>
            <Table.Cell class="max-w-[200px] truncate font-medium">{ticket.subject}</Table.Cell>
            <Table.Cell><StatusBadge status={ticket.status} /></Table.Cell>
            <Table.Cell class="hidden sm:table-cell">
              <PriorityBadge priority={ticket.priority} />
            </Table.Cell>
            <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
              {ticket.channel ?? "—"}
            </Table.Cell>
            <Table.Cell class="hidden text-sm text-muted-foreground sm:table-cell">
              {formatDate(ticket.createdAt)}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
{/if}
