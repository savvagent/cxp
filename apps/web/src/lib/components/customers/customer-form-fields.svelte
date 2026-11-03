<script lang="ts">
  // The create and edit customer forms' fields, as the React dialogs laid them
  // out; `idPrefix` keeps the two forms' element ids apart ("" and "edit-").
  import { m } from "#lib/paraglide/messages.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import type { CustomerForm, CustomerFormErrors } from "./customers.js";

  let {
    values = $bindable(),
    errors,
    idPrefix = "",
    placeholders = false,
    oninput,
  }: {
    values: Required<CustomerForm>;
    errors: CustomerFormErrors;
    idPrefix?: string;
    /** The new-customer form shows example placeholders; the edit form does not. */
    placeholders?: boolean;
    oninput?: () => void;
  } = $props();
</script>

<!-- Email -->
<div class="space-y-1.5">
  <Label for="{idPrefix}email">
    {m.label_email()} <span aria-hidden="true" class="text-destructive">*</span>
  </Label>
  <Input
    id="{idPrefix}email"
    name="email"
    type="email"
    autocomplete="email"
    placeholder={placeholders ? "customer@example.com" : undefined}
    aria-required="true"
    aria-invalid={errors.email ? "true" : undefined}
    aria-describedby={errors.email ? `${idPrefix}email-error` : undefined}
    bind:value={values.email}
    {oninput}
  />
  {#if errors.email}
    <p id="{idPrefix}email-error" role="alert" class="text-xs text-destructive">
      {errors.email}
    </p>
  {/if}
</div>

<!-- Name -->
<div class="space-y-1.5">
  <Label for="{idPrefix}name">{m.label_name()}</Label>
  <Input
    id="{idPrefix}name"
    name="name"
    autocomplete="name"
    placeholder={placeholders ? m.customer_name_placeholder() : undefined}
    bind:value={values.name}
    {oninput}
  />
</div>

<!-- Phone -->
<div class="space-y-1.5">
  <Label for="{idPrefix}phone">{m.label_phone()}</Label>
  <Input
    id="{idPrefix}phone"
    name="phone"
    type="tel"
    autocomplete="tel"
    placeholder={placeholders ? "+1 555 000 0000" : undefined}
    bind:value={values.phone}
    {oninput}
  />
</div>

<!-- Company -->
<div class="space-y-1.5">
  <Label for="{idPrefix}company">{m.label_company()}</Label>
  <Input
    id="{idPrefix}company"
    name="company"
    autocomplete="organization"
    placeholder={placeholders ? "Acme Corp" : undefined}
    bind:value={values.company}
    {oninput}
  />
</div>

<!-- Tags -->
<div class="space-y-1.5">
  <Label for="{idPrefix}tags">{m.label_tags()}</Label>
  <Input
    id="{idPrefix}tags"
    name="tags"
    placeholder={m.customer_tags_placeholder()}
    bind:value={values.tags}
    {oninput}
  />
</div>
