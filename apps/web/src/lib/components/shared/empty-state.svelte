<script lang="ts">
  import InboxIcon from "@lucide/svelte/icons/inbox";
  import type { Component } from "svelte";
  import { Button } from "@savvagent/console-ui/ui/button";

  let {
    icon: Icon = InboxIcon,
    title,
    description,
    action,
    onAction,
  }: {
    /** An icon component, e.g. a `@lucide/svelte` icon. */
    icon?: Component<{ class?: string }>;
    title: string;
    description?: string;
    /** The button's label; the button shows only with `onAction` too. */
    action?: string;
    onAction?: () => void;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 text-center">
  <Icon class="h-12 w-12 text-muted-foreground/50" />
  <h3 class="mt-4 text-lg font-semibold">{title}</h3>
  {#if description}
    <p class="mt-1 text-sm text-muted-foreground">{description}</p>
  {/if}
  {#if action && onAction}
    <Button onclick={onAction} class="mt-4">{action}</Button>
  {/if}
</div>
