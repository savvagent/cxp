<script lang="ts">
  // The catalog filters of the customers, tickets, feedback and surveys lists.
  // Where the React bar took `value`/`onChange` and each page wired them to
  // `useSearchParams`, this one reads and writes the URL itself (the same
  // `experience_id`, `application_id`, `page_id`, `component_id` parameters),
  // so a page only renders it and reads `catalogFiltersFromUrl(searchOf(page.url))`.
  import { m } from "#lib/paraglide/messages.js";
  import FilterX from "@lucide/svelte/icons/filter-x";
  import { page } from "$app/state";
  import { catalogFiltersFromUrl, type CatalogFilterValues } from "#lib/catalog-filters.js";
  import { Button } from "@savvagent/console-ui/ui/button";
  import * as Select from "@savvagent/console-ui/ui/select";
  import { ALL, fromFilterSelect } from "#lib/forms.js";
  import { applicationQueries, componentQueries, experienceQueries, pageQueries } from "#lib/queries/index.js";
  import { catalogFilterHref, pushUrl, searchOf } from "#lib/url-state.js";

  let {
    resetParams = [],
    onChange,
  }: {
    /** Parameters to drop whenever a filter changes, e.g. `["page"]` to return to the first page. */
    resetParams?: readonly string[];
    /**
     * Called with the new filters as the URL update starts, in the same flush, so a page's own
     * state (e.g. its offset) resets before the query runs with the new filters.
     */
    onChange?: (values: CatalogFilterValues) => void;
  } = $props();

  const experiences = experienceQueries.list(() => ({ limit: 200 }));
  const applications = applicationQueries.list(() => ({ limit: 200 }));
  const pages = pageQueries.list(() => ({ limit: 200 }));
  const components = componentQueries.list(() => ({ limit: 200 }));

  const value = $derived(catalogFiltersFromUrl(searchOf(page.url)));
  const hasFilters = $derived(!!(value.experienceId || value.applicationId || value.pageId || value.componentId));

  const filters = $derived([
    {
      key: "experienceId" as const,
      all: m.catalog_all_experiences(),
      aria: m.catalog_filter_experience(),
      items: experiences.data?.data ?? [],
    },
    {
      key: "applicationId" as const,
      all: m.catalog_all_applications(),
      aria: m.catalog_filter_application(),
      items: applications.data?.data ?? [],
    },
    { key: "pageId" as const, all: m.catalog_all_pages(), aria: m.catalog_filter_page(), items: pages.data?.data ?? [] },
    {
      key: "componentId" as const,
      all: m.catalog_all_components(),
      aria: m.catalog_filter_component(),
      items: components.data?.data ?? [],
    },
  ]);

  function apply(next: CatalogFilterValues) {
    // React updated the caller's state and the URL in one batch; do the same, so the list never
    // queries the new filters with a stale offset.
    onChange?.(next);
    pushUrl(catalogFilterHref(page.url, next, resetParams));
  }

  function setFilter(key: keyof CatalogFilterValues, v: string | undefined) {
    apply({ ...value, [key]: v });
  }

  function label(items: readonly { id: string; name: string }[], id: string | undefined, all: string): string {
    if (!id) return all;
    return items.find((i) => i.id === id)?.name ?? id.slice(0, 8);
  }
</script>

<div class="flex flex-wrap items-center gap-3">
  {#each filters as f (f.key)}
    <Select.Root
      type="single"
      bind:value={() => value[f.key] ?? ALL, (v) => setFilter(f.key, fromFilterSelect(v))}
    >
      <Select.Trigger class="w-[180px]" aria-label={f.aria}>
        <span class="truncate">{label(f.items, value[f.key], f.all)}</span>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label={f.all} />
        {#each f.items as item (item.id)}
          <Select.Item value={item.id} label={item.name} />
        {/each}
      </Select.Content>
    </Select.Root>
  {/each}

  {#if hasFilters}
    <Button variant="ghost" size="sm" onclick={() => apply({})} class="gap-1.5">
      <FilterX class="h-4 w-4" />
      {m.catalog_clear_filters()}
    </Button>
  {/if}
</div>
