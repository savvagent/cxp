<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
  import MoreHorizontal from "@lucide/svelte/icons/ellipsis";
  import Trash2 from "@lucide/svelte/icons/trash";
  import { toast } from "svelte-sonner";
  import { toastError } from "#lib/errors.js";
  import ConfirmDialog from "#lib/components/shared/confirm-dialog.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
  import { createDeleteCustomer } from "#lib/queries/index.js";
  import type { Customer } from "#lib/types.js";
  import { displayName } from "./customers.js";

  let { customer }: { customer: Customer } = $props();

  let confirmOpen = $state(false);
  const deleteCustomer = createDeleteCustomer();

  async function handleDelete() {
    try {
      await deleteCustomer.mutateAsync(customer.id);
    } catch (err) {
      toastError(err, m.customers_delete_failed());
      return;
    }
    toast.success(m.customers_deleted({ name: displayName(customer) }));
    confirmOpen = false;
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon" aria-label={m.customers_row_actions({ name: displayName(customer) })}>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item variant="destructive" onSelect={() => (confirmOpen = true)}>
      <Trash2 class="mr-2 h-4 w-4" />
      {m.common_delete()}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<ConfirmDialog
  bind:open={confirmOpen}
  title={m.customers_delete_title()}
  description={m.customers_delete_description({ name: displayName(customer) })}
  onConfirm={handleDelete}
  loading={deleteCustomer.isPending}
/>
