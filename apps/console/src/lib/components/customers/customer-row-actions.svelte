<script lang="ts">
  import MoreHorizontal from "@lucide/svelte/icons/ellipsis";
  import Trash2 from "@lucide/svelte/icons/trash";
  import { toast } from "svelte-sonner";
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
      toast.success(`${displayName(customer)} deleted`);
      confirmOpen = false;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete customer");
    }
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon" aria-label="Actions for {displayName(customer)}">
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item variant="destructive" onSelect={() => (confirmOpen = true)}>
      <Trash2 class="mr-2 h-4 w-4" />
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<ConfirmDialog
  bind:open={confirmOpen}
  title="Delete customer?"
  description="This will permanently delete {displayName(customer)} and cannot be undone."
  onConfirm={handleDelete}
  loading={deleteCustomer.isPending}
/>
