<script lang="ts">
  // A catalog table row's edit and delete buttons.
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { Button } from "#lib/components/ui/button/index.js";

  let {
    noun,
    onEdit,
    onDelete,
  }: {
    /** Lower-case, for the buttons' labels: "Edit experience". */
    noun: string;
    onEdit: () => void;
    onDelete: () => void;
  } = $props();
</script>

<div class="flex items-center gap-1">
  <Button variant="ghost" size="icon" aria-label={`Edit ${noun}`} onclick={onEdit}>
    <Pencil class="h-4 w-4 text-muted-foreground" />
  </Button>
  <Button variant="ghost" size="icon" aria-label={`Delete ${noun}`} onclick={onDelete}>
    <Trash2 class="h-4 w-4 text-muted-foreground" />
  </Button>
</div>
