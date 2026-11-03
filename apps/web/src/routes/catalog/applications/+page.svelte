<script lang="ts">
  // Port of the React console's src/pages/catalog/applications.tsx.
  import AppWindow from "@lucide/svelte/icons/app-window";
  import { toast } from "svelte-sonner";
  import { page as appPage } from "$app/state";
  import CatalogFormDialog from "#lib/components/catalog/catalog-form-dialog.svelte";
  import {
    applicationCreateInput,
    applicationFormValues,
    applicationSchema,
    applicationUpdateInput,
    deleteDescription,
    nameOf,
    teamName,
    type ApplicationForm,
  } from "#lib/components/catalog/forms.js";
  import { namedOptions } from "#lib/components/catalog/options.js";
  import ParentFilter from "#lib/components/catalog/parent-filter.svelte";
  import RowActions from "#lib/components/catalog/row-actions.svelte";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import CopyableId from "#lib/components/shared/copyable-id.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import * as Table from "#lib/components/ui/table/index.js";
  import { localeDate } from "#lib/format.js";
  import { PAGE_SIZE, showingLine } from "#lib/pagination.js";
  import {
    createApplications,
    createCreateApplication,
    createDeleteApplication,
    createExperiences,
    createMyTeams,
    createUpdateApplication,
  } from "#lib/queries/index.js";
  import type { Application } from "#lib/types.js";

  const page = 0;

  let createOpen = $state(false);
  let editTarget = $state<Application | null>(null);
  let deleteTarget = $state<Application | null>(null);

  const experienceId = $derived(appPage.url.searchParams.get("experience_id") ?? undefined);

  const applications = createApplications(() => ({
    experienceId,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }));
  const experiencesQuery = createExperiences(() => ({ limit: 200 }));
  const myTeams = createMyTeams();
  const createApplication = createCreateApplication();
  const updateApplication = createUpdateApplication();
  const deleteApplication = createDeleteApplication();

  const items = $derived(applications.data?.data ?? []);
  const total = $derived(applications.data?.total ?? 0);
  const experiences = $derived(experiencesQuery.data?.data ?? []);
  const experienceOptions = $derived(namedOptions(experiences));
  const teams = $derived(myTeams.data ?? []);
  const showing = $derived(showingLine(PAGE_SIZE, items.length, total, "applications"));

  function closeDialog(open: boolean) {
    if (!open) {
      createOpen = false;
      editTarget = null;
    }
  }

  function submit(values: ApplicationForm) {
    const onError = (err: Error) => toast.error(`Failed: ${err.message}`);
    if (editTarget) {
      updateApplication.mutate(applicationUpdateInput(editTarget.id, values), {
        onSuccess: () => {
          toast.success("Application updated");
          closeDialog(false);
        },
        onError,
      });
    } else {
      createApplication.mutate(applicationCreateInput(values), {
        onSuccess: () => {
          toast.success("Application created");
          closeDialog(false);
        },
        onError,
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteApplication.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Application deleted");
        deleteTarget = null;
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });
  }
</script>

<div class="space-y-6">
  <PageHeader title="Applications" action="New Application" onAction={() => (createOpen = true)} />

  <ParentFilter
    param="experience_id"
    allLabel="All experiences"
    ariaLabel="Filter by experience"
    options={experienceOptions}
  />

  {#if applications.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={AppWindow}
      title="No applications yet"
      description="Create your first application to add it to the catalog."
      action="New Application"
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
            <Table.Head class="hidden sm:table-cell">Platform</Table.Head>
            <Table.Head class="hidden md:table-cell">Experience</Table.Head>
            <Table.Head class="hidden lg:table-cell">Description</Table.Head>
            <Table.Head class="hidden md:table-cell">Created At</Table.Head>
            <Table.Head class="w-[100px]" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as app (app.id)}
            <Table.Row>
              <Table.Cell><CopyableId value={app.id} /></Table.Cell>
              <Table.Cell class="font-medium">{app.name}</Table.Cell>
              <Table.Cell class="hidden text-sm sm:table-cell">
                {app.teamId ? teamName(teams, app.teamId) : "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground sm:table-cell">
                {app.platform ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm md:table-cell">
                {app.experienceId ? nameOf(experiences, app.experienceId) : "—"}
              </Table.Cell>
              <Table.Cell class="hidden max-w-[200px] truncate text-sm text-muted-foreground lg:table-cell">
                {app.description ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
                {localeDate(app.createdAt)}
              </Table.Cell>
              <Table.Cell>
                <RowActions noun="application" onEdit={() => (editTarget = app)} onDelete={() => (deleteTarget = app)} />
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
    title={editTarget ? "Edit Application" : "New Application"}
    idPrefix="app"
    schema={applicationSchema}
    initial={applicationFormValues(editTarget)}
    {teams}
    parent={{ field: "experience_id", label: "Experience", idSuffix: "experience", options: experienceOptions }}
    extra={{ field: "platform", label: "Platform", idSuffix: "platform", placeholder: "ios / android / web" }}
    namePlaceholder="iOS App"
    isEdit={!!editTarget}
    pending={createApplication.isPending || updateApplication.isPending}
    onSubmit={submit}
  />

  <ConfirmDialog
    open={!!deleteTarget}
    onOpenChange={(open) => {
      if (!open) deleteTarget = null;
    }}
    title="Delete Application"
    description={deleteDescription(deleteTarget?.name)}
    onConfirm={handleDelete}
    loading={deleteApplication.isPending}
  />
</div>
