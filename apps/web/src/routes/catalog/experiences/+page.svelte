<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
  import Layers from "@lucide/svelte/icons/layers";
  import CatalogListPage from "#lib/components/catalog/catalog-list-page.svelte";
  import {
    experienceCreateInput,
    experienceFormValues,
    experienceSchema,
    experienceUpdateInput,
  } from "#lib/components/catalog/forms.js";
  import { experienceQueries } from "#lib/queries/index.js";

  const config = {
    text: {
      title: m.nav_experiences(),
      create: m.catalog_experience_new(),
      edit: m.catalog_experience_edit(),
      delete: m.catalog_experience_delete(),
      created: m.catalog_experience_created(),
      updated: m.catalog_experience_updated(),
      deleted: m.catalog_experience_deleted(),
      editAria: m.catalog_experience_edit_aria(),
      deleteAria: m.catalog_experience_delete_aria(),
      empty: m.catalog_experience_empty(),
      emptyDescription: m.catalog_experience_empty_description(),
      showing: m.catalog_experience_showing,
    },
    icon: Layers,
    queries: experienceQueries,
    listParams: (paging: { limit: number; offset: number }) => paging,
    columns: [],
    description: {
      headClass: "hidden md:table-cell",
      cellClass: "hidden max-w-[300px] truncate text-sm text-muted-foreground md:table-cell",
    },
    form: {
      idPrefix: "exp",
      schema: experienceSchema,
      initial: experienceFormValues,
      createInput: experienceCreateInput,
      updateInput: experienceUpdateInput,
      namePlaceholder: m.catalog_experience_name_placeholder(),
    },
  };
</script>

<CatalogListPage {config} />
