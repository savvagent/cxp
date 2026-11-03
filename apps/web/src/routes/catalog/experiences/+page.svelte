<script lang="ts">
  // Port of the React console's src/pages/catalog/experiences.tsx.
  import Layers from "@lucide/svelte/icons/layers";
  import { toast } from "svelte-sonner";
  import CatalogFormDialog from "#lib/components/catalog/catalog-form-dialog.svelte";
  import {
    deleteDescription,
    experienceCreateInput,
    experienceFormValues,
    experienceSchema,
    experienceUpdateInput,
    showingLine,
    teamName,
    type ExperienceForm,
  } from "#lib/components/catalog/forms.js";
  import RowActions from "#lib/components/catalog/row-actions.svelte";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import CopyableId from "#lib/components/shared/copyable-id.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import * as Table from "#lib/components/ui/table/index.js";
  import {
    createCreateExperience,
    createDeleteExperience,
    createExperiences,
    createMyTeams,
    createUpdateExperience,
  } from "#lib/queries/index.js";
  import type { Experience } from "#lib/types.js";

  const PAGE_SIZE = 20;
  const page = 0;

  let createOpen = $state(false);
  let editTarget = $state<Experience | null>(null);
  let deleteTarget = $state<Experience | null>(null);

  const experiences = createExperiences(() => ({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }));
  const myTeams = createMyTeams();
  const createExperience = createCreateExperience();
  const updateExperience = createUpdateExperience();
  const deleteExperience = createDeleteExperience();

  const items = $derived(experiences.data?.data ?? []);
  const total = $derived(experiences.data?.total ?? 0);
  const teams = $derived(myTeams.data ?? []);
  const showing = $derived(showingLine(PAGE_SIZE, items.length, total, "experiences"));

  function closeDialog(open: boolean) {
    if (!open) {
      createOpen = false;
      editTarget = null;
    }
  }

  function submit(values: ExperienceForm) {
    const onError = (err: Error) => toast.error(`Failed: ${err.message}`);
    if (editTarget) {
      updateExperience.mutate(experienceUpdateInput(editTarget.id, values), {
        onSuccess: () => {
          toast.success("Experience updated");
          closeDialog(false);
        },
        onError,
      });
    } else {
      createExperience.mutate(experienceCreateInput(values), {
        onSuccess: () => {
          toast.success("Experience created");
          closeDialog(false);
        },
        onError,
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteExperience.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Experience deleted");
        deleteTarget = null;
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });
  }
</script>

<div class="space-y-6">
  <PageHeader title="Experiences" action="New Experience" onAction={() => (createOpen = true)} />

  {#if experiences.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={Layers}
      title="No experiences yet"
      description="Create your first experience to start building your catalog."
      action="New Experience"
      onAction={() => (createOpen = true)}
    />
  {:else}
    <div class="overflow-x-auto rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[100px]">ID</Table.Head>
            <Table.Head>Name</Table.Head>
            <Table.Head class="hidden sm:table-cell">Team</Table.Head>
            <Table.Head class="hidden md:table-cell">Description</Table.Head>
            <Table.Head class="hidden md:table-cell">Created At</Table.Head>
            <Table.Head class="w-[100px]" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as exp (exp.id)}
            <Table.Row>
              <Table.Cell><CopyableId value={exp.id} /></Table.Cell>
              <Table.Cell class="font-medium">{exp.name}</Table.Cell>
              <Table.Cell class="hidden text-sm sm:table-cell">
                {exp.teamId ? teamName(teams, exp.teamId) : "—"}
              </Table.Cell>
              <Table.Cell class="hidden max-w-[300px] truncate text-sm text-muted-foreground md:table-cell">
                {exp.description ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
                {new Date(exp.createdAt).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <RowActions noun="experience" onEdit={() => (editTarget = exp)} onDelete={() => (deleteTarget = exp)} />
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  {#if showing}
    <p class="text-sm text-muted-foreground">{showing}</p>
  {/if}

  <CatalogFormDialog
    open={createOpen || !!editTarget}
    onOpenChange={closeDialog}
    title={editTarget ? "Edit Experience" : "New Experience"}
    idPrefix="exp"
    schema={experienceSchema}
    initial={experienceFormValues(editTarget)}
    {teams}
    namePlaceholder="Web App"
    isEdit={!!editTarget}
    pending={createExperience.isPending || updateExperience.isPending}
    onSubmit={submit}
  />

  <ConfirmDialog
    open={!!deleteTarget}
    onOpenChange={(open) => {
      if (!open) deleteTarget = null;
    }}
    title="Delete Experience"
    description={deleteDescription(deleteTarget?.name)}
    onConfirm={handleDelete}
    loading={deleteExperience.isPending}
  />
</div>
