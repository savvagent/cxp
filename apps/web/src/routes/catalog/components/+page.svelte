<script lang="ts">
  import Puzzle from "@lucide/svelte/icons/puzzle";
  import CatalogListPage from "#lib/components/catalog/catalog-list-page.svelte";
  import {
    componentCreateInput,
    componentFormValues,
    componentSchema,
    componentUpdateInput,
    pageName,
  } from "#lib/components/catalog/forms.js";
  import { pageOptions } from "#lib/components/catalog/options.js";
  import { componentQueries, pageQueries } from "#lib/queries/index.js";
  import type { Component, Page } from "#lib/types.js";

  const config = {
    title: "Components",
    singular: "Component",
    noun: "component",
    plural: "components",
    icon: Puzzle,
    emptyDescription: "Create your first component to add it to the catalog.",
    queries: componentQueries,
    listParams: (paging: { limit: number; offset: number }, pageId: string | undefined) => ({
      pageId,
      ...paging,
    }),
    parent: {
      param: "page_id",
      list: pageQueries.list,
      options: pageOptions,
      // Wider than the others: the options show each page's path.
      filter: { allLabel: "All pages", ariaLabel: "Filter by page", class: "w-[220px]" },
      field: { field: "page_id", label: "Page", idSuffix: "page" },
    },
    columns: [
      {
        head: "Component Type",
        headClass: "hidden sm:table-cell",
        cellClass: "hidden text-sm text-muted-foreground sm:table-cell",
        text: (comp: Component) => comp.componentType ?? "—",
      },
      {
        head: "Page",
        headClass: "hidden md:table-cell",
        cellClass: "hidden text-sm md:table-cell",
        text: (comp: Component, pages: readonly Page[]) => (comp.pageId ? pageName(pages, comp.pageId) : "—"),
      },
    ],
    description: {
      headClass: "hidden lg:table-cell",
      cellClass: "hidden max-w-[200px] truncate text-sm text-muted-foreground lg:table-cell",
    },
    form: {
      idPrefix: "comp",
      schema: componentSchema,
      initial: componentFormValues,
      createInput: componentCreateInput,
      updateInput: componentUpdateInput,
      namePlaceholder: "Hero Banner",
      extra: {
        field: "component_type",
        label: "Component Type",
        idSuffix: "type",
        placeholder: "button / form / modal / banner",
      },
    },
  };
</script>

<CatalogListPage {config} />
