<script lang="ts">
  // The customer list: 50 per page (offset-based), the catalog filters in the
  // URL, a client-side search over the loaded page, a "New Customer" dialog,
  // row navigation to /customers/<id>, and a per-row delete.
  import { m } from "#lib/paraglide/messages.js";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Search from "@lucide/svelte/icons/search";
  import Users from "@lucide/svelte/icons/users";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { catalogFiltersFromUrl } from "#lib/catalog-filters.js";
  import CatalogFilterBar from "#lib/components/catalog/catalog-filter-bar.svelte";
  import CustomerRowActions from "#lib/components/customers/customer-row-actions.svelte";
  import { displayName, filterCustomers } from "#lib/components/customers/customers.js";
  import NewCustomerDialog from "#lib/components/customers/new-customer-dialog.svelte";
  import EmptyState from "#lib/components/shared/empty-state.svelte";
  import { LoadingTable } from "#lib/components/shared/loading-state.js";
  import PageHeader from "#lib/components/shared/page-header.svelte";
  import { Badge } from "@savvagent/console-ui/ui/badge";
  import { Button } from "@savvagent/console-ui/ui/button";
  import { Input } from "@savvagent/console-ui/ui/input";
  import * as Table from "@savvagent/console-ui/ui/table";
  import { formatDate, formatNumber } from "#lib/format.js";
  import { CUSTOMER_PAGE_SIZE, pageWindow } from "#lib/pagination.js";
  import { createCustomers } from "#lib/queries/index.js";
  import { searchOf } from "#lib/url-state.js";

  let newDialogOpen = $state(false);
  let search = $state("");
  /** Zero-based page number; local state, as in the React console, not the URL. */
  let pageIndex = $state(0);

  const catalogFilters = $derived(catalogFiltersFromUrl(searchOf(page.url)));

  const customersQuery = createCustomers(() => ({
    limit: CUSTOMER_PAGE_SIZE,
    offset: pageIndex * CUSTOMER_PAGE_SIZE,
    ...catalogFilters,
  }));

  const customers = $derived(filterCustomers(customersQuery.data?.data ?? [], search));
  const total = $derived(customersQuery.data?.total ?? 0);
  const paging = $derived(pageWindow(total, pageIndex, CUSTOMER_PAGE_SIZE));

  function handleRowClick(id: string) {
    void goto(resolve("/customers/[id]", { id }));
  }
</script>

<div class="flex flex-col gap-6">
  <PageHeader
    title={m.nav_customers()}
    description={m.customers_description()}
    action={m.customers_new()}
    onAction={() => (newDialogOpen = true)}
  />

  <!-- Catalog filters -->
  <!-- The bar writes the filters to the URL itself; a change returns to the first page. -->
  <CatalogFilterBar onChange={() => (pageIndex = 0)} />

  <!-- Search -->
  <div class="relative max-w-sm">
    <Search
      class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      class="pl-9"
      placeholder={m.customers_search_placeholder()}
      value={search}
      oninput={(e) => {
        search = e.currentTarget.value;
        pageIndex = 0; // reset pagination on new search
      }}
      aria-label={m.customers_search_label()}
    />
  </div>

  <!-- Table -->
  {#if customersQuery.isLoading}
    <LoadingTable rows={8} />
  {:else if customersQuery.isError}
    <EmptyState title={m.customers_load_failed()} description={m.common_check_connection()} />
  {:else if customers.length === 0}
    <EmptyState
      icon={Users}
      title={search ? m.customers_no_match() : m.customers_empty()}
      description={search ? m.customers_try_different() : m.customers_empty_description()}
      action={search ? undefined : m.customers_new()}
      onAction={search ? undefined : () => (newDialogOpen = true)}
    />
  {:else}
    <div class="rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{m.label_name()}</Table.Head>
            <Table.Head>{m.label_email()}</Table.Head>
            <Table.Head class="hidden md:table-cell">{m.label_company()}</Table.Head>
            <Table.Head class="hidden lg:table-cell">{m.label_tags()}</Table.Head>
            <Table.Head class="hidden sm:table-cell">{m.label_created()}</Table.Head>
            <Table.Head class="w-10">
              <span class="sr-only">{m.common_actions()}</span>
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
              aria-label={m.customers_view({ name: displayName(customer) })}
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
                  <span class="text-muted-foreground italic">{m.customers_unnamed()}</span>
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
  {#if !customersQuery.isLoading && total > CUSTOMER_PAGE_SIZE && !search}
    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {m.customers_range({ from: formatNumber(paging.from), to: formatNumber(paging.to), total: formatNumber(total) })}
      </span>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => (pageIndex -= 1)}
          disabled={!paging.hasPrev}
          aria-label={m.common_previous_page()}
        >
          <ChevronLeft class="mr-1 h-4 w-4" />
          {m.common_previous()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() => (pageIndex += 1)}
          disabled={!paging.hasNext}
          aria-label={m.common_next_page()}
        >
          {m.common_next()}
          <ChevronRight class="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}

  <NewCustomerDialog bind:open={newDialogOpen} />
</div>
