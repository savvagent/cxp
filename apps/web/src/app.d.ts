// See https://svelte.dev/docs/kit/types#app.d.ts
// `virtual:pwa-register`, which the root layout registers the service worker with.
/// <reference types="@unplugin-pwa/core/vanillajs" />

declare global {
  namespace App {}
}

export {};
