import adapter from "@sveltejs/adapter-static";
import tailwindcss from "@tailwindcss/vite";
import { withPwa } from "@vite-pwa/sveltekit";
import { defineConfig } from "vitest/config";
import { APP_SHELL, CONSOLE_BASE, CONSOLE_PATHS, SERVER_ONLY_PATHS } from "./src/pwa.ts";

export default defineConfig({
  plugins: [
    tailwindcss(),
    // SvelteKit 3 takes its configuration here (there is no svelte.config.js);
    // `withPwa` runs the `sveltekit()` plugin itself and adds the service worker.
    withPwa(
      {
        // A static single-page app: the server serves `dist/` under /console/
        // and answers every console path it has no file for with `index.html`.
        adapter: adapter({ pages: "dist", assets: "dist", fallback: "index.html", strict: true }),
        paths: {
          // The binary serves the built console under /console/; `/` belongs to
          // the server (and the connector install page). This is CONSOLE_BASE
          // without its trailing slash, which Kit refuses.
          base: "/console",
          // `index.html` answers every depth of path, so its URLs are absolute.
          relative: false,
        },
        // The server gives `/console/assets/*` its immutable cache header and
        // everything else a revalidating one; `_app` is accepted as it is.
        appDir: "_app",
      },
      {
        strategies: "generateSW",
        registerType: "autoUpdate",
        // Registered from the root layout through `virtual:pwa-register`: the
        // server's CSP (`script-src 'self'`) refuses an inline registration.
        injectRegister: false,
        kit: { spa: true, adapterFallback: "index.html", trailingSlash: "never" },
        generateSW: {
          // The console's client-side routes get the cached app shell; every
          // other navigation, the server's own paths (the sign-in round trip
          // above all) included, always goes to the network.
          navigateFallback: APP_SHELL,
          navigateFallbackAllowlist: CONSOLE_PATHS,
          navigateFallbackDenylist: SERVER_ONLY_PATHS,
          // The plugin always adds a `prerendered/**` pattern, which a
          // single-page app (nothing prerendered) never matches; strict globbing
          // would fail the build on it. `test/service-worker.test.ts` checks
          // instead that the precache holds the shell and everything it loads.
          globStrict: false,
        },
        manifest: {
          name: "CXP - Customer Experience Platform",
          short_name: "CXP",
          description: "Customer Experience Platform",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          scope: CONSOLE_BASE,
          start_url: CONSOLE_BASE,
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      },
    ),
  ],
  server: {
    // Everything the server answers itself, so `pnpm dev` signs in and calls
    // the API on the dev server's origin, as the built console does.
    proxy: {
      "/api": "http://localhost:8080",
      "/auth": "http://localhost:8080",
      "/mcp": "http://localhost:8080",
      "/.well-known": "http://localhost:8080",
    },
  },
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
