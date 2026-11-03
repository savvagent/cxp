<script lang="ts">
  // Cmd/Ctrl+K (or the header's search button): go to a page, or find a
  // customer or a recent ticket. Ported from apps/web's command-palette.tsx.
  import ClipboardList from "@lucide/svelte/icons/clipboard-list";
  import Layers from "@lucide/svelte/icons/layers";
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Users from "@lucide/svelte/icons/users";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { customersApi, ticketsApi } from "#lib/api/index.js";
  import * as Command from "#lib/components/ui/command/index.js";
  import {
    NO_RESULTS,
    PALETTE_DEBOUNCE_MS,
    PALETTE_TICKET_SAMPLE,
    isPaletteShortcut,
    searchPalette,
    type PaletteResults,
  } from "./command-palette.js";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let query = $state("");
  let results = $state<PaletteResults>(NO_RESULTS);
  let loading = $state(false);

  const navigation = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/tickets", label: "Tickets", icon: TicketIcon },
    { path: "/feedback", label: "Feedback", icon: MessageSquare },
    { path: "/surveys", label: "Surveys", icon: ClipboardList },
    { path: "/catalog/experiences", label: "Catalog", icon: Layers },
  ] as const;

  const api = {
    searchCustomers: (q: string) => customersApi.search(q),
    recentTickets: () => ticketsApi.list({ limit: PALETTE_TICKET_SAMPLE }),
  };

  // Search once typing pauses. Only the latest search's answer is kept.
  let latest = 0;
  $effect(() => {
    const q = query;
    const timer = setTimeout(async () => {
      const id = ++latest;
      const searching = q.length > 0;
      loading = searching;
      try {
        const next = await searchPalette(q, results, api);
        if (id === latest) results = next;
      } finally {
        if (id === latest) loading = false;
      }
    }, PALETTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  function onkeydown(event: KeyboardEvent) {
    if (isPaletteShortcut(event)) {
      event.preventDefault();
      open = !open;
    }
  }

  function go(href: ReturnType<typeof resolve>) {
    open = false;
    query = "";
    void goto(href);
  }
</script>

<svelte:document {onkeydown} />

<Command.Dialog
  bind:open
  title="Command palette"
  description="Search customers, tickets, or navigate"
  class="sm:max-w-lg"
>
  <Command.Input placeholder="Search customers, tickets, or navigate..." bind:value={query} />
  <Command.List class="max-h-[300px] p-1">
    <Command.Empty class="text-muted-foreground">{loading ? "Searching..." : "No results found."}</Command.Empty>

    <Command.Group heading="Navigation">
      {#each navigation as item (item.path)}
        <Command.Item value={item.label} onSelect={() => go(resolve(item.path))} class="cursor-pointer">
          <item.icon class="h-4 w-4" />
          {item.label}
        </Command.Item>
      {/each}
    </Command.Group>

    <!-- Server results are already matches: `keywords` keeps the palette's own
         fuzzy filter, which only sees each item's value, from hiding them. -->
    {#if results.customers.length > 0}
      <Command.Group heading="Customers">
        {#each results.customers as c (c.id)}
          <Command.Item
            value={`customer-${c.id}`}
            keywords={[query]}
            onSelect={() => go(resolve("/customers/[id]", { id: c.id }))}
            class="cursor-pointer"
          >
            <Users class="h-4 w-4" />
            <span class="flex-1 truncate">{c.name || c.email}</span>
            {#if c.company}
              <span class="text-xs text-muted-foreground">{c.company}</span>
            {/if}
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}

    {#if results.tickets.length > 0}
      <Command.Group heading="Tickets">
        {#each results.tickets as t (t.id)}
          <Command.Item
            value={`ticket-${t.id}`}
            keywords={[query]}
            onSelect={() => go(resolve("/tickets/[id]", { id: t.id }))}
            class="cursor-pointer"
          >
            <TicketIcon class="h-4 w-4" />
            <span class="flex-1 truncate">{t.subject}</span>
            <span class="text-xs text-muted-foreground">{t.status}</span>
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
