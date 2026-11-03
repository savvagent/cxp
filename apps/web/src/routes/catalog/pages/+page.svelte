<script lang="ts">
  import FileText from "@lucide/svelte/icons/file-text";
  import CatalogListPage from "#lib/components/catalog/catalog-list-page.svelte";
  import { nameOf, pageCreateInput, pageFormValues, pageSchema, pageUpdateInput } from "#lib/components/catalog/forms.js";
  import { namedOptions } from "#lib/components/catalog/options.js";
  import { applicationQueries, pageQueries } from "#lib/queries/index.js";
  import type { Application, Page } from "#lib/types.js";

  const config = {
    title: "Pages",
    singular: "Page",
    noun: "page",
    plural: "pages",
    icon: FileText,
    emptyDescription: "Create your first page to add it to the catalog.",
    queries: pageQueries,
    listParams: (paging: { limit: number; offset: number }, applicationId: string | undefined) => ({
      applicationId,
      ...paging,
    }),
    parent: {
      param: "application_id",
      list: applicationQueries.list,
      options: namedOptions,
      filter: { allLabel: "All applications", ariaLabel: "Filter by application" },
      field: { field: "application_id", label: "Application", idSuffix: "application" },
    },
    columns: [
      {
        head: "Path",
        headClass: "hidden sm:table-cell",
        cellClass: "hidden font-mono text-sm text-muted-foreground sm:table-cell",
        text: (pg: Page) => pg.path ?? "—",
      },
      {
        head: "Application",
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
      namePlaceholder: "Home",
      extra: { field: "path", label: "Path", idSuffix: "path", placeholder: "/home" },
    },
  };
</script>

<CatalogListPage {config} />
