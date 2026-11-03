<script lang="ts">
  import { toast } from "svelte-sonner";
  import { toastError } from "#lib/errors.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";
  import { createCreateCustomer } from "#lib/queries/index.js";
  import CustomerFormFields from "./customer-form-fields.svelte";
  import {
    EMPTY_CUSTOMER_FORM,
    parseCustomerForm,
    type CustomerFormErrors,
  } from "./customers.js";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const createCustomer = createCreateCustomer();

  let values = $state({ ...EMPTY_CUSTOMER_FORM });
  let errors = $state<CustomerFormErrors>({});
  // Like react-hook-form: validate on submit, then again on every change.
  let submitted = $state(false);

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
      await createCustomer.mutateAsync(r.data);
    } catch (err) {
      toastError(err, "Failed to create customer");
      return;
    }
    toast.success("Customer created");
    handleClose();
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
      <Dialog.Title>New Customer</Dialog.Title>
      <Dialog.Description>
        Add a new customer to your CXP database. Email is required.
      </Dialog.Description>
    </Dialog.Header>

    <form {onsubmit} class="space-y-4">
      <CustomerFormFields bind:values {errors} placeholders oninput={revalidate} />

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={handleClose}>Cancel</Button>
        <Button type="submit" disabled={createCustomer.isPending}>
          {createCustomer.isPending ? "Creating..." : "Create Customer"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
