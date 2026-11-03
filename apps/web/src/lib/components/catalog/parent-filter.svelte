<script lang="ts">
  // The filter row of the applications, pages and components lists: one
  // select over the parent level, kept in one URL parameter (`experience_id`,
  // `application_id` or `page_id`, as in the React console), and "Clear filter".
  import { page } from "$app/state";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { ALL, fromFilterSelect } from "#lib/forms.js";
  import { paramHref, pushUrl } from "#lib/url-state.js";
  import type { CatalogOption } from "./options.js";

  let {
    param,
    allLabel,
    ariaLabel,
    options,
    class: className = "w-[200px]",
  }: {
    /** The URL parameter this filter keeps its value in. */
    param: string;
    /** The "no filter" item, e.g. "All experiences". */
    allLabel: string;
    ariaLabel: string;
    options: readonly CatalogOption[];
    class?: string;
  } = $props();

  const value = $derived(page.url.searchParams.get(param) || undefined);
  const selected = $derived(value ? options.find((o) => o.value === value) : undefined);

  function setFilter(v: string | undefined) {
    pushUrl(paramHref(page.url, param, v));
  }
</script>

<div class="flex flex-wrap items-center gap-3">
  <Select.Root type="single" bind:value={() => value ?? ALL, (v) => setFilter(fromFilterSelect(v))}>
    <Select.Trigger class={className} aria-label={ariaLabel}>
      <span class="truncate">
        {#if !value}
          {allLabel}
        {:else if selected}
          {selected.label}
          {#if selected.hint}
            <span class="ml-1 font-mono text-xs text-muted-foreground">{selected.hint}</span>
          {/if}
        {:else}
          {value.slice(0, 8)}
        {/if}
      </span>
    </Select.Trigger>
    <Select.Content>
      <Select.Item value={ALL} label={allLabel} />
      {#each options as o (o.value)}
        <Select.Item value={o.value} label={o.label}>
          {o.label}
          {#if o.hint}
            <span class="ml-1 font-mono text-xs text-muted-foreground">{o.hint}</span>
          {/if}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
  {#if value}
    <Button variant="ghost" size="sm" onclick={() => setFilter(undefined)}>Clear filter</Button>
  {/if}
</div>
