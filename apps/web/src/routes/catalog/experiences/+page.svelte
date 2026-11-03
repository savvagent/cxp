<script lang="ts">
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
    title: "Experiences",
    singular: "Experience",
    noun: "experience",
    plural: "experiences",
    icon: Layers,
    emptyDescription: "Create your first experience to start building your catalog.",
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
      namePlaceholder: "Web App",
    },
  };
</script>

<CatalogListPage {config} />
