<script lang="ts">
  // A feedback rating as five stars and "n/5" (the React page's `RatingStars`),
  // or a dash when there is no rating.
  import Star from "@lucide/svelte/icons/star";
  import { ratingStars } from "./feedback.js";

  let { rating }: { rating: number | null } = $props();
</script>

{#if rating === null}
  <span class="text-xs text-muted-foreground">—</span>
{:else}
  <span class="flex items-center gap-0.5">
    {#each ratingStars(rating) as filled, i (i)}
      <Star class={`h-3 w-3 ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
    {/each}
    <span class="ml-1 text-xs text-muted-foreground">{rating}/5</span>
  </span>
{/if}
