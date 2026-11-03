<script lang="ts">
  // One navigation link, highlighted while its route (or one below it) is open.
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { cn } from "#lib/utils.js";
  import { isNavActive, type NavPath } from "./nav.js";
  import { NAV_ICONS } from "./nav-icons.js";

  let {
    to,
    label,
    collapsed = false,
    onclick,
  }: { to: NavPath; label: string; collapsed?: boolean; onclick?: () => void } = $props();

  const active = $derived(isNavActive(page.url.pathname, to));
  const Icon = $derived(NAV_ICONS[to]);
</script>

<a
  href={resolve(to)}
  {onclick}
  aria-current={active ? "page" : undefined}
  title={collapsed ? label : undefined}
  class={cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    collapsed && "justify-center px-2",
  )}
>
  <Icon class="h-4 w-4 shrink-0" />
  {#if !collapsed}<span>{label}</span>{/if}
</a>
