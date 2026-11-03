<script lang="ts">
  // The tickets list's slot for the catalog filter bar. The bar itself is the
  // catalog story's (`#lib/components/catalog/catalog-filter-bar.svelte`); until
  // it is wired in here, the catalog filters still apply from the URL
  // (`experience_id`, `application_id`, `page_id`, `component_id`) and this
  // renders nothing. Its props are the bar's, so wiring it is a one-line swap.
  import type { CatalogFilterValues } from "#lib/catalog-filters.js";

  let {
    value,
    onChange,
  }: {
    value: CatalogFilterValues;
    onChange: (value: CatalogFilterValues) => void;
  } = $props();
</script>
