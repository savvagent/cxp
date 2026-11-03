<script
  lang="ts"
  generics="T extends CatalogRecord, F, ListParams, CreateInput, UpdateData, P extends { id: string; name: string }"
>
  // One catalog level's list page: the parent filter (none for experiences),
  // the first page of records, the create/edit dialog and the delete
  // confirmation. What differs between the levels comes in `config`.
  import { untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import { toastError } from "#lib/errors.js";
  import { page as appPage } from "$app/state";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import CopyableId from "#lib/components/shared/copyable-id.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import * as Table from "#lib/components/ui/table/index.js";
  import { localeDate } from "#lib/format.js";
  import { PAGE_SIZE, showingLine } from "#lib/pagination.js";
  import { createMyTeams } from "#lib/queries/index.js";
  import CatalogFormDialog from "./catalog-form-dialog.svelte";
  import { deleteDescription, teamName } from "./forms.js";
  import type { CatalogListConfig, CatalogRecord } from "./list-page.js";
  import ParentFilter from "./parent-filter.svelte";
  import RowActions from "./row-actions.svelte";

  let { config }: { config: CatalogListConfig<T, F, ListParams, CreateInput, UpdateData, P> } = $props();

  // The levels fetch their first page only (React's page state never changed).
  const currentPage = 0;

  let createOpen = $state(false);
  let editTarget = $state<T | null>(null);
  let deleteTarget = $state<T | null>(null);

  const parentId = $derived(
    config.parent ? (appPage.url.searchParams.get(config.parent.param) ?? undefined) : undefined,
  );

  // A page's config never changes: its queries are created once, at init.
  const { queries, parent } = untrack(() => config);
  const list = queries.list(() => config.listParams({ limit: PAGE_SIZE, offset: currentPage * PAGE_SIZE }, parentId));
  const parentQuery = parent?.list(() => ({ limit: 200 }));
  const myTeams = createMyTeams();
  const createRecord = queries.create();
  const updateRecord = queries.update();
  const deleteRecord = queries.remove();

  const items = $derived(list.data?.data ?? []);
  const total = $derived(list.data?.total ?? 0);
  const parents = $derived(parentQuery?.data?.data ?? []);
  const parentOptions = $derived(config.parent ? config.parent.options(parents) : []);
  const teams = $derived(myTeams.data ?? []);
  const showing = $derived(showingLine(PAGE_SIZE, items.length, total, config.plural));

  function closeDialog(open: boolean) {
    if (!open) {
      createOpen = false;
      editTarget = null;
    }
  }

  async function submit(values: F) {
    const editing = editTarget;
    try {
      if (editing) await updateRecord.mutateAsync(config.form.updateInput(editing.id, values));
      else await createRecord.mutateAsync(config.form.createInput(values));
    } catch (err) {
      toastError(err, "Failed", "prefix");
      return;
    }
    toast.success(`${config.singular} ${editing ? "updated" : "created"}`);
    closeDialog(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRecord.mutateAsync(deleteTarget.id);
    } catch (err) {
      toastError(err, "Failed", "prefix");
      return;
    }
    toast.success(`${config.singular} deleted`);
    deleteTarget = null;
  }
</script>

<div class="space-y-6">
  <PageHeader title={config.title} action={`New ${config.singular}`} onAction={() => (createOpen = true)} />

  {#if config.parent}
    <ParentFilter
      param={config.parent.param}
      allLabel={config.parent.filter.allLabel}
      ariaLabel={config.parent.filter.ariaLabel}
      options={parentOptions}
      class={config.parent.filter.class}
    />
  {/if}

  {#if list.isLoading}
    <LoadingTable />
  {:else if items.length === 0}
    <EmptyState
      icon={config.icon}
      title={`No ${config.plural} yet`}
      description={config.emptyDescription}
      action={`New ${config.singular}`}
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
            {#each config.columns as col (col.head)}
              <Table.Head class={col.headClass}>{col.head}</Table.Head>
            {/each}
            <Table.Head class={config.description.headClass}>Description</Table.Head>
            <Table.Head class="hidden md:table-cell">Created At</Table.Head>
            <Table.Head class="w-[100px]" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as item (item.id)}
            <Table.Row>
              <Table.Cell><CopyableId value={item.id} /></Table.Cell>
              <Table.Cell class="font-medium">{item.name}</Table.Cell>
              <Table.Cell class="hidden text-sm sm:table-cell">
                {item.teamId ? teamName(teams, item.teamId) : "—"}
              </Table.Cell>
              {#each config.columns as col (col.head)}
                <Table.Cell class={col.cellClass}>
                  {col.text(item, parents)}
                </Table.Cell>
              {/each}
              <Table.Cell class={config.description.cellClass}>
                {item.description ?? "—"}
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground md:table-cell">
                {localeDate(item.createdAt)}
              </Table.Cell>
              <Table.Cell>
                <RowActions
                  noun={config.noun}
                  onEdit={() => (editTarget = item)}
                  onDelete={() => (deleteTarget = item)}
                />
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
    title={editTarget ? `Edit ${config.singular}` : `New ${config.singular}`}
    idPrefix={config.form.idPrefix}
    schema={config.form.schema}
    initial={config.form.initial(editTarget)}
    {teams}
    parent={config.parent ? { ...config.parent.field, options: parentOptions } : undefined}
    extra={config.form.extra}
    namePlaceholder={config.form.namePlaceholder}
    isEdit={!!editTarget}
    pending={createRecord.isPending || updateRecord.isPending}
    onSubmit={submit}
  />

  <ConfirmDialog
    open={!!deleteTarget}
    onOpenChange={(open) => {
      if (!open) deleteTarget = null;
    }}
    title={`Delete ${config.singular}`}
    description={deleteDescription(deleteTarget?.name)}
    onConfirm={handleDelete}
    loading={deleteRecord.isPending}
  />
</div>
