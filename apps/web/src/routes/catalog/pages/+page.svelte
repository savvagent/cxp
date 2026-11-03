<script lang="ts">
  // Port of the React console's src/pages/catalog/pages-page.tsx.
  import FileText from "@lucide/svelte/icons/file-text";
  import { toast } from "svelte-sonner";
  import { page as appPage } from "$app/state";
  import CatalogFormDialog from "#lib/components/catalog/catalog-form-dialog.svelte";
  import {
    deleteDescription,
    nameOf,
    pageCreateInput,
    pageFormValues,
    pageSchema,
    pageUpdateInput,
    teamName,
    type PageForm,
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
    createCreatePage,
    createDeletePage,
    createMyTeams,
    createPages,
    createUpdatePage,
  } from "#lib/queries/index.js";
  import type { Page } from "#lib/types.js";

  const page = 0;

  let createOpen = $state(false);
  let editTarget = $state<Page | null>(null);
  let deleteTarget = $state<Page | null>(null);

  const applicationId = $derived(appPage.url.searchParams.get("application_id") ?? undefined);

  const pages = createPages(() => ({
    applicationId,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }));
  const applicationsQuery = createApplications(() => ({ limit: 200 }));
  const myTeams = createMyTeams();
  const createPage = createCreatePage();
  const updatePage = createUpdatePage();
  const deletePage = createDeletePage();

  const items = $derived(pages.data?.data ?? []);
  const total = $derived(pages.data?.total ?? 0);
  const applications = $derived(applicationsQuery.data?.data ?? []);
  const applicationOptions = $derived(namedOptions(applications));
  const teams = $derived(myTeams.data ?? []);
  const showing = $derived(showingLine(PAGE_SIZE, items.length, total, "pages"));

  function closeDialog(open: boolean) {
    if (!open) {
      createOpen = false;
      editTarget = null;
    }
  }

  function submit(values: PageForm) {
    const onError = (err: Error) => toast.error(`Failed: ${err.message}`);
    if (editTarget) {
      updatePage.mutate(pageUpdateInput(editTarget.id, values), {
        onSuccess: () => {
          toast.success("Page updated");
          closeDialog(false);
        },
        onError,
      });
    } else {
      createPage.mutate(pageCreateInput(values), {
        onSuccess: () => {
          toast.success("Page created");
          closeDialog(false);
        },
        onError,
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deletePage.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Page deleted");
        deleteTarget = null;
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });
  }
</script>

<div class="space-y-6">
  <PageHeader title="Pages" action="New Page" onAction={() => (createOpen = true)} />

  <ParentFilter
    param="application_id"
    allLabel="All applications"
    ariaLabel="Filter by application"
    options={applicationOptions}
  />

  {#if pages.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={FileText}
      title="No pages yet"
      description="Create your first page to add it to the catalog."
      action="New Page"
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
            <Table.Head class="hidden sm:table-cell">Path</Table.Head>
            <Table.Head class="hidden md:table-cell">Application</Table.Head>
            <Table.Head class="hidden lg:table-cell">Description</Table.Head>
            <Table.Head class="hidden md:table-cell">Created At</Table.Head>
            <Table.Head class="w-[100px]" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as pg (pg.id)}
            <Table.Row>
              <Table.Cell><CopyableId value={pg.id} /></Table.Cell>
              <Table.Cell class="font-medium">{pg.name}</Table.Cell>
              <Table.Cell class="hidden text-sm sm:table-cell">
                {pg.teamId ? teamName(teams, pg.teamId) : "—"}
              </Table.Cell>
              <Table.Cell class="hidden font-mono text-sm text-muted-foreground sm:table-cell">
                {pg.path ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm md:table-cell">
                {pg.applicationId ? nameOf(applications, pg.applicationId) : "—"}
              </Table.Cell>
              <Table.Cell class="hidden max-w-[200px] truncate text-sm text-muted-foreground lg:table-cell">
                {pg.description ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
                {localeDate(pg.createdAt)}
              </Table.Cell>
              <Table.Cell>
                <RowActions noun="page" onEdit={() => (editTarget = pg)} onDelete={() => (deleteTarget = pg)} />
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
    title={editTarget ? "Edit Page" : "New Page"}
    idPrefix="page"
    schema={pageSchema}
    initial={pageFormValues(editTarget)}
    {teams}
    parent={{ field: "application_id", label: "Application", idSuffix: "application", options: applicationOptions }}
    extra={{ field: "path", label: "Path", idSuffix: "path", placeholder: "/home" }}
    namePlaceholder="Home"
    isEdit={!!editTarget}
    pending={createPage.isPending || updatePage.isPending}
    onSubmit={submit}
  />

  <ConfirmDialog
    open={!!deleteTarget}
    onOpenChange={(open) => {
      if (!open) deleteTarget = null;
    }}
    title="Delete Page"
    description={deleteDescription(deleteTarget?.name)}
    onConfirm={handleDelete}
    loading={deletePage.isPending}
  />
</div>
