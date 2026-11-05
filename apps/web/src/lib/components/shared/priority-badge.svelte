<script lang="ts">
  import { Badge } from "@savvagent/console-ui/ui/badge";
  import { priorityClass, priorityLabel } from "./badges.js";

  let { priority }: { priority: string } = $props();
</script>

<Badge variant="outline" class={priorityClass(priority)}>{priorityLabel(priority)}</Badge>
