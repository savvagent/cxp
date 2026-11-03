<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
  import Zap from "@lucide/svelte/icons/zap";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import * as Table from "#lib/components/ui/table/index.js";
  import type { Interaction } from "#lib/types.js";
  import { formatDateTime } from "#lib/format.js";
  import { interactionTypeLabel } from "./customers.js";

  let { interactions }: { interactions: Interaction[] } = $props();
</script>

{#if interactions.length === 0}
  <EmptyState
    icon={Zap}
    title={m.customer_no_interactions()}
    description={m.customer_no_interactions_description()}
  />
{:else}
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>{m.label_type()}</Table.Head>
          <Table.Head class="hidden sm:table-cell">{m.label_date()}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each interactions as interaction (interaction.id)}
          <Table.Row>
            <Table.Cell>
              <Badge variant="outline" class="text-xs">
                {interactionTypeLabel(interaction.interactionType)}
              </Badge>
            </Table.Cell>
            <Table.Cell class="hidden text-sm text-muted-foreground sm:table-cell">
              {formatDateTime(interaction.createdAt)}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
{/if}
