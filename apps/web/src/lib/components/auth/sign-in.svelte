<script lang="ts">
  // Shown instead of the console while the browser is not signed in.
  import LogIn from "@lucide/svelte/icons/log-in";
  import Zap from "@lucide/svelte/icons/zap";
  import { page } from "$app/state";
  import { Button } from "#lib/components/ui/button/index.js";
  import { loginErrorMessage, loginUrl, returnPath } from "#lib/session.js";

  let { loginEnabled }: { loginEnabled: boolean } = $props();

  // `page.url` is the browser's own URL, `/console` included, and follows
  // client-side navigation.
  const error = $derived(loginErrorMessage(page.url.search));
  const next = $derived(returnPath(page.url));
</script>

<main class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 text-center shadow-sm">
    <div class="flex items-center justify-center gap-2 text-lg font-semibold">
      <Zap class="h-5 w-5 text-primary" aria-hidden="true" />
      <h1>Sign in to CXP</h1>
    </div>
    {#if loginEnabled}
      <p class="text-sm text-muted-foreground">Sign in with your Savvagent account to continue.</p>
      {#if error}
        <p role="alert" class="text-sm text-destructive">{error}</p>
      {/if}
      <!-- A server route outside the console: a full page load, never the client router. -->
      <Button href={loginUrl(next)} class="w-full" data-sveltekit-reload>
        <LogIn class="h-4 w-4" aria-hidden="true" />
        Sign in with Savvagent
      </Button>
    {:else}
      <p class="text-sm text-muted-foreground">
        Console sign-in is not configured on this server. API and MCP clients authenticate with their own
        Savvagent tokens.
      </p>
    {/if}
  </div>
</main>
