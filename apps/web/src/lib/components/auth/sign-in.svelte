<script lang="ts">
  // Shown instead of the console while the browser is not signed in, inside
  // the shared shell's signed-out header and footer when the server names the
  // platform (it does whenever console sign-in is configured).
  import { m } from "#lib/paraglide/messages.js";
  import LogIn from "@lucide/svelte/icons/log-in";
  import Zap from "@lucide/svelte/icons/zap";
  import { ConsoleFooter, ConsoleHeader } from "@savvagent/console-ui";
  import { Button } from "@savvagent/console-ui/ui/button";
  import { page } from "$app/state";
  import { loginErrorMessage, loginUrl, returnPath } from "#lib/session.js";

  let { loginEnabled, platformUrl }: { loginEnabled: boolean; platformUrl?: string } = $props();

  // `page.url` is the browser's own URL, `/console` included, and follows
  // client-side navigation.
  const error = $derived(loginErrorMessage(page.url.search));
  const next = $derived(returnPath(page.url));
</script>

{#snippet card()}
  <div class="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 text-center shadow-sm">
    <div class="flex items-center justify-center gap-2 text-lg font-semibold">
      <Zap class="h-5 w-5 text-primary" aria-hidden="true" />
      <h1>{m.signin_title()}</h1>
    </div>
    {#if loginEnabled}
      <p class="text-sm text-muted-foreground">{m.signin_prompt()}</p>
      {#if error}
        <p role="alert" class="text-sm text-destructive">{error}</p>
      {/if}
      <!-- A server route outside the console: a full page load, never the client router. -->
      <Button href={loginUrl(next)} class="w-full" data-sveltekit-reload>
        <LogIn class="h-4 w-4" aria-hidden="true" />
        {m.signin_button()}
      </Button>
    {:else}
      <p class="text-sm text-muted-foreground">{m.signin_not_configured()}</p>
    {/if}
  </div>
{/snippet}

{#if platformUrl}
  <div class="flex min-h-screen flex-col bg-background">
    <!-- No `signedOut` snippet: the card's own button is the way in. -->
    <ConsoleHeader {platformUrl} service="cxp" />
    <main class="flex flex-1 items-center justify-center p-4">
      {@render card()}
    </main>
    <ConsoleFooter {platformUrl} />
  </div>
{:else}
  <main class="flex min-h-screen items-center justify-center bg-background p-4">
    {@render card()}
  </main>
{/if}
