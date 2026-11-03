<script lang="ts">
  // The dashboard: the organization's headline counts.
  import { m } from "#lib/paraglide/messages.js";
  import Activity from "@lucide/svelte/icons/activity";
  import ClipboardList from "@lucide/svelte/icons/clipboard-list";
  import Layers from "@lucide/svelte/icons/layers";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import Ticket from "@lucide/svelte/icons/ticket";
  import Users from "@lucide/svelte/icons/users";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
  import { formatNumber } from "#lib/format.js";
  import { createDashboardMetrics } from "#lib/queries/index.js";

  const metrics = createDashboardMetrics();

  const cards = $derived([
    { key: "customers", title: m.dashboard_total_customers(), value: metrics.data?.totalCustomers, icon: Users },
    { key: "tickets", title: m.dashboard_open_tickets(), value: metrics.data?.openTickets, icon: Ticket },
    { key: "feedback", title: m.dashboard_total_feedback(), value: metrics.data?.totalFeedback, icon: MessageSquare },
    { key: "surveys", title: m.dashboard_total_surveys(), value: metrics.data?.totalSurveys, icon: ClipboardList },
    { key: "experiences", title: m.dashboard_total_experiences(), value: metrics.data?.totalExperiences, icon: Layers },
  ]);
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold tracking-tight">{m.nav_dashboard()}</h2>
    <p class="text-muted-foreground">{m.dashboard_description()}</p>
  </div>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {#each cards as card (card.key)}
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">{card.title}</Card.Title>
          <card.icon class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          {#if metrics.isLoading}
            <Skeleton class="h-8 w-24" />
          {:else}
            <div class="text-3xl font-bold">{card.value === undefined ? "—" : formatNumber(card.value)}</div>
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <Card.Root>
    <Card.Header class="flex flex-row items-center gap-2">
      <Activity class="h-5 w-5 text-muted-foreground" />
      <Card.Title class="text-base">{m.dashboard_recent_activity()}</Card.Title>
    </Card.Header>
    <Card.Content>
      <p class="text-sm text-muted-foreground">{m.dashboard_charts_soon()}</p>
    </Card.Content>
  </Card.Root>
</div>
