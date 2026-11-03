<script lang="ts">
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
    /** While true the confirm button is disabled and reads "Deleting...". */
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
      <Button variant="outline" onclick={cancel}>Cancel</Button>
      <Button variant="destructive" onclick={onConfirm} disabled={loading}>
        {loading ? "Deleting..." : "Delete"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
