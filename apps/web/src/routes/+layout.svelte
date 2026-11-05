<script lang="ts">
  // The console's root: its one query client, the toaster, the styles, the
  // service worker, and the shell (the sign-in gate, navigation and palette).
  import { m } from "#lib/paraglide/messages.js";
  import "../app.css";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { onMount, type Snippet } from "svelte";
  import RootLayout from "#lib/components/layout/root-layout.svelte";
  import { Toaster } from "#lib/components/ui/sonner/index.js";
  import { resolveAtBoot } from "@savvagent/console-ui";
  import { assertIsLocale, overwriteGetLocale } from "#lib/paraglide/runtime.js";
  import { queryClient } from "#lib/query-client.js";

  // The language, decided before anything renders, by the shared shell: the
  // stored choice, else the browser's, else English. CXP's own runtime is
  // passed so its messages and the shell's always agree. Top-level here, not
  // in `+layout.ts`, so it runs once, synchronously, ahead of the first paint,
  // with no inline script (the server's CSP is `script-src 'self'`).
  //
  // The shell types a runtime's getter as `() => string`; Paraglide's generated
  // runtime narrows it to CXP's locales. The shell only installs one of the six
  // locales both ship, so `assertIsLocale` checks that narrowing rather than
  // casting it.
  resolveAtBoot((get) => overwriteGetLocale(() => assertIsLocale(get())));

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

<svelte:head>
  <title>{m.app_title()}</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
  <RootLayout>
    {@render children()}
  </RootLayout>
</QueryClientProvider>
<Toaster />
