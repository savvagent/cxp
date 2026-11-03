<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";
  import { onDestroy } from "svelte";
  import { toast } from "svelte-sonner";
  import * as Tooltip from "#lib/components/ui/tooltip/index.js";
  import { copyValue, shortId } from "./copy.js";

  /** Shows an id's first eight characters; a click copies the whole id. */
  let { value }: { value: string } = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function handleCopy() {
    void copyValue(value, {
      writeText: navigator.clipboard ? (text) => navigator.clipboard.writeText(text) : undefined,
      setCopied: (next) => (copied = next),
      success: (message) => toast.success(message),
      error: (message) => toast.error(message),
      schedule: (fn, ms) => {
        clearTimeout(timer);
        timer = setTimeout(fn, ms);
      },
    });
  }

  onDestroy(() => clearTimeout(timer));
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger
      onclick={handleCopy}
      aria-label={`Copy ${value}`}
      class="inline-flex cursor-pointer items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {shortId(value)}
      {#if copied}
        <Check class="h-3 w-3 text-green-600" />
      {:else}
        <Copy class="h-3 w-3" />
      {/if}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p class="font-mono text-xs">{value}</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
