<script lang="ts">
  // The tickets list's "New Ticket" dialog: the same fields, zod validation
  // (on submit, then on every edit), payload and toasts as the React console's.
  import { m } from "#lib/paraglide/messages.js";
  import { toast } from "svelte-sonner";
  import { toastError } from "#lib/errors.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { Textarea } from "#lib/components/ui/textarea/index.js";
  import { NONE, fromOptionalSelect, validate } from "#lib/forms.js";
  import { createCreateTicket } from "#lib/queries/index.js";
  import {
    CHANNEL_OPTIONS,
    PRIORITY_OPTIONS,
    createTicketSchema,
    emptyCreateTicketForm,
    optionLabel,
    toCreateTicketInput,
    type Option,
  } from "./tickets.js";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const createTicket = createCreateTicket();

  let form = $state(emptyCreateTicketForm());
  // The selects' own values: "" shows the placeholder, NONE shows "None".
  let priorityChoice = $state("");
  let channelChoice = $state("");
  // Errors show once a submit has been tried, then follow every edit.
  let attempted = $state(false);

  const values = $derived({
    ...form,
    priority: fromOptionalSelect(priorityChoice),
    channel: fromOptionalSelect(channelChoice),
  });
  const validation = $derived(validate(createTicketSchema, values));
  const errors = $derived(attempted && !validation.ok ? validation.errors : {});

  function reset() {
    form = emptyCreateTicketForm();
    priorityChoice = "";
    channelChoice = "";
    attempted = false;
  }

  function close() {
    open = false;
    reset();
  }

  function onOpenChange(next: boolean) {
    if (!next) reset();
  }

  function choiceLabel(options: Option[], choice: string, placeholder: string) {
    if (!choice) return placeholder;
    if (choice === NONE) return m.common_none();
    return optionLabel(options, choice);
  }

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    attempted = true;
    if (!validation.ok) return;
    try {
      await createTicket.mutateAsync(toCreateTicketInput(validation.data));
    } catch (err) {
      toastError(err, m.ticket_create_failed(), "fixed");
      return;
    }
    toast.success(m.ticket_created());
    close();
  }
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{m.tickets_new()}</Dialog.Title>
    </Dialog.Header>

    <form {onsubmit} class="space-y-4" novalidate>
      <div class="space-y-1.5">
        <Label for="customer_id">{m.label_customer_id()}</Label>
        <Input
          id="customer_id"
          placeholder={m.ticket_customer_id_placeholder()}
          bind:value={form.customer_id}
          aria-invalid={!!errors.customer_id}
        />
        {#if errors.customer_id}
          <p class="text-xs text-destructive" role="alert">{errors.customer_id}</p>
        {/if}
      </div>

      <div class="space-y-1.5">
        <Label for="subject">{m.label_subject()} <span aria-hidden="true">*</span></Label>
        <Input
          id="subject"
          placeholder={m.ticket_subject_placeholder()}
          bind:value={form.subject}
          aria-invalid={!!errors.subject}
        />
        {#if errors.subject}
          <p class="text-xs text-destructive" role="alert">{errors.subject}</p>
        {/if}
      </div>

      <div class="space-y-1.5">
        <Label for="description">{m.label_description()}</Label>
        <Textarea
          id="description"
          placeholder={m.ticket_description_placeholder()}
          rows={3}
          bind:value={form.description}
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <Label for="priority">{m.label_priority()}</Label>
          <Select.Root type="single" bind:value={priorityChoice}>
            <Select.Trigger id="priority" class="w-full" aria-label={m.ticket_select_priority()}>
              {choiceLabel(PRIORITY_OPTIONS, priorityChoice, m.ticket_select_priority())}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={NONE} label={m.common_none()} />
              {#each PRIORITY_OPTIONS as opt (opt.value)}
                <Select.Item value={opt.value} label={opt.label} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="space-y-1.5">
          <Label for="channel">{m.label_channel()}</Label>
          <Select.Root type="single" bind:value={channelChoice}>
            <Select.Trigger id="channel" class="w-full" aria-label={m.ticket_select_channel()}>
              {choiceLabel(CHANNEL_OPTIONS, channelChoice, m.ticket_select_channel())}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={NONE} label={m.common_none()} />
              {#each CHANNEL_OPTIONS as opt (opt.value)}
                <Select.Item value={opt.value} label={opt.label} />
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={close}>{m.common_cancel()}</Button>
        <Button type="submit" disabled={createTicket.isPending}>
          {createTicket.isPending ? m.common_creating() : m.ticket_create()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
