<script lang="ts">
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { statusClass, statusLabel } from "./badges.js";

  let { status }: { status: string } = $props();
</script>

<Badge variant="outline" class={statusClass(status)}>{statusLabel(status)}</Badge>
