<script lang="ts">
  import AppWindow from "@lucide/svelte/icons/app-window";
  import CatalogListPage from "#lib/components/catalog/catalog-list-page.svelte";
  import {
    applicationCreateInput,
    applicationFormValues,
    applicationSchema,
    applicationUpdateInput,
    nameOf,
  } from "#lib/components/catalog/forms.js";
  import { namedOptions } from "#lib/components/catalog/options.js";
  import { applicationQueries, experienceQueries } from "#lib/queries/index.js";
  import type { Application, Experience } from "#lib/types.js";

  const config = {
    title: "Applications",
    singular: "Application",
    noun: "application",
    plural: "applications",
    icon: AppWindow,
    emptyDescription: "Create your first application to add it to the catalog.",
    queries: applicationQueries,
    listParams: (paging: { limit: number; offset: number }, experienceId: string | undefined) => ({
      experienceId,
      ...paging,
    }),
    parent: {
      param: "experience_id",
      list: experienceQueries.list,
      options: namedOptions,
      filter: { allLabel: "All experiences", ariaLabel: "Filter by experience" },
      field: { field: "experience_id", label: "Experience", idSuffix: "experience" },
    },
    columns: [
      {
        head: "Platform",
        headClass: "hidden sm:table-cell",
        cellClass: "hidden text-sm text-muted-foreground sm:table-cell",
        text: (app: Application) => app.platform ?? "—",
      },
      {
        head: "Experience",
        headClass: "hidden md:table-cell",
        cellClass: "hidden text-sm md:table-cell",
        text: (app: Application, experiences: readonly Experience[]) =>
          app.experienceId ? nameOf(experiences, app.experienceId) : "—",
      },
    ],
    description: {
      headClass: "hidden lg:table-cell",
      cellClass: "hidden max-w-[200px] truncate text-sm text-muted-foreground lg:table-cell",
    },
    form: {
      idPrefix: "app",
      schema: applicationSchema,
      initial: applicationFormValues,
      createInput: applicationCreateInput,
      updateInput: applicationUpdateInput,
      namePlaceholder: "iOS App",
      extra: { field: "platform", label: "Platform", idSuffix: "platform", placeholder: "ios / android / web" },
    },
  };
</script>

<CatalogListPage {config} />
