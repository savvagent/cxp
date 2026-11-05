<script lang="ts">
  // Cmd/Ctrl+K (or the header's search button): go to a page, or find a
  // customer or a recent ticket.
  import { m } from "#lib/paraglide/messages.js";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Users from "@lucide/svelte/icons/users";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { customersApi, ticketsApi } from "#lib/api/index.js";
  import { PALETTE_ITEMS } from "#lib/components/layout/nav.js";
  import { NAV_ICONS } from "#lib/components/layout/nav-icons.js";
  import { statusLabel } from "#lib/components/shared/badges.js";
  import * as Command from "@savvagent/console-ui/ui/command";
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
  title={m.palette_title()}
  description={m.palette_description()}
  class="sm:max-w-lg"
>
  <Command.Input placeholder={m.palette_placeholder()} bind:value={query} />
  <Command.List class="max-h-[300px] p-1">
    <Command.Empty class="text-muted-foreground">{loading ? m.palette_searching() : m.palette_no_results()}</Command.Empty>

    <Command.Group heading={m.palette_group_navigation()}>
      {#each PALETTE_ITEMS as item (item.to)}
        {@const Icon = NAV_ICONS[item.to]}
        <Command.Item value={item.label} onSelect={() => go(resolve(item.to))} class="cursor-pointer">
          <Icon class="h-4 w-4" />
          {item.label}
        </Command.Item>
      {/each}
    </Command.Group>

    <!-- Server results are already matches: `keywords` keeps the palette's own
         fuzzy filter, which only sees each item's value, from hiding them. -->
    {#if results.customers.length > 0}
      <Command.Group heading={m.nav_customers()}>
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
      <Command.Group heading={m.nav_tickets()}>
        {#each results.tickets as t (t.id)}
          <Command.Item
            value={`ticket-${t.id}`}
            keywords={[query]}
            onSelect={() => go(resolve("/tickets/[id]", { id: t.id }))}
            class="cursor-pointer"
          >
            <TicketIcon class="h-4 w-4" />
            <span class="flex-1 truncate">{t.subject}</span>
            <span class="text-xs text-muted-foreground">{statusLabel(t.status)}</span>
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
