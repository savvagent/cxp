// The shared shell decides the locale at boot and hands it to CXP's Paraglide
// runtime (`+layout.svelte`, through `assertIsLocale`). That only works while
// both ship the same locales: a locale the shell offers and CXP lacks would
// make every CXP message throw. A console-ui upgrade that changes the list
// fails here, before it reaches a browser.
import { SUPPORTED } from "@savvagent/console-ui";
import { describe, expect, it } from "vitest";
import { locales } from "#lib/paraglide/runtime.js";

describe("the shell's locales", () => {
  it("are exactly CXP's", () => {
    expect([...SUPPORTED].sort()).toEqual([...locales].sort());
  });
});
