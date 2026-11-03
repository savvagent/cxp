<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
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
    text: {
      title: m.nav_components(),
      create: m.catalog_component_new(),
      edit: m.catalog_component_edit(),
      delete: m.catalog_component_delete(),
      created: m.catalog_component_created(),
      updated: m.catalog_component_updated(),
      deleted: m.catalog_component_deleted(),
      editAria: m.catalog_component_edit_aria(),
      deleteAria: m.catalog_component_delete_aria(),
      empty: m.catalog_component_empty(),
      emptyDescription: m.catalog_component_empty_description(),
      showing: m.catalog_component_showing,
    },
    icon: Puzzle,
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
      filter: { allLabel: m.catalog_all_pages(), ariaLabel: m.catalog_filter_page(), class: "w-[220px]" },
      field: { field: "page_id", label: m.label_page(), idSuffix: "page" },
    },
    columns: [
      {
        head: m.label_component_type(),
        headClass: "hidden sm:table-cell",
        cellClass: "hidden text-sm text-muted-foreground sm:table-cell",
        text: (comp: Component) => comp.componentType ?? "—",
      },
      {
        head: m.label_page(),
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
      namePlaceholder: m.catalog_component_name_placeholder(),
      extra: {
        field: "component_type",
        label: m.label_component_type(),
        idSuffix: "type",
        placeholder: m.catalog_component_type_placeholder(),
      },
    },
  };
</script>

<CatalogListPage {config} />
