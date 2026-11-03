<script lang="ts">
  // The console once the browser is signed in; the sign-in screen until then.
  import { m } from "#lib/paraglide/messages.js";
  import RotateCw from "@lucide/svelte/icons/rotate-cw";
  import type { Snippet } from "svelte";
  import SignIn from "#lib/components/auth/sign-in.svelte";
  import CommandPalette from "#lib/components/command-palette.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
  import { createSession } from "#lib/queries/index.js";
  import Header from "./header.svelte";
  import MobileNav from "./mobile-nav.svelte";
  import Sidebar from "./sidebar.svelte";

  let { children }: { children: Snippet } = $props();

  const session = createSession();

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
{:else if !session.data.signedIn}
  <SignIn loginEnabled={session.data.loginEnabled} />
{:else}
  <div class="flex h-screen overflow-hidden">
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => (sidebarCollapsed = !sidebarCollapsed)} />
    <MobileNav bind:open={mobileNavOpen} />
    <div class="flex flex-1 flex-col overflow-hidden">
      <Header onMenuClick={() => (mobileNavOpen = true)} onSearchClick={() => (paletteOpen = true)} />
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        {@render children()}
      </main>
    </div>
  </div>
  <CommandPalette bind:open={paletteOpen} />
{/if}
