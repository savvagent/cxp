<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";

  let {
    open = $bindable(false),
    onOpenChange,
    title,
    description,
    onConfirm,
    loading = false,
  }: {
    /** Bindable (`bind:open`); `onOpenChange` hears every change the dialog makes itself. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    /** While true the confirm button is disabled and reads "Deleting..." (`common_deleting`). */
    loading?: boolean;
  } = $props();

  function cancel() {
    open = false;
    onOpenChange?.(false);
  }
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={cancel}>{m.common_cancel()}</Button>
      <Button variant="destructive" onclick={onConfirm} disabled={loading}>
        {loading ? m.common_deleting() : m.common_delete()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
