<script lang="ts">
  // The desktop sidebar: collapsible to icons, with a collapsible catalog section.
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Zap from "@lucide/svelte/icons/zap";
  import { cn } from "#lib/utils.js";
  import { CATALOG_ITEMS, NAV_ITEMS } from "./nav.js";
  import NavItem from "./nav-item.svelte";

  let { collapsed, onToggle }: { collapsed: boolean; onToggle: () => void } = $props();

  let catalogOpen = $state(true);
</script>

<aside
  class={cn(
    "hidden border-r bg-card transition-all duration-200 md:flex md:flex-col",
    collapsed ? "w-16" : "w-64",
  )}
>
  <div class="flex h-14 items-center border-b px-4">
    <button
      type="button"
      onclick={onToggle}
      class="flex items-center gap-2"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
    >
      <Zap class="h-5 w-5 text-primary" />
      {#if !collapsed}<span class="text-lg font-semibold">CXP</span>{/if}
    </button>
  </div>

  <nav class="flex-1 space-y-1 overflow-y-auto p-3">
    {#each NAV_ITEMS as item (item.to)}
      <NavItem {...item} {collapsed} />
    {/each}

    {#if !collapsed}
      <div class="pt-4">
        <button
          type="button"
          onclick={() => (catalogOpen = !catalogOpen)}
          aria-expanded={catalogOpen}
          class="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium uppercase text-muted-foreground"
        >
          <span>Catalog</span>
          <ChevronDown class={cn("h-3 w-3 transition-transform", catalogOpen && "rotate-180")} />
        </button>
        {#if catalogOpen}
          {#each CATALOG_ITEMS as item (item.to)}
            <NavItem {...item} {collapsed} />
          {/each}
        {/if}
      </div>
    {:else}
      {#each CATALOG_ITEMS as item (item.to)}
        <NavItem {...item} {collapsed} />
      {/each}
    {/if}
  </nav>
</aside>
