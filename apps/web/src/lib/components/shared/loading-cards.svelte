<script lang="ts">
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";

  /** A grid of card placeholders (a dashboard's stat cards) while they load. */
  let { count = 4 }: { count?: number } = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
  {#each { length: count }, i (i)}
    <Skeleton class="h-32 w-full rounded-lg" />
  {/each}
</div>
