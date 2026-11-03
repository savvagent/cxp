<script lang="ts">
  // The customer list: 50 per page (offset-based), the catalog filters in the
  // URL, a client-side search over the loaded page, a "New Customer" dialog,
  // row navigation to /customers/<id>, and a per-row delete.
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Search from "@lucide/svelte/icons/search";
  import Users from "@lucide/svelte/icons/users";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import {
    catalogFiltersFromUrl,
    withCatalogFilters,
    type CatalogFilterValues,
  } from "#lib/catalog-filters.js";
  import CustomerCatalogFilters from "#lib/components/customers/customer-catalog-filters.svelte";
  import CustomerRowActions from "#lib/components/customers/customer-row-actions.svelte";
  import {
    PAGE_SIZE,
    displayName,
    filterCustomers,
    formatDate,
    pagination,
  } from "#lib/components/customers/customers.js";
  import NewCustomerDialog from "#lib/components/customers/new-customer-dialog.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import * as Table from "#lib/components/ui/table/index.js";
  import { createCustomers } from "#lib/queries/index.js";

  let newDialogOpen = $state(false);
  let search = $state("");
  let offset = $state(0);

  const catalogFilters = $derived(catalogFiltersFromUrl(new URLSearchParams(page.url.search)));

  function handleCatalogChange(values: CatalogFilterValues) {
    const url = new URL(page.url.href);
    url.search = withCatalogFilters(url.searchParams, values).toString();
    // A new history entry, as react-router's `setSearchParams`; focus and
    // scroll stay where they are.
    void goto(url, { reset: false });
    offset = 0;
  }

  const customersQuery = createCustomers(() => ({
    limit: PAGE_SIZE,
    offset,
    ...catalogFilters,
  }));

  const customers = $derived(filterCustomers(customersQuery.data?.data ?? [], search));
  const total = $derived(customersQuery.data?.total ?? 0);
  const paging = $derived(pagination(offset, total));

  function handleRowClick(id: string) {
    void goto(resolve("/customers/[id]", { id }));
  }
</script>

<div class="flex flex-col gap-6">
  <PageHeader
    title="Customers"
    description="Browse and manage customer profiles"
    action="New Customer"
    onAction={() => (newDialogOpen = true)}
  />

  <!-- Catalog filters -->
  <CustomerCatalogFilters value={catalogFilters} onChange={handleCatalogChange} />

  <!-- Search -->
  <div class="relative max-w-sm">
    <Search
      class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      class="pl-9"
      placeholder="Search by name, email, company or tag..."
      value={search}
      oninput={(e) => {
        search = e.currentTarget.value;
        offset = 0; // reset pagination on new search
      }}
      aria-label="Search customers"
    />
  </div>

  <!-- Table -->
  {#if customersQuery.isLoading}
    <LoadingTable rows={8} />
  {:else if customersQuery.isError}
    <EmptyState title="Failed to load customers" description="Check your connection and try again." />
  {:else if customers.length === 0}
    <EmptyState
      icon={Users}
      title={search ? "No customers match your search" : "No customers yet"}
      description={search ? "Try a different search term." : "Create your first customer to get started."}
      action={search ? undefined : "New Customer"}
      onAction={search ? undefined : () => (newDialogOpen = true)}
    />
  {:else}
    <div class="rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Email</Table.Head>
            <Table.Head class="hidden md:table-cell">Company</Table.Head>
            <Table.Head class="hidden lg:table-cell">Tags</Table.Head>
            <Table.Head class="hidden sm:table-cell">Created</Table.Head>
            <Table.Head class="w-10">
              <span class="sr-only">Actions</span>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each customers as customer (customer.id)}
            <Table.Row
              class="cursor-pointer"
              onclick={() => handleRowClick(customer.id)}
              tabindex={0}
              role="button"
              aria-label="View {displayName(customer)}"
              onkeydown={(e) => {
                // Only the row itself: Enter on the actions button opens its menu.
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleRowClick(customer.id);
                }
              }}
            >
              <Table.Cell class="font-medium">
                {#if customer.name != null}
                  {customer.name}
                {:else}
                  <span class="text-muted-foreground italic">unnamed</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">{customer.email}</Table.Cell>
              <Table.Cell class="hidden text-muted-foreground md:table-cell">
                {#if customer.company != null}
                  {customer.company}
                {:else}
                  <span class="text-muted-foreground/50">—</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="hidden lg:table-cell">
                <div class="flex flex-wrap gap-1">
                  {#each customer.tags.slice(0, 3) as tag (tag)}
                    <Badge variant="secondary" class="text-xs">{tag}</Badge>
                  {/each}
                  {#if customer.tags.length > 3}
                    <Badge variant="outline" class="text-xs">+{customer.tags.length - 3}</Badge>
                  {/if}
                </div>
              </Table.Cell>
              <Table.Cell class="hidden text-sm text-muted-foreground sm:table-cell">
                {formatDate(customer.createdAt)}
              </Table.Cell>
              <Table.Cell onclick={(e) => e.stopPropagation()}>
                <CustomerRowActions {customer} />
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  <!-- Pagination -->
  {#if !customersQuery.isLoading && total > PAGE_SIZE && !search}
    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <span>{paging.from}–{paging.to} of {total} customers</span>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => (offset = paging.prevOffset)}
          disabled={!paging.hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft class="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() => (offset = paging.nextOffset)}
          disabled={!paging.hasNext}
          aria-label="Next page"
        >
          Next
          <ChevronRight class="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}

  <NewCustomerDialog bind:open={newDialogOpen} />
</div>
