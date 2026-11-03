<script lang="ts">
  // The dashboard: the organization's headline counts.
  import Activity from "@lucide/svelte/icons/activity";
  import ClipboardList from "@lucide/svelte/icons/clipboard-list";
  import Layers from "@lucide/svelte/icons/layers";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import Ticket from "@lucide/svelte/icons/ticket";
  import Users from "@lucide/svelte/icons/users";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
  import { createDashboardMetrics } from "#lib/queries/index.js";

  const metrics = createDashboardMetrics();

  const cards = $derived([
    { title: "Total Customers", value: metrics.data?.totalCustomers, icon: Users },
    { title: "Open Tickets", value: metrics.data?.openTickets, icon: Ticket },
    { title: "Total Feedback", value: metrics.data?.totalFeedback, icon: MessageSquare },
    { title: "Total Surveys", value: metrics.data?.totalSurveys, icon: ClipboardList },
    { title: "Total Experiences", value: metrics.data?.totalExperiences, icon: Layers },
  ]);
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
    <p class="text-muted-foreground">Overview of your customer experience platform</p>
  </div>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {#each cards as card (card.title)}
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">{card.title}</Card.Title>
          <card.icon class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          {#if metrics.isLoading}
            <Skeleton class="h-8 w-24" />
          {:else}
            <div class="text-3xl font-bold">{card.value?.toLocaleString() ?? "—"}</div>
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <Card.Root>
    <Card.Header class="flex flex-row items-center gap-2">
      <Activity class="h-5 w-5 text-muted-foreground" />
      <Card.Title class="text-base">Recent Activity</Card.Title>
    </Card.Header>
    <Card.Content>
      <p class="text-sm text-muted-foreground">Dashboard charts coming soon</p>
    </Card.Content>
  </Card.Root>
</div>
