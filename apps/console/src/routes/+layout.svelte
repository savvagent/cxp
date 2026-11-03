<script lang="ts">
  // The console's root: its one query client, the toaster, the styles, and the
  // service worker. The shell (navigation, sign-in) is built on top of this.
  import "../app.css";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { onMount, type Snippet } from "svelte";
  import { Toaster } from "svelte-sonner";
  import { queryClient } from "#lib/query-client.js";

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    // Registered from a bundled module, never an inline script: the server's
    // CSP is `script-src 'self'`. Only built consoles have a service worker.
    if (import.meta.env.PROD) {
      void import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
    }
  });
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
<Toaster />
