<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
  import Star from "@lucide/svelte/icons/star";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { Badge } from "@savvagent/console-ui/ui/badge";
  import * as Table from "@savvagent/console-ui/ui/table";
  import type { FeedbackSummary } from "#lib/types.js";
  import { formatDate } from "#lib/format.js";
  import { feedbackTypeLabel } from "#lib/components/feedback/feedback.js";

  let { feedback }: { feedback: FeedbackSummary[] } = $props();
</script>

{#if feedback.length === 0}
  <EmptyState
    icon={Star}
    title={m.customer_no_feedback()}
    description={m.customer_no_feedback_description()}
  />
{:else}
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>{m.label_type()}</Table.Head>
          <Table.Head>{m.label_subject()}</Table.Head>
          <Table.Head class="hidden sm:table-cell">{m.label_rating()}</Table.Head>
          <Table.Head class="hidden md:table-cell">{m.label_date()}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each feedback as item (item.id)}
          <Table.Row>
            <Table.Cell>
              <Badge variant="outline" class="text-xs">{feedbackTypeLabel(item.feedbackType)}</Badge>
            </Table.Cell>
            <Table.Cell class="max-w-[220px]">
              <p class="truncate font-medium">
                {#if item.subject != null}
                  {item.subject}
                {:else}
                  <span class="text-muted-foreground italic">{m.customer_no_subject()}</span>
                {/if}
              </p>
              {#if item.body}
                <p class="mt-0.5 truncate text-xs text-muted-foreground">{item.body}</p>
              {/if}
            </Table.Cell>
            <Table.Cell class="hidden text-muted-foreground sm:table-cell">
              {#if item.rating != null}
                <span class="flex items-center gap-1">
                  <Star class="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {item.rating}
                </span>
              {:else}
                —
              {/if}
            </Table.Cell>
            <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
              {formatDate(item.createdAt)}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
{/if}
