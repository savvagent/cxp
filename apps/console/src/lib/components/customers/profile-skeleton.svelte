<script lang="ts">
  import * as Card from "#lib/components/ui/card/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
</script>

<Card.Root>
  <Card.Header class="flex flex-row items-start justify-between gap-4">
    <div class="flex items-center gap-4">
      <Skeleton class="h-14 w-14 rounded-full" />
      <div class="space-y-2">
        <Skeleton class="h-5 w-40" />
        <Skeleton class="h-4 w-56" />
      </div>
    </div>
    <Skeleton class="h-9 w-20" />
  </Card.Header>
  <Card.Content class="space-y-3">
    <Skeleton class="h-4 w-48" />
    <Skeleton class="h-4 w-36" />
    <Skeleton class="h-4 w-32" />
    <div class="flex gap-2 pt-1">
      <Skeleton class="h-5 w-12 rounded-full" />
      <Skeleton class="h-5 w-16 rounded-full" />
    </div>
  </Card.Content>
</Card.Root>
