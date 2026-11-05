<script lang="ts">
  // A survey's questions, numbered, each with its type badge (the React
  // detail page's `QuestionsList`). Question text is customer data: text only.
  import { m } from "#lib/paraglide/messages.js";
  import { Badge } from "@savvagent/console-ui/ui/badge";
  import { questionItems } from "./surveys.js";

  let { questions }: { questions: unknown } = $props();

  const items = $derived(questionItems(questions));
</script>

{#if items.length === 0}
  <p class="text-sm text-muted-foreground">{m.survey_no_questions()}</p>
{:else}
  <ol class="space-y-2">
    {#each items as q, i (i)}
      <li class="flex items-start gap-3 text-sm">
        <span
          class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
        >
          {i + 1}
        </span>
        <span class="flex-1">
          {q.text}
          {#if q.type}
            <Badge variant="outline" class="ml-2 text-xs">{q.type}</Badge>
          {/if}
        </span>
      </li>
    {/each}
  </ol>
{/if}
