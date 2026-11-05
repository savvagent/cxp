<script lang="ts">
  // The console once the browser is signed in, inside the shared Savvagent
  // shell (`@savvagent/console-ui`: header, footer, theme); the sign-in screen
  // until then. The sidebar is CXP's own navigation, beside the page.
  import { m } from "#lib/paraglide/messages.js";
  import Menu from "@lucide/svelte/icons/menu";
  import RotateCw from "@lucide/svelte/icons/rotate-cw";
  import Search from "@lucide/svelte/icons/search";
  import { ConsoleFooter, ConsoleHeader, reconcile } from "@savvagent/console-ui";
  import { Button } from "@savvagent/console-ui/ui/button";
  import { Skeleton } from "@savvagent/console-ui/ui/skeleton";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import SignIn from "#lib/components/auth/sign-in.svelte";
  import CommandPalette from "#lib/components/command-palette.svelte";
  import { createSession } from "#lib/queries/index.js";
  import { signOut, toConsoleSession } from "#lib/session.js";
  import MobileNav from "./mobile-nav.svelte";
  import { routeTitle } from "./nav.js";
  import Sidebar from "./sidebar.svelte";

  let { children }: { children: Snippet } = $props();

  const session = createSession();
  const shellSession = $derived(session.data?.signedIn ? toConsoleSession(session.data) : undefined);
  const title = $derived(routeTitle(page.url.pathname));

  // The account's language, once the session carries it. The server does not
  // send one yet, so this is `undefined` and changes nothing; `null` would mean
  // "no choice", leaving the browser's language in charge.
  $effect(() => {
    if (session.data?.signedIn) reconcile(session.data.user.locale);
  });

  let sidebarCollapsed = $state(false);
  let mobileNavOpen = $state(false);
  let paletteOpen = $state(false);
</script>

{#if session.isPending}
  <div class="flex min-h-screen items-center justify-center p-4" aria-busy="true" aria-label={m.shell_checking_sign_in()}>
    <Skeleton class="h-32 w-full max-w-sm rounded-lg" />
  </div>
{:else if session.isError}
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-sm text-muted-foreground"
    aria-busy={session.isFetching}
  >
    <p role="alert">{m.shell_session_unreachable()}</p>
    <Button variant="outline" size="sm" disabled={session.isFetching} onclick={() => void session.refetch()}>
      <RotateCw class="h-4 w-4" />
      {m.common_try_again()}
    </Button>
  </div>
{:else if !session.data.signedIn || !shellSession}
  <SignIn loginEnabled={session.data.loginEnabled} platformUrl={session.data.signedIn ? undefined : session.data.platformUrl} />
{:else}
  <div class="flex h-screen flex-col overflow-hidden">
    <ConsoleHeader session={shellSession} service="cxp" onSignOut={signOut}>
      {#snippet nav()}
        <Button variant="ghost" size="icon" class="md:hidden" aria-label={m.shell_open_navigation()} onclick={() => (mobileNavOpen = true)}>
          <Menu class="h-5 w-5" />
        </Button>
        <Button variant="outline" size="sm" class="hidden gap-2 text-muted-foreground sm:flex" onclick={() => (paletteOpen = true)}>
          <Search class="h-4 w-4" />
          <span>{m.shell_search()}</span>
          <kbd class="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
        </Button>
      {/snippet}
    </ConsoleHeader>
    <div class="flex flex-1 overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => (sidebarCollapsed = !sidebarCollapsed)} />
      <MobileNav bind:open={mobileNavOpen} />
      <div class="flex flex-1 flex-col overflow-y-auto">
        <main class="flex-1 p-4 lg:p-6">
          <!-- The page's heading for assistive tech: the route title the old top bar showed. -->
          <h1 class="sr-only">{title}</h1>
          {@render children()}
        </main>
        <ConsoleFooter platformUrl={shellSession.platformUrl} />
      </div>
    </div>
  </div>
  <CommandPalette bind:open={paletteOpen} />
{/if}
