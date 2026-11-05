<script lang="ts">
  import Plus from "@lucide/svelte/icons/plus";
  import { Button } from "@savvagent/console-ui/ui/button";

  let {
    title,
    description,
    action,
    onAction,
  }: {
    title: string;
    description?: string;
    /** The "add" button's label; the button shows only with `onAction` too. */
    action?: string;
    onAction?: () => void;
  } = $props();
</script>

<div class="flex items-center justify-between">
  <div>
    <h2 class="text-2xl font-bold tracking-tight">{title}</h2>
    {#if description}
      <p class="text-muted-foreground">{description}</p>
    {/if}
  </div>
  {#if action && onAction}
    <Button onclick={onAction}>
      <Plus class="mr-2 h-4 w-4" />
      {action}
    </Button>
  {/if}
</div>
