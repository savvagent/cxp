<script lang="ts">
  import Building2 from "@lucide/svelte/icons/building-complex";
  import Calendar from "@lucide/svelte/icons/calendar";
  import Mail from "@lucide/svelte/icons/mail";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Phone from "@lucide/svelte/icons/phone";
  import UserCircle2 from "@lucide/svelte/icons/circle-user-round";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import type { Customer } from "#lib/types.js";
  import { formatDate } from "#lib/format.js";

  let { customer, onEdit }: { customer: Customer; onEdit: () => void } = $props();
</script>

<Card.Root>
  <Card.Header class="flex flex-row items-start justify-between gap-4">
    <div class="flex items-center gap-4">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <UserCircle2 class="h-8 w-8" />
      </div>
      <div>
        <Card.Title class="text-xl">
          {#if customer.name != null}
            {customer.name}
          {:else}
            <span class="font-normal text-muted-foreground italic">No name</span>
          {/if}
        </Card.Title>
        <p class="mt-0.5 text-sm text-muted-foreground">{customer.email}</p>
      </div>
    </div>
    <Button variant="outline" size="sm" onclick={onEdit}>
      <Pencil class="mr-2 h-3.5 w-3.5" />
      Edit
    </Button>
  </Card.Header>

  <Card.Content>
    <dl class="space-y-2 text-sm">
      <div class="flex items-center gap-2 text-muted-foreground">
        <Mail class="h-4 w-4 shrink-0" aria-hidden="true" />
        <a href="mailto:{customer.email}" class="hover:text-foreground hover:underline">
          {customer.email}
        </a>
      </div>

      {#if customer.phone}
        <div class="flex items-center gap-2 text-muted-foreground">
          <Phone class="h-4 w-4 shrink-0" aria-hidden="true" />
          <a href="tel:{customer.phone}" class="hover:text-foreground hover:underline">
            {customer.phone}
          </a>
        </div>
      {/if}

      {#if customer.company}
        <div class="flex items-center gap-2 text-muted-foreground">
          <Building2 class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{customer.company}</span>
        </div>
      {/if}

      <div class="flex items-center gap-2 text-muted-foreground">
        <Calendar class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Customer since {formatDate(customer.createdAt)}</span>
      </div>
    </dl>

    {#if customer.tags.length > 0}
      <div class="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
        {#each customer.tags as tag (tag)}
          <Badge variant="secondary" class="text-xs">{tag}</Badge>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
