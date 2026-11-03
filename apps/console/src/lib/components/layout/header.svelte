<script lang="ts">
  // The page's title, the palette's search button, and sign-out.
  import LogOut from "@lucide/svelte/icons/log-out";
  import Menu from "@lucide/svelte/icons/menu";
  import Search from "@lucide/svelte/icons/search";
  import { page } from "$app/state";
  import { Button } from "#lib/components/ui/button/index.js";
  import { signOut } from "#lib/session.js";
  import { routeTitle } from "./nav.js";

  let { onMenuClick, onSearchClick }: { onMenuClick: () => void; onSearchClick: () => void } = $props();

  const title = $derived(routeTitle(page.url.pathname));
</script>

<header class="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
  <Button variant="ghost" size="icon" class="md:hidden" aria-label="Open navigation" onclick={onMenuClick}>
    <Menu class="h-5 w-5" />
  </Button>

  <h1 class="text-lg font-semibold">{title}</h1>

  <div class="ml-auto flex items-center gap-2">
    <Button variant="outline" size="sm" class="hidden gap-2 text-muted-foreground sm:flex" onclick={onSearchClick}>
      <Search class="h-4 w-4" />
      <span>Search...</span>
      <kbd class="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
    </Button>
    <Button variant="ghost" size="icon" title="Sign out" aria-label="Sign out" onclick={() => void signOut()}>
      <LogOut class="h-4 w-4" />
    </Button>
  </div>
</header>
