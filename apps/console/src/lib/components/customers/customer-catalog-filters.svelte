<script lang="ts">
  // Placeholder for the catalog filter bar, which #76 builds at
  // `#lib/components/catalog/catalog-filter-bar.svelte`. The customers page
  // already reads its filters from the URL (`#lib/catalog-filters.js`) and
  // writes them back through `onChange`; once #76 lands, this renders its
  // `CatalogFilterBar` with these same props.
  import type { CatalogFilterValues } from "#lib/catalog-filters.js";

  let {
    value: _value,
    onChange: _onChange,
  }: {
    value: CatalogFilterValues;
    onChange: (value: CatalogFilterValues) => void;
  } = $props();
</script>
