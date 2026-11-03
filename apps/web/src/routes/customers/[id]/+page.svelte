<script lang="ts">
  // One customer: the profile card with its edit dialog, and the customer
  // 360's recent tickets, feedback and interactions in tabs.
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import EditCustomerDialog from "#lib/components/customers/edit-customer-dialog.svelte";
  import FeedbackTab from "#lib/components/customers/feedback-tab.svelte";
  import InteractionsTab from "#lib/components/customers/interactions-tab.svelte";
  import ProfileCard from "#lib/components/customers/profile-card.svelte";
  import ProfileSkeleton from "#lib/components/customers/profile-skeleton.svelte";
  import TicketsTab from "#lib/components/customers/tickets-tab.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
  import * as Tabs from "#lib/components/ui/tabs/index.js";
  import { createCustomer, createCustomer360 } from "#lib/queries/index.js";

  const id = $derived(page.params.id);

  let editOpen = $state(false);
  let tab = $state("tickets");

  const customerQuery = createCustomer(() => id);
  const query360 = createCustomer360(() => id);

  const isLoading = $derived(customerQuery.isLoading || query360.isLoading);
  const customer = $derived(customerQuery.data);

  const tickets = $derived(query360.data?.recentTickets ?? []);
  const feedback = $derived(query360.data?.recentFeedback ?? []);
  const interactions = $derived(query360.data?.recentInteractions ?? []);

  const backClass =
    "inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground";
</script>

{#if isLoading}
  <div class="flex flex-col gap-6">
    <!-- Back link skeleton -->
    <Skeleton class="h-4 w-28" />

    <ProfileSkeleton />

    <div class="space-y-4">
      <Skeleton class="h-10 w-64" />
      <Skeleton class="h-48 w-full" />
    </div>
  </div>
{:else if customerQuery.isError || !customer}
  <div class="flex flex-col gap-6">
    <a href={resolve("/customers")} class={backClass}>
      <ArrowLeft class="h-4 w-4" />
      Back to Customers
    </a>
    <EmptyState
      title="Customer not found"
      description="This customer may have been deleted or the link is invalid."
      action="View all customers"
      onAction={() => void goto(resolve("/customers"))}
    />
  </div>
{:else}
  <div class="flex flex-col gap-6">
    <!-- Back navigation -->
    <a href={resolve("/customers")} class="{backClass} transition-colors">
      <ArrowLeft class="h-4 w-4" />
      Back to Customers
    </a>

    <!-- Profile card -->
    <ProfileCard {customer} onEdit={() => (editOpen = true)} />

    <!-- Activity tabs -->
    <Tabs.Root bind:value={tab}>
      <Tabs.List aria-label="Customer activity">
        <Tabs.Trigger value="tickets">
          Tickets
          {#if tickets.length > 0}
            <Badge
              variant="secondary"
              class="ml-2 h-5 min-w-[20px] px-1 text-xs"
              aria-label="{tickets.length} tickets"
            >
              {tickets.length}
            </Badge>
          {/if}
        </Tabs.Trigger>
        <Tabs.Trigger value="feedback">
          Feedback
          {#if feedback.length > 0}
            <Badge
              variant="secondary"
              class="ml-2 h-5 min-w-[20px] px-1 text-xs"
              aria-label="{feedback.length} feedback items"
            >
              {feedback.length}
            </Badge>
          {/if}
        </Tabs.Trigger>
        <Tabs.Trigger value="interactions">
          Interactions
          {#if interactions.length > 0}
            <Badge
              variant="secondary"
              class="ml-2 h-5 min-w-[20px] px-1 text-xs"
              aria-label="{interactions.length} interactions"
            >
              {interactions.length}
            </Badge>
          {/if}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="tickets" class="mt-4">
        <TicketsTab {tickets} />
      </Tabs.Content>

      <Tabs.Content value="feedback" class="mt-4">
        <FeedbackTab {feedback} />
      </Tabs.Content>

      <Tabs.Content value="interactions" class="mt-4">
        <InteractionsTab {interactions} />
      </Tabs.Content>
    </Tabs.Root>

    <!-- Edit dialog (only rendered once the customer is loaded) -->
    <EditCustomerDialog {customer} bind:open={editOpen} />
  </div>
{/if}
