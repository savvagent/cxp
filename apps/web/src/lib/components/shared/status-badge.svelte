<script lang="ts">
  import { Badge } from "@savvagent/console-ui/ui/badge";
  import { statusClass, statusLabel } from "./badges.js";

  let { status }: { status: string } = $props();
</script>

<Badge variant="outline" class={statusClass(status)}>{statusLabel(status)}</Badge>
