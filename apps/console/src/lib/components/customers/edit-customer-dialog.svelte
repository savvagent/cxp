<script lang="ts">
  import { toast } from "svelte-sonner";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";
  import { createUpdateCustomer } from "#lib/queries/index.js";
  import type { Customer } from "#lib/types.js";
  import CustomerFormFields from "./customer-form-fields.svelte";
  import {
    EMPTY_CUSTOMER_FORM,
    customerFormValues,
    displayName,
    parseCustomerForm,
    type CustomerFormErrors,
  } from "./customers.js";

  let { customer, open = $bindable(false) }: { customer: Customer; open?: boolean } = $props();

  const updateCustomer = createUpdateCustomer();

  // The form follows the customer (react-hook-form's `values`): it is loaded
  // from the current customer each time the dialog opens.
  let values = $state({ ...EMPTY_CUSTOMER_FORM });
  let errors = $state<CustomerFormErrors>({});
  let submitted = $state(false);

  $effect.pre(() => {
    if (open) {
      values = customerFormValues(customer);
    }
  });

  function handleClose() {
    values = { ...EMPTY_CUSTOMER_FORM };
    errors = {};
    submitted = false;
    open = false;
  }

  function revalidate() {
    if (!submitted) return;
    const r = parseCustomerForm(values);
    errors = r.ok ? {} : r.errors;
  }

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;
    const r = parseCustomerForm(values);
    if (!r.ok) {
      errors = r.errors;
      return;
    }
    errors = {};
    try {
      await updateCustomer.mutateAsync({ id: customer.id, data: r.data });
      toast.success("Customer updated");
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update customer");
    }
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(o) => {
    if (!o) handleClose();
  }}
>
  <Dialog.Content class="sm:max-w-[480px]">
    <Dialog.Header>
      <Dialog.Title>Edit Customer</Dialog.Title>
      <Dialog.Description>
        Update profile details for {displayName(customer)}.
      </Dialog.Description>
    </Dialog.Header>

    <form {onsubmit} class="space-y-4">
      <CustomerFormFields bind:values {errors} idPrefix="edit-" oninput={revalidate} />

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={handleClose}>Cancel</Button>
        <Button type="submit" disabled={updateCustomer.isPending}>
          {updateCustomer.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
