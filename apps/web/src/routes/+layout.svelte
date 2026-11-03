<script lang="ts">
  // The console's root: its one query client, the toaster, the styles, the
  // service worker, and the shell (the sign-in gate, navigation and palette).
  import "../app.css";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { onMount, type Snippet } from "svelte";
  import RootLayout from "#lib/components/layout/root-layout.svelte";
  import { Toaster } from "#lib/components/ui/sonner/index.js";
  import { queryClient } from "#lib/query-client.js";

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    // Registered from a bundled module, never an inline script: the server's
    // CSP is `script-src 'self'`. Only built consoles have a service worker.
    if (import.meta.env.PROD) {
      import("virtual:pwa-register")
        .then(({ registerSW }) => registerSW({ immediate: true }))
        .catch((err: unknown) => console.error("Could not register the service worker", err));
    }
  });
</script>

<QueryClientProvider client={queryClient}>
  <RootLayout>
    {@render children()}
  </RootLayout>
</QueryClientProvider>
<Toaster />
