<script lang="ts">
  // `/console/` is the dashboard. The redirect waits for the root layout's
  // sign-in gate, which renders this page only once signed in, as React's
  // `<Navigate>` inside the shell did: signed out, `/console/` keeps its
  // `?login_error=` for the sign-in screen to show.
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";

  onMount(() => {
    void goto(resolve("/dashboard"), { replaceState: true });
  });
</script>
