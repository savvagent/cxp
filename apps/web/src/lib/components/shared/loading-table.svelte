<script lang="ts">
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";

  /** A table's placeholder while it loads: a header bar and `rows` row bars. */
  let { rows = 5 }: { rows?: number } = $props();
</script>

<div class="space-y-3">
  <Skeleton class="h-10 w-full" />
  {#each { length: rows }, i (i)}
    <Skeleton class="h-12 w-full" />
  {/each}
</div>
