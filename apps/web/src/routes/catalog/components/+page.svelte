<script lang="ts">
  // Port of the React console's src/pages/catalog/components-page.tsx.
  import Puzzle from "@lucide/svelte/icons/puzzle";
  import { toast } from "svelte-sonner";
  import { page as appPage } from "$app/state";
  import CatalogFormDialog from "#lib/components/catalog/catalog-form-dialog.svelte";
  import {
    componentCreateInput,
    componentFormValues,
    componentSchema,
    componentUpdateInput,
    deleteDescription,
    pageName,
    showingLine,
    teamName,
    type ComponentForm,
  } from "#lib/components/catalog/forms.js";
  import { pageOptions as toPageOptions } from "#lib/components/catalog/options.js";
  import ParentFilter from "#lib/components/catalog/parent-filter.svelte";
  import RowActions from "#lib/components/catalog/row-actions.svelte";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import CopyableId from "#lib/components/shared/copyable-id.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import * as Table from "#lib/components/ui/table/index.js";
  import {
    createComponents,
    createCreateComponent,
    createDeleteComponent,
    createMyTeams,
    createPages,
    createUpdateComponent,
  } from "#lib/queries/index.js";
  import type { Component } from "#lib/types.js";

  const PAGE_SIZE = 20;
  const currentPage = 0;

  let createOpen = $state(false);
  let editTarget = $state<Component | null>(null);
  let deleteTarget = $state<Component | null>(null);

  const pageId = $derived(appPage.url.searchParams.get("page_id") ?? undefined);

  const components = createComponents(() => ({
    pageId,
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
  }));
  const pagesQuery = createPages(() => ({ limit: 200 }));
  const myTeams = createMyTeams();
  const createComponent = createCreateComponent();
  const updateComponent = createUpdateComponent();
  const deleteComponent = createDeleteComponent();

  const items = $derived(components.data?.data ?? []);
  const total = $derived(components.data?.total ?? 0);
  const pages = $derived(pagesQuery.data?.data ?? []);
  const pageOptions = $derived(toPageOptions(pages));
  const teams = $derived(myTeams.data ?? []);
  const showing = $derived(showingLine(PAGE_SIZE, items.length, total, "components"));

  function closeDialog(open: boolean) {
    if (!open) {
      createOpen = false;
      editTarget = null;
    }
  }

  function submit(values: ComponentForm) {
    const onError = (err: Error) => toast.error(`Failed: ${err.message}`);
    if (editTarget) {
      updateComponent.mutate(componentUpdateInput(editTarget.id, values), {
        onSuccess: () => {
          toast.success("Component updated");
          closeDialog(false);
        },
        onError,
      });
    } else {
      createComponent.mutate(componentCreateInput(values), {
        onSuccess: () => {
          toast.success("Component created");
          closeDialog(false);
        },
        onError,
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteComponent.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Component deleted");
        deleteTarget = null;
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });
  }
</script>

<div class="space-y-6">
  <PageHeader title="Components" action="New Component" onAction={() => (createOpen = true)} />

  <ParentFilter
    param="page_id"
    allLabel="All pages"
    ariaLabel="Filter by page"
    options={pageOptions}
    class="w-[220px]"
  />

  {#if components.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={Puzzle}
      title="No components yet"
      description="Create your first component to add it to the catalog."
      action="New Component"
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
            <Table.Head class="hidden sm:table-cell">Component Type</Table.Head>
            <Table.Head class="hidden md:table-cell">Page</Table.Head>
            <Table.Head class="hidden lg:table-cell">Description</Table.Head>
            <Table.Head class="hidden md:table-cell">Created At</Table.Head>
            <Table.Head class="w-[100px]" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as comp (comp.id)}
            <Table.Row>
              <Table.Cell><CopyableId value={comp.id} /></Table.Cell>
              <Table.Cell class="font-medium">{comp.name}</Table.Cell>
              <Table.Cell class="hidden text-sm sm:table-cell">
                {comp.teamId ? teamName(teams, comp.teamId) : "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground sm:table-cell">
                {comp.componentType ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm md:table-cell">
                {comp.pageId ? pageName(pages, comp.pageId) : "—"}
              </Table.Cell>
              <Table.Cell class="hidden max-w-[200px] truncate text-sm text-muted-foreground lg:table-cell">
                {comp.description ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
                {new Date(comp.createdAt).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <RowActions noun="component" onEdit={() => (editTarget = comp)} onDelete={() => (deleteTarget = comp)} />
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
    title={editTarget ? "Edit Component" : "New Component"}
    idPrefix="comp"
    schema={componentSchema}
    initial={componentFormValues(editTarget)}
    {teams}
    parent={{ field: "page_id", label: "Page", idSuffix: "page", options: pageOptions }}
    extra={{
      field: "component_type",
      label: "Component Type",
      idSuffix: "type",
      placeholder: "button / form / modal / banner",
    }}
    namePlaceholder="Hero Banner"
    isEdit={!!editTarget}
    pending={createComponent.isPending || updateComponent.isPending}
    onSubmit={submit}
  />

  <ConfirmDialog
    open={!!deleteTarget}
    onOpenChange={(open) => {
      if (!open) deleteTarget = null;
    }}
    title="Delete Component"
    description={deleteDescription(deleteTarget?.name)}
    onConfirm={handleDelete}
    loading={deleteComponent.isPending}
  />
</div>
