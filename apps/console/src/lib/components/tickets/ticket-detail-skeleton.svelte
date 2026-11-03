<script lang="ts">
  // The ticket detail page while its ticket loads (the old TicketDetailSkeleton).
  import * as Card from "#lib/components/ui/card/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
</script>

<div class="space-y-6" aria-busy="true" aria-label="Loading ticket">
  <Skeleton class="h-9 w-28" />

  <div class="grid gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">
      <Skeleton class="h-8 w-3/4" />
      <Card.Root>
        <Card.Header>
          <Skeleton class="h-5 w-24" />
        </Card.Header>
        <Card.Content class="space-y-3">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-2/3" />
        </Card.Content>
      </Card.Root>
    </div>

    <div>
      <Card.Root>
        <Card.Header>
          <Skeleton class="h-5 w-20" />
        </Card.Header>
        <Card.Content class="space-y-4">
          {#each { length: 5 }, i (i)}
            <div class="space-y-1.5">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-10 w-full" />
            </div>
          {/each}
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
