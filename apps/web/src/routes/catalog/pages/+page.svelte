<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
  import FileText from "@lucide/svelte/icons/file-text";
  import CatalogListPage from "#lib/components/catalog/catalog-list-page.svelte";
  import { nameOf, pageCreateInput, pageFormValues, pageSchema, pageUpdateInput } from "#lib/components/catalog/forms.js";
  import { namedOptions } from "#lib/components/catalog/options.js";
  import { applicationQueries, pageQueries } from "#lib/queries/index.js";
  import type { Application, Page } from "#lib/types.js";

  const config = {
    text: {
      title: m.nav_pages(),
      create: m.catalog_page_new(),
      edit: m.catalog_page_edit(),
      delete: m.catalog_page_delete(),
      created: m.catalog_page_created(),
      updated: m.catalog_page_updated(),
      deleted: m.catalog_page_deleted(),
      editAria: m.catalog_page_edit_aria(),
      deleteAria: m.catalog_page_delete_aria(),
      empty: m.catalog_page_empty(),
      emptyDescription: m.catalog_page_empty_description(),
      showing: m.catalog_page_showing,
    },
    icon: FileText,
    queries: pageQueries,
    listParams: (paging: { limit: number; offset: number }, applicationId: string | undefined) => ({
      applicationId,
      ...paging,
    }),
    parent: {
      param: "application_id",
      list: applicationQueries.list,
      options: namedOptions,
      filter: { allLabel: m.catalog_all_applications(), ariaLabel: m.catalog_filter_application() },
      field: { field: "application_id", label: m.label_application(), idSuffix: "application" },
    },
    columns: [
      {
        head: m.label_path(),
        headClass: "hidden sm:table-cell",
        cellClass: "hidden font-mono text-sm text-muted-foreground sm:table-cell",
        text: (pg: Page) => pg.path ?? "—",
      },
      {
        head: m.label_application(),
        headClass: "hidden md:table-cell",
        cellClass: "hidden text-sm md:table-cell",
        text: (pg: Page, applications: readonly Application[]) =>
          pg.applicationId ? nameOf(applications, pg.applicationId) : "—",
      },
    ],
    description: {
      headClass: "hidden lg:table-cell",
      cellClass: "hidden max-w-[200px] truncate text-sm text-muted-foreground lg:table-cell",
    },
    form: {
      idPrefix: "page",
      schema: pageSchema,
      initial: pageFormValues,
      createInput: pageCreateInput,
      updateInput: pageUpdateInput,
      namePlaceholder: m.catalog_page_name_placeholder(),
      extra: { field: "path", label: m.label_path(), idSuffix: "path", placeholder: "/home" },
    },
  };
</script>

<CatalogListPage {config} />
