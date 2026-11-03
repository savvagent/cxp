<script lang="ts">
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { priorityClass, priorityLabel } from "./badges.js";

  let { priority }: { priority: string } = $props();
</script>

<Badge variant="outline" class={priorityClass(priority)}>{priorityLabel(priority)}</Badge>
