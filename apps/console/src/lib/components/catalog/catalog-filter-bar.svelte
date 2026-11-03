<script lang="ts">
  // Port of apps/web/src/components/shared/catalog-filter-bar.tsx. Where the
  // React bar took `value`/`onChange` and each page wired them to
  // `useSearchParams`, this one reads and writes the URL itself (the same
  // `experience_id`, `application_id`, `page_id`, `component_id` parameters),
  // so a page only renders it and reads `catalogFiltersFromUrl(searchOf(page.url))`.
  import FilterX from "@lucide/svelte/icons/filter-x";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { catalogFiltersFromUrl, type CatalogFilterValues } from "#lib/catalog-filters.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { createApplications, createComponents, createExperiences, createPages } from "#lib/queries/index.js";
  import { catalogFilterHref, searchOf } from "./url.js";

  let {
    resetParams = [],
    onChange,
  }: {
    /** Parameters to drop whenever a filter changes, e.g. `["page"]` to return to the first page. */
    resetParams?: readonly string[];
    /** Called with the new filters after the URL is updated (e.g. to reset a page's own offset). */
    onChange?: (values: CatalogFilterValues) => void;
  } = $props();

  const ALL = "_all";

  const experiences = createExperiences(() => ({ limit: 200 }));
  const applications = createApplications(() => ({ limit: 200 }));
  const pages = createPages(() => ({ limit: 200 }));
  const components = createComponents(() => ({ limit: 200 }));

  const value = $derived(catalogFiltersFromUrl(searchOf(page.url)));
  const hasFilters = $derived(!!(value.experienceId || value.applicationId || value.pageId || value.componentId));

  const filters = $derived([
    {
      key: "experienceId" as const,
      all: "All experiences",
      aria: "Filter by experience",
      items: experiences.data?.data ?? [],
    },
    {
      key: "applicationId" as const,
      all: "All applications",
      aria: "Filter by application",
      items: applications.data?.data ?? [],
    },
    { key: "pageId" as const, all: "All pages", aria: "Filter by page", items: pages.data?.data ?? [] },
    {
      key: "componentId" as const,
      all: "All components",
      aria: "Filter by component",
      items: components.data?.data ?? [],
    },
  ]);

  function apply(next: CatalogFilterValues) {
    // `setSearchParams` pushed a history entry and left scroll and focus alone.
    void goto(catalogFilterHref(page.url, next, resetParams), { reset: false }).then(() => onChange?.(next));
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
      bind:value={() => value[f.key] ?? ALL, (v) => setFilter(f.key, v === ALL ? undefined : v)}
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
      Clear catalog filters
    </Button>
  {/if}
</div>
