<script lang="ts">
  // A catalog table row's edit and delete buttons.
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { Button } from "#lib/components/ui/button/index.js";

  let {
    editLabel,
    deleteLabel,
    onEdit,
    onDelete,
  }: {
    /** The buttons' accessible names, e.g. "Edit experience", "Delete experience". */
    editLabel: string;
    deleteLabel: string;
    onEdit: () => void;
    onDelete: () => void;
  } = $props();
</script>

<div class="flex items-center gap-1">
  <Button variant="ghost" size="icon" aria-label={editLabel} onclick={onEdit}>
    <Pencil class="h-4 w-4 text-muted-foreground" />
  </Button>
  <Button variant="ghost" size="icon" aria-label={deleteLabel} onclick={onDelete}>
    <Trash2 class="h-4 w-4 text-muted-foreground" />
  </Button>
</div>
