<script lang="ts">
  // The navigation as a sheet from the left, below the `md` breakpoint.
  import Zap from "@lucide/svelte/icons/zap";
  import * as Sheet from "#lib/components/ui/sheet/index.js";
  import { CATALOG_ITEMS, NAV_ITEMS } from "./nav.js";
  import NavItem from "./nav-item.svelte";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const close = () => (open = false);
</script>

<Sheet.Root bind:open>
  <Sheet.Content side="left" class="w-72 gap-0 p-0">
    <Sheet.Header class="border-b px-4 py-3">
      <Sheet.Title class="flex items-center gap-2">
        <Zap class="h-5 w-5 text-primary" />
        CXP
      </Sheet.Title>
    </Sheet.Header>
    <nav class="space-y-1 p-3">
      {#each [...NAV_ITEMS, ...CATALOG_ITEMS] as item (item.to)}
        <NavItem {...item} onclick={close} />
      {/each}
    </nav>
  </Sheet.Content>
</Sheet.Root>
