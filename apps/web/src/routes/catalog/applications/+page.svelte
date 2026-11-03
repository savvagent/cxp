<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
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
    text: {
      title: m.nav_applications(),
      create: m.catalog_application_new(),
      edit: m.catalog_application_edit(),
      delete: m.catalog_application_delete(),
      created: m.catalog_application_created(),
      updated: m.catalog_application_updated(),
      deleted: m.catalog_application_deleted(),
      editAria: m.catalog_application_edit_aria(),
      deleteAria: m.catalog_application_delete_aria(),
      empty: m.catalog_application_empty(),
      emptyDescription: m.catalog_application_empty_description(),
      showing: m.catalog_application_showing,
    },
    icon: AppWindow,
    queries: applicationQueries,
    listParams: (paging: { limit: number; offset: number }, experienceId: string | undefined) => ({
      experienceId,
      ...paging,
    }),
    parent: {
      param: "experience_id",
      list: experienceQueries.list,
      options: namedOptions,
      filter: { allLabel: m.catalog_all_experiences(), ariaLabel: m.catalog_filter_experience() },
      field: { field: "experience_id", label: m.label_experience(), idSuffix: "experience" },
    },
    columns: [
      {
        head: m.label_platform(),
        headClass: "hidden sm:table-cell",
        cellClass: "hidden text-sm text-muted-foreground sm:table-cell",
        text: (app: Application) => app.platform ?? "—",
      },
      {
        head: m.label_experience(),
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
      namePlaceholder: m.catalog_application_name_placeholder(),
      extra: { field: "platform", label: m.label_platform(), idSuffix: "platform", placeholder: "ios / android / web" },
    },
  };
</script>

<CatalogListPage {config} />
