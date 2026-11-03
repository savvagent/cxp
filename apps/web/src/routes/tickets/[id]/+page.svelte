<script lang="ts">
  // One ticket (port of the React console's src/pages/tickets/ticket-detail.tsx): its
  // subject, description and tags, and a properties panel that saves status,
  // priority and assignee as each one changes.
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import { toast } from "svelte-sonner";
  import PriorityBadge from "#lib/components/shared/priority-badge.svelte";
  import StatusBadge from "#lib/components/shared/status-badge.svelte";
  import TicketDetailSkeleton from "#lib/components/tickets/ticket-detail-skeleton.svelte";
  import {
    PRIORITY_OPTIONS,
    STATUS_OPTIONS,
    assigneeChange,
    formatDateTime,
    optionLabel,
    ticketFieldUpdate,
    type TicketField,
  } from "#lib/components/tickets/tickets.js";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { Separator } from "#lib/components/ui/separator/index.js";
  import { createTicket, createUpdateTicket } from "#lib/queries/index.js";

  const ticketQuery = createTicket(() => page.params.id);
  const updateTicket = createUpdateTicket();

  const ticket = $derived(ticketQuery.data);

  async function updateField(field: TicketField, value: string) {
    if (!ticket) return;
    try {
      await updateTicket.mutateAsync(ticketFieldUpdate(ticket.id, field, value));
      toast.success("Ticket updated");
    } catch {
      toast.error("Failed to update ticket");
    }
  }

  function backToList() {
    void goto(resolve("/tickets"));
  }

  function onAssigneeBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
    if (!ticket) return;
    const next = assigneeChange(event.currentTarget.value, ticket.assignedTo);
    if (next !== null) void updateField("assignedTo", next);
  }

  function onAssigneeKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
    if (event.key === "Enter") event.currentTarget.blur();
  }
</script>

{#if ticketQuery.isLoading}
  <TicketDetailSkeleton />
{:else if ticketQuery.isError || !ticket}
  <div class="space-y-4">
    <Button variant="ghost" onclick={backToList}>
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to Tickets
    </Button>
    <p class="text-destructive">Ticket not found or failed to load.</p>
  </div>
{:else}
  <div class="space-y-6">
    <Button
      variant="ghost"
      size="sm"
      onclick={backToList}
      class="gap-2"
      aria-label="Back to tickets list"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to Tickets
    </Button>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-3">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 class="text-2xl leading-tight font-bold tracking-tight">{ticket.subject}</h1>
        </div>

        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base font-semibold">Description</Card.Title>
          </Card.Header>
          <Card.Content>
            {#if ticket.description}
              <p class="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {ticket.description}
              </p>
            {:else}
              <p class="text-sm text-muted-foreground italic">No description provided.</p>
            {/if}
          </Card.Content>
        </Card.Root>

        {#if ticket.tags && ticket.tags.length > 0}
          <Card.Root>
            <Card.Header>
              <Card.Title class="text-base font-semibold">Tags</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="flex flex-wrap gap-2">
                {#each ticket.tags as tag (tag)}
                  <Badge variant="secondary">{tag}</Badge>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>

      <div>
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base font-semibold">Properties</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-5">
            <div class="space-y-1.5">
              <Label for="detail-status">Status</Label>
              <Select.Root
                type="single"
                bind:value={() => ticket.status, (v) => void updateField("status", v)}
                disabled={updateTicket.isPending}
              >
                <Select.Trigger id="detail-status" class="w-full" aria-label="Change ticket status">
                  {optionLabel(STATUS_OPTIONS, ticket.status)}
                </Select.Trigger>
                <Select.Content>
                  {#each STATUS_OPTIONS as opt (opt.value)}
                    <Select.Item value={opt.value} label={opt.label} />
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <div class="space-y-1.5">
              <Label for="detail-priority">Priority</Label>
              <Select.Root
                type="single"
                bind:value={() => ticket.priority, (v) => void updateField("priority", v)}
                disabled={updateTicket.isPending}
              >
                <Select.Trigger id="detail-priority" class="w-full" aria-label="Change ticket priority">
                  {optionLabel(PRIORITY_OPTIONS, ticket.priority)}
                </Select.Trigger>
                <Select.Content>
                  {#each PRIORITY_OPTIONS as opt (opt.value)}
                    <Select.Item value={opt.value} label={opt.label} />
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <div class="space-y-1.5">
              <Label for="detail-assigned">Assigned To</Label>
              <Input
                id="detail-assigned"
                value={ticket.assignedTo ?? ""}
                placeholder="Unassigned"
                onblur={onAssigneeBlur}
                onkeydown={onAssigneeKeydown}
                disabled={updateTicket.isPending}
                aria-label="Assigned to"
              />
            </div>

            <Separator />

            <div class="space-y-1.5">
              <p class="text-sm font-medium">Channel</p>
              {#if ticket.channel}
                <Badge variant="outline" class="capitalize">{ticket.channel}</Badge>
              {:else}
                <p class="text-sm text-muted-foreground">-</p>
              {/if}
            </div>

            <div class="space-y-1.5">
              <p class="text-sm font-medium">Customer</p>
              <a
                href={resolve("/customers/[id]", { id: ticket.customerId })}
                class="inline-flex items-center gap-1 rounded font-mono text-sm text-primary hover:underline focus:ring-2 focus:ring-ring focus:outline-none"
                aria-label={`View customer ${ticket.customerId}`}
              >
                {ticket.customerId.slice(0, 8)}...
                <ExternalLink class="h-3 w-3 shrink-0" />
              </a>
            </div>

            <Separator />

            <div class="space-y-3">
              <div>
                <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Created</p>
                <p class="mt-0.5 text-sm">{formatDateTime(ticket.createdAt)}</p>
              </div>
              <div>
                <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Last Updated
                </p>
                <p class="mt-0.5 text-sm">{formatDateTime(ticket.updatedAt)}</p>
              </div>
              {#if ticket.resolvedAt}
                <div>
                  <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Resolved
                  </p>
                  <p class="mt-0.5 text-sm">{formatDateTime(ticket.resolvedAt)}</p>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  </div>
{/if}
